import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { connectDB, User, Ticket, Comment, Notification, SystemConfig, Project } from './database.js';
import { generateToken, protect, authorize, normalizeRole } from './auth.js';
import { POINT_VALUES, ELIGIBLE_ROLES, TIER_RANK, computeTier } from './gamification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const canAccessTicket = async (user, ticket) => {
  if (!user || !ticket) return false;
  const userId = user._id.toString();
  const createdById = (ticket.createdBy?._id || ticket.createdBy)?.toString();
  const assignedToId = (ticket.assignedTo?._id || ticket.assignedTo)?.toString();

  if (user.role === 'admin') return true;
  
  if (user.role === 'team_leader') {
    // TL sees their own, assigned, or anything in their projects
    if (createdById === userId || assignedToId === userId) return true;
    if (ticket.project) {
      const proj = await Project.findOne({ name: ticket.project, teamLeader: user._id });
      if (proj) return true;
    }
    return false;
  }

  if (user.role === 'employee') {
    return createdById === userId || assignedToId === userId;
  }

  if (user.role === 'hr') {
    return ticket.type === 'hr' || createdById === userId || assignedToId === userId;
  }
  
  return false;
};

async function dispatchNotifications(ticket, message, initiatorId, initiatorRole, projectName = '', activityDetails = '') {
  const notificationDocs = [];
  const involvedUserIds = new Set();
  
  // 1. Admins always get notified
  const admins = await User.find({ role: 'admin', status: 1 }).select('_id');
  admins.forEach(a => involvedUserIds.add(a._id.toString()));

  // 2. Project Team Leader
  const finalProjectName = projectName || ticket.project || '';
  if (finalProjectName) {
    const proj = await Project.findOne({ name: finalProjectName }).select('teamLeader');
    if (proj?.teamLeader) involvedUserIds.add(proj.teamLeader.toString());
  }

  // 3. Assignee
  const assignedToId = ticket.assignedTo?._id?.toString() || ticket.assignedTo?.toString();
  if (assignedToId) involvedUserIds.add(assignedToId);

  // 4. Creator
  const createdById = ticket.createdBy?._id?.toString() || ticket.createdBy?.toString();
  if (createdById) involvedUserIds.add(createdById);

  // Filter out the initiator and build docs
  involvedUserIds.forEach(uid => {
    if (uid !== initiatorId.toString()) {
      notificationDocs.push({
        userId: uid,
        ticketId: ticket._id,
        projectName: finalProjectName,
        activityDetails: activityDetails || message,
        message
      });
    }
  });

  if (notificationDocs.length > 0) {
    await Notification.insertMany(notificationDocs);
  }
}

async function awardBugPoints(ticketId) {
  // Atomic claim — prevents double-award under concurrent close requests.
  const claim = await Ticket.findOneAndUpdate(
    { _id: ticketId, type: 'bug', status: 'completed', pointsAwarded: { $ne: true } },
    { $set: { pointsAwarded: true, pointsAwardedAt: new Date() } },
    { new: true }
  );
  if (!claim) return null;

  const reporter = await User.findById(claim.createdBy);
  if (!reporter || !ELIGIBLE_ROLES.includes(reporter.role)) {
    // Flag stays set so we don't retry on every status change.
    return null;
  }

  const amount = POINT_VALUES[claim.priority] || 0;
  claim.pointsAwardedAmount = amount;
  claim.pointsAwardedTo = reporter._id;
  claim.pointsAwardedPriority = claim.priority;
  await claim.save();

  reporter.points = (reporter.points || 0) + amount;
  const newTier = computeTier(reporter.points);
  const oldTier = reporter.currentBadge || 'none';
  let unlockedTier = null;
  if (TIER_RANK[newTier] > TIER_RANK[oldTier]) {
    reporter.currentBadge = newTier;
    reporter.badgesEarned.push({ tier: newTier, earnedAt: new Date() });
    reporter.rewardsClaimed.push({ tier: newTier, unlockedAt: new Date(), fulfilled: false });
    unlockedTier = newTier;
  }
  await reporter.save();

  if (unlockedTier) {
    await Notification.create({
      userId: reporter._id,
      message: `🏆 You unlocked the ${unlockedTier} badge! Keep finding bugs.`,
      ticketId: claim._id
    });
  }

  return { amount, newTier: unlockedTier };
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'public/uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

const DEFAULT_ROLE_PERMISSIONS = {
  employee: ['tickets:create', 'tickets:read:own', 'tickets:comment:any'],
  team_leader: ['tickets:read:all', 'tickets:update:all', 'tickets:comment:any'],
  hr: ['tickets:read:assigned', 'tickets:update:assigned', 'tickets:comment:any'],
  admin: ['*']
};

const getSystemConfig = async () => {
  let config = await SystemConfig.findOne({ key: 'global' });
  if (!config) {
    config = await SystemConfig.create({
      key: 'global',
      settings: {
        allowSelfRegistration: true,
        allowEmployeeSelfRegistration: true,
        maintenanceMode: false,
        defaultPriority: 'low'
      },
      rolePermissions: DEFAULT_ROLE_PERMISSIONS
    });
  }
  return config;
};

const seedAdmin = async () => {
  const adminEmail = 'admin@gmail.com';
  const adminExists = await User.findOne({ email: adminEmail });
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      status: 1
    });
    console.log('✅ Default Admin created: admin@gmail.com / admin@123');
  } else {
    // If user exists but maybe password was different, we can force reset it for the user if they are stuck
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    adminExists.password = hashedPassword;
    adminExists.role = 'admin'; // ensure they are admin
    await adminExists.save();
    console.log('✅ Admin credentials updated: admin@gmail.com / admin@123');
  }
};

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = normalizeRole(role);
  const config = await getSystemConfig();

  if (!config.settings?.allowSelfRegistration) {
    return res.status(403).json({ message: 'Self-registration is currently disabled.' });
  }

  // Self-registration is open to all allowed roles
  const allowedSelfRegisterRoles = ['employee', 'team_leader', 'hr', 'admin'];
  if (normalizedRole && !allowedSelfRegisterRoles.includes(normalizedRole)) {
    return res.status(403).json({ message: 'Invalid role specified.' });
  }

  const userExists = await User.findOne({ email: cleanEmail });
  if (userExists) {
    if (userExists.status === 1) {
      return res.status(400).json({ message: 'User already exists' });
    } else {
      // Reactivate user
      const hashedPassword = await bcrypt.hash(password, 10);
      userExists.name = name;
      userExists.password = hashedPassword;
      userExists.role = allowedSelfRegisterRoles.includes(normalizedRole) ? normalizedRole : 'employee';
      userExists.status = 1;
      await userExists.save();
      return res.status(201).json({
        _id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        mobile: userExists.mobile,
        role: normalizeRole(userExists.role),
        token: generateToken(userExists._id)
      });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashedPassword,
    role: allowedSelfRegisterRoles.includes(normalizedRole) ? normalizedRole : 'employee',
    status: 1
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: normalizeRole(user.role),
      token: generateToken(user._id)
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail, status: 1 });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      user.lastLogin = new Date();
      await user.save();
      
      const normalizedRole = normalizeRole(user.role);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: normalizedRole,
        points: user.points || 0,
        currentBadge: user.currentBadge || 'none',
        token: generateToken(user._id)
      });
    } else {
      console.log(`Failed login attempt for: ${cleanEmail}`);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// Seed a super_admin (only if none exists — call once)
app.post('/api/auth/seed-super-admin', async (req, res) => {
  const { name, email, password, secretKey } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (secretKey !== process.env.SUPER_ADMIN_SECRET) {
    return res.status(403).json({ message: 'Invalid secret key' });
  }

  const exists = await User.findOne({ email: cleanEmail });
  if (exists) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashedPassword,
    role: 'super_admin',
    status: 1
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: 'super_admin',
    token: generateToken(user._id)
  });
});

// ─────────────────────────────────────────────
// TICKET ROUTES
// ─────────────────────────────────────────────

app.get('/api/tickets', protect, async (req, res) => {
  let query = { activeStatus: 1 };

  if (req.user.role === 'employee') {
    // Employees see tickets they raised or are assigned to
    query.$or = [
      { createdBy: req.user._id }, 
      { assignedTo: req.user._id }
    ];
  } else if (req.user.role === 'team_leader') {
    // Team Leaders see tickets in their projects OR where they are creator/assignee
    const ledProjects = await Project.find({ teamLeader: req.user._id }).select('name');
    const projectNames = ledProjects.map(p => p.name);
    query.$or = [
      { project: { $in: projectNames } },
      { createdBy: req.user._id },
      { assignedTo: req.user._id }
    ];
  } else if (req.user.role === 'admin') {
    query = { activeStatus: 1 }; // Admin sees all active tickets

  } else if (req.user.role === 'hr') {
    // HR sees tickets assigned to them and tickets they created
    query.$or = [
      { createdBy: req.user._id },
      { assignedTo: req.user._id }
    ];
  }

  const tickets = await Ticket.find(query)
    .populate('createdBy', 'name role')
    .populate('assignedTo', 'name role')
    .sort({ createdAt: -1 });

  res.json(tickets);
});

app.post('/api/tickets', protect, upload.array('files'), async (req, res) => {
  const { title, description, project, type, priority, category, targetClient, assignedTo } = req.body;
  console.log('🎫 Creating ticket:', { title, type, targetClient, assignedTo, createdBy: req.user._id, role: req.user.role });
  const attachments = req.files ? req.files.map(f => ({ 
    filename: f.originalname, 
    path: `/uploads/${f.filename}` 
  })) : [];
  const config = await getSystemConfig();

  let ticketType = type || 'employee';

  // SLA Logic
  const now = new Date();
  const slaResponseHours = priority === 'high' ? (config.settings?.slaHighResponse || 2) : priority === 'medium' ? (config.settings?.slaMediumResponse || 8) : (config.settings?.slaLowResponse || 24);
  const slaResolutionHours = slaResponseHours * 4;
  const slaResponseDue = new Date(now.getTime() + slaResponseHours * 60 * 60 * 1000);
  const slaResolutionDue = new Date(now.getTime() + slaResolutionHours * 60 * 60 * 1000);
  ticketType = type || 'hr';
  let finalAssignedTo = assignedTo;

  // Auto-assignment logic
  if (!finalAssignedTo) {
    if (ticketType === 'bug') {
      // Find project Team Leader
      const proj = await Project.findOne({ name: project });
      if (proj && proj.teamLeader) {
        finalAssignedTo = proj.teamLeader;
      } else {
        // Fallback to first admin
        const admin = await User.findOne({ role: 'admin', status: 1 });
        if (admin) finalAssignedTo = admin._id;
      }
    } else if (ticketType === 'hr') {
      // Find first available HR user
      const hrUser = await User.findOne({ role: 'hr', status: 1 });
      if (hrUser) {
        finalAssignedTo = hrUser._id;
      } else {
        // Fallback to first admin
        const admin = await User.findOne({ role: 'admin', status: 1 });
        if (admin) finalAssignedTo = admin._id;
      }
    }
  }

  const ticket = await Ticket.create({
    title, description, project, type: ticketType, priority: priority || config.settings?.defaultPriority || 'low',
    category: category || 'General',
    createdBy: req.user._id,
    targetClient: targetClient || null,
    assignedTo: finalAssignedTo || null,
    attachments, slaResponseDue, slaResolutionDue
  });

  const populatedTicket = await Ticket.findById(ticket._id).populate('assignedTo', 'name');
  const assigneeName = populatedTicket.assignedTo?.name || 'Unassigned';
  await dispatchNotifications(ticket, `New ${ticketType.toUpperCase()} raised: ${title} (Proj: ${ticket.project})`, req.user._id, req.user.role, ticket.project, `Title: ${title} | Proj: ${ticket.project} | Assigned to: ${assigneeName} | Category: ${ticket.category} | Priority: ${ticket.priority}`);

  res.status(201).json(ticket);
});

app.get('/api/tickets/:id', protect, async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role');
  if (!ticket || ticket.activeStatus === 0) return res.status(404).json({ message: 'Ticket not found or deleted' });
  if (! (await canAccessTicket(req.user, ticket))) {
    return res.status(403).json({ message: 'Not authorized to view this ticket' });
  }

  // Get project info if applicable
  let projectInfo = null;
  if (ticket.project) {
    projectInfo = await Project.findOne({ name: ticket.project })
      .populate('teamMembers', 'name email role mobile')
      .populate('teamLeader', 'name email role mobile');
  }

  const comments = await Comment.find({ ticketId: req.params.id })
    .populate('userId', 'name role')
    .sort({ createdAt: 1 });
  res.json({ ticket, comments, projectInfo });
});

// ─────────────────────────────────────────────
// PROJECT ROUTES
// ─────────────────────────────────────────────

app.get('/api/projects', protect, async (req, res) => {
  try {
    let query = { status: 1 };
    if (req.user.role === 'team_leader') {
      query = { teamLeader: req.user._id };
    } else if (req.user.role === 'employee') {
      query = { teamMembers: req.user._id };
    }
    const projects = await Project.find(query)
      .populate('teamLeader', 'name email mobile')
      .populate('teamMembers', 'name email role mobile')
      .sort({ name: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/projects', protect, authorize('admin'), upload.single('knowledgeBaseFile'), async (req, res) => {
  try {
    const { name, teamName, productionUrl, uatUrl, productionLink, teamLeader, teamMembers, status: projectStatus } = req.body;
    const project = await Project.create({
      name, teamName, productionUrl, uatUrl, productionLink,
      teamLeader: teamLeader || null,
      status: projectStatus !== undefined ? Number(projectStatus) : 1,
      teamMembers: teamMembers ? JSON.parse(teamMembers) : [],
      knowledgeBase: req.file ? `/uploads/${req.file.filename}` : null,
      knowledgeBaseOriginalName: req.file ? req.file.originalname : null
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Error creating project' });
  }
});

app.put('/api/projects/:id', protect, authorize('admin', 'team_leader'), upload.single('knowledgeBaseFile'), async (req, res) => {
  try {
    const { name, teamName, productionUrl, uatUrl, productionLink, teamLeader, teamMembers, status: projectStatus } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Team leaders can only edit their own projects
    if (req.user.role === 'team_leader' && (project.teamLeader?.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Team Leaders can only edit projects they are assigned to lead.' });
    }

    project.name = name;
    project.teamName = teamName;
    project.productionUrl = productionUrl;
    project.uatUrl = uatUrl;
    project.productionLink = productionLink;
    project.teamLeader = teamLeader || null;
    if (projectStatus !== undefined) project.status = Number(projectStatus);
    project.teamMembers = teamMembers ? JSON.parse(teamMembers) : [];
    
    if (req.file) {
      project.knowledgeBase = `/uploads/${req.file.filename}`;
      project.knowledgeBaseOriginalName = req.file.originalname;
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Error updating project' });
  }
});

app.delete('/api/projects/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Project.findByIdAndUpdate(req.params.id, { status: 0 });
    res.json({ message: 'Project marked as inactive' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/tickets/:id', protect, async (req, res) => {
  const { status, assignedTo, priority, rating, feedback } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

  // Role-based update permissions
  const isAdminLevel = ['admin', 'team_leader'].includes(req.user.role);
  const isEmployee = req.user.role === 'employee';
  const isHR = req.user.role === 'hr';
  const isOwner = ticket.createdBy.toString() === req.user._id.toString();
  const isAssigned = ticket.assignedTo?.toString() === req.user._id.toString();
  const hrCanManageThisTicket = isHR && ticket.type === 'hr';
  const canWorkTicket = isAdminLevel || isEmployee || hrCanManageThisTicket;

  if (status) {
    if (isAdminLevel || isEmployee || hrCanManageThisTicket) {
      if (req.user.role === 'admin' && ticket.type === 'hr') {
        return res.status(403).json({ message: 'Admins cannot manage HR tickets directly if they are sensitive.' });
      }

      // Logic for 'resolved' (Employee finishing work)
      if (status === 'resolved' && !isAssigned && !isAdminLevel) {
        return res.status(403).json({ message: 'Only the assigned member can mark a ticket as resolved.' });
      }

      // Logic for 'completed' (Verification)
      if (status === 'completed' && !isAdminLevel) {
        return res.status(403).json({ message: 'Only admins or team leaders can verify and complete tickets.' });
      }

      // Logic for 'in_progress' (Reopening from resolved)
      if (status === 'in_progress' && ticket.status === 'resolved' && !isAdminLevel) {
        return res.status(403).json({ message: 'Only admins or team leaders can reopen resolved tickets.' });
      }

      ticket.status = status;
    } else {
      return res.status(403).json({ message: 'You are not authorized to update this ticket status' });
    }
  }

  if (assignedTo !== undefined) {
    if (isAdminLevel) {
      ticket.assignedTo = assignedTo || null;
    } else if (isEmployee) {
      const target = assignedTo?.toString() || null;
      const me = req.user._id.toString();
      if ((!ticket.assignedTo || ticket.assignedTo.toString() === me) && (target === null || target === me)) {
        ticket.assignedTo = assignedTo || null;
      } else {
        return res.status(403).json({ message: 'Employees can only self-assign unassigned tickets' });
      }
    } else if (isHR) {
      const target = assignedTo?.toString() || null;
      const me = req.user._id.toString();
      if (hrCanManageThisTicket && ((!ticket.assignedTo || isAssigned) && (target === null || target === me))) {
        ticket.assignedTo = assignedTo || null;
      } else {
        return res.status(403).json({ message: 'HR can only self-assign HR tickets' });
      }
    }
  }

  if (priority) {
    if (canWorkTicket) ticket.priority = priority;
  }

  if (rating && isOwner && ticket.status === 'completed') {
    ticket.rating = rating;
    if (feedback) ticket.feedback = feedback;
  }

  ticket.updatedAt = Date.now();
  await ticket.save();

  // Award bug-bounty points if a bug ticket was just verified as completed.
  if (ticket.type === 'bug' && ticket.status === 'completed' && !ticket.pointsAwarded) {
    await awardBugPoints(ticket._id);
  }

  // Role-based notification for ticket update
  const populatedTicketForUpdate = await Ticket.findById(ticket._id).populate('assignedTo', 'name');
  const assigneeNameUpdate = populatedTicketForUpdate.assignedTo?.name || 'Unassigned';
  await dispatchNotifications(ticket, `Ticket updated: ${ticket.title} (Proj: ${ticket.project})`, req.user._id, req.user.role, ticket.project, `Title: ${ticket.title} | Proj: ${ticket.project} | Assigned to: ${assigneeNameUpdate} | Status: ${ticket.status} | Priority: ${ticket.priority}`);

  // Return populated ticket so frontend state remains consistent
  const updatedTicket = await Ticket.findById(ticket._id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role');

  res.json(updatedTicket);
});

// Delete ticket
app.delete('/api/tickets/:id', protect, authorize('admin', 'team_leader'), async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  
  if (req.user.role === 'team_leader' && ticket.type === 'hr') {
    return res.status(403).json({ message: 'Team Leaders cannot delete HR tickets.' });
  }

  ticket.activeStatus = 0;
  await ticket.save();
  res.json({ message: 'Ticket marked as inactive' });
});

// Notifications
app.get('/api/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/notifications/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/notifications/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/notifications/clear-all', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a single notification
app.delete('/api/notifications/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tickets/:id/comments', protect, async (req, res) => {
  const { content } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (!canAccessTicket(req.user, ticket)) {
    return res.status(403).json({ message: 'Not authorized to comment on this ticket' });
  }
  const comment = await Comment.create({ ticketId: req.params.id, userId: req.user._id, content });
  
  await dispatchNotifications(ticket, `New comment on ticket: ${ticket.title}`, req.user._id, req.user.role);
  
  const populatedComment = await comment.populate('userId', 'name role');
  res.status(201).json(populatedComment);
});



// ─────────────────────────────────────────────
// STATS ROUTES
// ─────────────────────────────────────────────

// Admin — team & ticket overview (Super Admin merged here)
app.get('/api/stats/admin', protect, authorize('admin', 'team_leader'), async (req, res) => {
  const isTL = req.user.role === 'team_leader';
  const ticketQuery = isTL 
    ? { $or: [{ createdBy: req.user._id }, { type: { $in: ['client', 'employee'] } }] }
    : {};

  const total = await Ticket.countDocuments(ticketQuery);
  const pending = await Ticket.countDocuments({ ...ticketQuery, status: 'pending' });
  const inProgress = await Ticket.countDocuments({ ...ticketQuery, status: 'in_progress' });
  const onHold = await Ticket.countDocuments({ ...ticketQuery, status: 'on_hold' });
  const completed = await Ticket.countDocuments({ ...ticketQuery, status: 'completed' });
  const unassigned = await Ticket.countDocuments({ ...ticketQuery, assignedTo: null, status: { $ne: 'completed' } });

  const totalUsers = await User.countDocuments();
  const totalEmployees = await User.countDocuments({ role: 'employee' });
  const totalHR = await User.countDocuments({ role: 'hr' });
  const totalTeamLeaders = await User.countDocuments({ role: 'team_leader' });

  const byPriority = await Ticket.aggregate([
    { $match: ticketQuery },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  const byType = await Ticket.aggregate([
    { $match: ticketQuery },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  const byStatus = await Ticket.aggregate([
    { $match: ticketQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Last 7 days daily ticket creation trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0,0,0,0);

  const dailyTrend = await Ticket.aggregate([
    { $match: { ...ticketQuery, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        created: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill missing days
  const trendMap = {};
  dailyTrend.forEach(d => { trendMap[d._id] = d; });
  const filledTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const shortDay = d.toLocaleDateString('en-US', { weekday: 'short' });
    filledTrend.push({
      day: shortDay,
      date: key,
      created: trendMap[key]?.created || 0,
      resolved: trendMap[key]?.resolved || 0,
    });
  }

  // Top 5 assignees by resolved tickets
  const topAssignees = await Ticket.aggregate([
    { $match: { ...ticketQuery, assignedTo: { $ne: null }, status: 'completed' } },
    { $group: { _id: '$assignedTo', resolved: { $sum: 1 } } },
    { $sort: { resolved: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { name: '$user.name', role: '$user.role', resolved: 1 } }
  ]);

  // Average resolution time (ms → hours)
  const completedWithDates = await Ticket.find({ ...ticketQuery, status: 'completed', updatedAt: { $exists: true } })
    .select('createdAt updatedAt').limit(100);
  const avgResolutionHrs = completedWithDates.length > 0
    ? Math.round(completedWithDates.reduce((sum, t) => sum + (new Date(t.updatedAt) - new Date(t.createdAt)), 0) / completedWithDates.length / 3600000)
    : null;

  const recentTickets = await Ticket.find(ticketQuery)
    .populate('createdBy', 'name role')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({ 
    total, pending, inProgress, onHold, completed, unassigned, 
    totalUsers, totalEmployees, totalHR, totalTeamLeaders,
    byPriority, byType, byStatus, dailyTrend: filledTrend,
    topAssignees, avgResolutionHrs,
    recentTickets, userRole: req.user.role
  });
});


// Employee & HR — workload overview
app.get('/api/stats/employee', protect, authorize('employee', 'hr'), async (req, res) => {
  const uid = req.user._id;

  // Stats: tickets assigned to ME
  const assignedQuery = { assignedTo: uid };
  const total       = await Ticket.countDocuments(assignedQuery);
  const pending     = await Ticket.countDocuments({ ...assignedQuery, status: 'pending' });
  const inProgress  = await Ticket.countDocuments({ ...assignedQuery, status: 'in_progress' });
  const onHold      = await Ticket.countDocuments({ ...assignedQuery, status: 'on_hold' });
  const completed   = await Ticket.countDocuments({ ...assignedQuery, status: 'completed' });

  // Tickets I raised (as an employee)
  const myRaisedTickets = await Ticket.countDocuments({ createdBy: uid });

  // 🎯 Ticket lists for interactive dashboard
  const assignedTickets = await Ticket.find({ assignedTo: uid, status: { $ne: 'completed' } })
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(10);

  const byPriority = await Ticket.aggregate([
    { $match: assignedQuery },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  const byType = await Ticket.aggregate([
    { $match: assignedQuery },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  // Tickets raised by this employee
  const raisedTickets = await Ticket.find({ createdBy: uid })
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  // 🎯 NEW: Distinguish between HR and Employee for unassigned pool
  let unassignedQuery = { assignedTo: null, status: { $ne: 'completed' } };
  if (req.user.role === 'hr') {
    // HR handles ONLY HR-type internal tickets
    unassignedQuery.type = 'hr';
  } else {
    // Employees handle Employee IT issues
    unassignedQuery.type = { $in: ['employee'] };
  }


  const unassigned = await Ticket.countDocuments(unassignedQuery);
  const unassignedTickets = await Ticket.find(unassignedQuery)
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    total, pending, inProgress, onHold, completed,
    myRaisedTickets, unassigned, byPriority, byType,
    assignedTickets, unassignedTickets, raisedTickets,
    userRole: req.user.role
  });
});


// Client — strictly scoped to their own tickets only
app.get('/api/stats/client', protect, authorize('client'), async (req, res) => {
  const matchQuery = { createdBy: req.user._id, type: 'client' };
  const total      = await Ticket.countDocuments(matchQuery);
  const pending    = await Ticket.countDocuments({ ...matchQuery, status: 'pending' });
  const inProgress = await Ticket.countDocuments({ ...matchQuery, status: 'in_progress' });
  const onHold     = await Ticket.countDocuments({ ...matchQuery, status: 'on_hold' });
  const completed  = await Ticket.countDocuments({ ...matchQuery, status: 'completed' });

  const byPriority = await Ticket.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  // Recent ticket list for the client dashboard
  const recentTickets = await Ticket.find(matchQuery)
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({ total, pending, inProgress, onHold, completed, byPriority, recentTickets });
});

// ─────────────────────────────────────────────
// PROFILE & USER SETTINGS
// ─────────────────────────────────────────────

app.put('/api/users/profile', protect, async (req, res) => {
  const { name, email, mobile, password } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name) user.name = name;
  if (mobile !== undefined) user.mobile = mobile;
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    user.email = email;
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  await user.save();
  const updated = user.toObject();
  delete updated.password;
  res.json({ message: 'Profile updated successfully', user: updated });
});

// ─────────────────────────────────────────────
// USER MANAGEMENT (Admin + Super Admin)
// ─────────────────────────────────────────────

// All users for management page:
app.get('/api/users/employees', protect, authorize('admin', 'team_leader'), async (req, res) => {
  try {
    const query = { status: 1 };
    const users = await User.find(query).select('name email role createdAt lastLogin points currentBadge').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assignable agents — ONLY employees/team_leaders
app.get('/api/users/agents', protect, authorize('admin', 'super_admin', 'team_leader', 'hr'), async (req, res) => {
  const query = { status: 1, role: { $in: ['employee', 'team_leader', 'hr', 'admin'] } };
  const agents = await User.find(query).select('name email role mobile');
  res.json(agents);
});

app.get('/api/users/all', protect, authorize('admin'), async (req, res) => {
  try {
    const query = { status: 1 };
    const users = await User.find(query).select('name email role createdAt lastLogin').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new user (Admin / Super Admin / Team Leader)
app.post('/api/users', protect, authorize('admin', 'team_leader'), async (req, res) => {
  const { name, email, password, role } = req.body;
  const cleanEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = normalizeRole(role);
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const allowedRoles = ['client', 'employee', 'team_leader', 'hr', 'admin'];

  if (!allowedRoles.includes(normalizedRole)) {
    return res.status(403).json({ message: 'You are not authorized to create a user with this role' });
  }

  const exists = await User.findOne({ email: cleanEmail });
  if (exists) {
    if (exists.status === 1) {
      return res.status(400).json({ message: 'User already exists' });
    } else {
      // Reactivate and update
      const hashedPassword = await bcrypt.hash(password, 10);
      exists.name = name;
      exists.password = hashedPassword;
      exists.role = normalizedRole;
      exists.status = 1;
      await exists.save();
      return res.status(201).json({
        _id: exists._id,
        name: exists.name,
        email: exists.email,
        role: normalizeRole(exists.role),
        createdAt: exists.createdAt
      });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ name, email: cleanEmail, password: hashedPassword, role: normalizedRole, status: 1 });
  
  res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: normalizeRole(newUser.role),
    createdAt: newUser.createdAt
  });
});

// Update user role
app.put('/api/users/:id/role', protect, authorize('admin', 'team_leader'), async (req, res) => {
  const { role } = req.body;
  const normalizedRole = normalizeRole(role);
  
  const allowedRoles = ['client', 'employee', 'team_leader', 'hr', 'admin'];

  if (!allowedRoles.includes(normalizedRole)) {
    return res.status(403).json({ message: 'You are not authorized to assign this role' });
  }

  // Prevent modifying yourself
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return res.status(404).json({ message: 'User not found' });
  if (targetUser._id.toString() === req.user._id.toString()) {
    return res.status(403).json({ message: 'Cannot modify your own role' });
  }

  targetUser.role = normalizedRole;
  await targetUser.save();
  res.json({ _id: targetUser._id, name: targetUser.name, email: targetUser.email, role: normalizeRole(targetUser.role) });
});

// Delete user
app.delete('/api/users/:id', protect, authorize('admin', 'team_leader'), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove yourself' });
    }

    if (req.user.role === 'team_leader' && targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Team Leaders cannot remove Admin accounts' });
    }

    targetUser.status = 0;
    await targetUser.save();
    res.json({ message: 'User removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// GAMIFICATION / BUG BOUNTY
// ─────────────────────────────────────────────

app.get('/api/leaderboard', protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const top = await User.find({
      status: 1,
      role: { $in: ELIGIBLE_ROLES },
      points: { $gt: 0 }
    })
      .select('name email role points currentBadge')
      .sort({ points: -1 })
      .limit(limit);

    const enriched = await Promise.all(top.map(async (u) => {
      const reported = await Ticket.countDocuments({ type: 'bug', createdBy: u._id });
      const resolved = await Ticket.countDocuments({ type: 'bug', createdBy: u._id, status: 'completed', pointsAwarded: true });
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        points: u.points || 0,
        currentBadge: u.currentBadge || 'none',
        bugsReported: reported,
        bugsResolved: resolved
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/me/gamification', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('points currentBadge badgesEarned rewardsClaimed role');
    if (!me) return res.status(404).json({ message: 'User not found' });

    const recentAwards = await Ticket.find({ pointsAwardedTo: me._id, pointsAwarded: true })
      .select('title pointsAwardedAmount pointsAwardedAt pointsAwardedPriority project')
      .sort({ pointsAwardedAt: -1 })
      .limit(5);

    const bugsReported = await Ticket.countDocuments({ type: 'bug', createdBy: me._id });
    const bugsResolved = await Ticket.countDocuments({ type: 'bug', createdBy: me._id, status: 'completed', pointsAwarded: true });

    res.json({
      points: me.points || 0,
      currentBadge: me.currentBadge || 'none',
      badgesEarned: me.badgesEarned || [],
      rewardsClaimed: me.rewardsClaimed || [],
      role: me.role,
      eligible: ELIGIBLE_ROLES.includes(me.role),
      bugsReported,
      bugsResolved,
      recentAwards
    });
  } catch (err) {
    console.error('Gamification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/projects/:id/bug-stats', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const baseQuery = { type: 'bug', project: project.name };
    const total = await Ticket.countDocuments(baseQuery);
    const completed = await Ticket.countDocuments({ ...baseQuery, status: 'completed' });
    const open = total - completed;

    const byPriorityRaw = await Ticket.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const byPriority = byPriorityRaw.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, { low: 0, medium: 0, high: 0 });

    res.json({ total, open, completed, byPriority });
  } catch (err) {
    console.error('Bug stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/rewards/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({
      'rewardsClaimed.fulfilled': false,
      status: 1
    }).select('name email role points currentBadge rewardsClaimed');

    const rows = [];
    users.forEach(u => {
      (u.rewardsClaimed || []).forEach(r => {
        if (!r.fulfilled) {
          rows.push({
            userId: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            points: u.points || 0,
            currentBadge: u.currentBadge,
            tier: r.tier,
            unlockedAt: r.unlockedAt
          });
        }
      });
    });
    rows.sort((a, b) => new Date(a.unlockedAt) - new Date(b.unlockedAt));
    res.json(rows);
  } catch (err) {
    console.error('Pending rewards error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/rewards/:userId/:tier/fulfill', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, tier } = req.params;
    const { note } = req.body;
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const reward = (target.rewardsClaimed || []).find(r => r.tier === tier && !r.fulfilled);
    if (!reward) return res.status(404).json({ message: 'No pending reward for this tier' });

    reward.fulfilled = true;
    reward.fulfilledAt = new Date();
    reward.fulfilledBy = req.user._id;
    if (note) reward.note = note;
    await target.save();

    await Notification.create({
      userId: target._id,
      message: `🎁 Your ${tier} tier reward has been fulfilled!`
    });

    res.json({ message: 'Reward marked fulfilled', tier, userId });
  } catch (err) {
    console.error('Fulfill error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/gamification/backfill', protect, authorize('admin'), async (req, res) => {
  try {
    const candidates = await Ticket.find({
      type: 'bug',
      status: 'completed',
      pointsAwarded: { $ne: true }
    }).select('_id');

    let awarded = 0;
    let skipped = 0;
    for (const c of candidates) {
      const result = await awardBugPoints(c._id);
      if (result) awarded += 1; else skipped += 1;
    }
    res.json({ processed: candidates.length, awarded, skipped });
  } catch (err) {
    console.error('Backfill error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// SUPER ADMIN CONTROL (Settings & Permissions)
// ─────────────────────────────────────────────

app.get('/api/system/config', protect, authorize('admin'), async (req, res) => {
  const config = await getSystemConfig();
  res.json(config);
});

app.put('/api/system/settings', protect, authorize('admin'), async (req, res) => {
  const config = await getSystemConfig();
  const { 
    allowSelfRegistration, 
    allowEmployeeSelfRegistration, 
    maintenanceMode, 
    defaultPriority,
    slaHighResponse,
    slaMediumResponse,
    slaLowResponse
  } = req.body;

  if (allowSelfRegistration !== undefined) config.settings.allowSelfRegistration = !!allowSelfRegistration;
  if (allowEmployeeSelfRegistration !== undefined) config.settings.allowEmployeeSelfRegistration = !!allowEmployeeSelfRegistration;
  if (maintenanceMode !== undefined) config.settings.maintenanceMode = !!maintenanceMode;
  if (['low', 'medium', 'high'].includes(defaultPriority)) config.settings.defaultPriority = defaultPriority;
  
  if (slaHighResponse !== undefined) config.settings.slaHighResponse = Number(slaHighResponse);
  if (slaMediumResponse !== undefined) config.settings.slaMediumResponse = Number(slaMediumResponse);
  if (slaLowResponse !== undefined) config.settings.slaLowResponse = Number(slaLowResponse);

  config.updatedAt = new Date();
  await config.save();
  res.json(config);
});

app.post('/api/system/backup', protect, authorize('admin'), async (req, res) => {
  try {
    // Mocking a backup process
    await new Promise(resolve => setTimeout(resolve, 1500));
    res.json({ message: 'Backup completed successfully!', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ message: 'Backup failed' });
  }
});

app.put('/api/system/permissions', protect, authorize('admin'), async (req, res) => {
  const config = await getSystemConfig();
  const { rolePermissions } = req.body;
  if (!rolePermissions || typeof rolePermissions !== 'object') {
    return res.status(400).json({ message: 'Invalid role permissions payload' });
  }
  config.rolePermissions = {
    ...config.rolePermissions,
    ...rolePermissions
  };
  config.updatedAt = new Date();
  await config.save();
  res.json(config);
});

app.get('/api/reports/summary', protect, authorize('admin'), async (req, res) => {
  const byStatus = await Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byPriority = await Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);
  const byType = await Ticket.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
  const avgResolutionMs = await Ticket.aggregate([
    { $match: { status: 'completed' } },
    { $project: { diff: { $subtract: ['$updatedAt', '$createdAt'] } } },
    { $group: { _id: null, avg: { $avg: '$diff' } } }
  ]);
  res.json({
    byStatus,
    byPriority,
    byType,
    avgResolutionHours: avgResolutionMs?.[0]?.avg ? Number((avgResolutionMs[0].avg / (1000 * 60 * 60)).toFixed(2)) : 0
  });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
connectDB().then(async () => {
  await seedAdmin();
  
  // Static files for production
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  // Catch-all route to serve the frontend
  app.use((req, res) => {
    // Check if it's an API route - if so, don't serve index.html (already handled or 404)
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });


  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});


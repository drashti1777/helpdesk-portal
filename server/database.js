import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'team_leader', 'hr', 'admin', 'client'], default: 'employee' },
  status: { type: Number, enum: [0, 1], default: 1 },
  lastLogin: { type: Date },
  points: { type: Number, default: 0 },
  currentBadge: { type: String, enum: ['none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'], default: 'none' },
  badgesEarned: [{
    tier: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],
  rewardsClaimed: [{
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] },
    unlockedAt: { type: Date, default: Date.now },
    fulfilled: { type: Boolean, default: false },
    fulfilledAt: { type: Date },
    fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});
userSchema.index({ points: -1 });

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  project: { type: String },
  type: { type: String, enum: ['hr', 'employee', 'bug', 'team_leader'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  status: { type: String, enum: ['pending', 'in_progress', 'on_hold', 'resolved', 'completed'], default: 'pending' },
  activeStatus: { type: Number, enum: [0, 1], default: 1 }, // 0: Deleted/Inactive, 1: Active
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetClient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slaResponseDue: { type: Date },
  slaResolutionDue: { type: Date },
  category: { type: String, default: 'General' },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  attachments: [{ filename: String, path: String }],
  pointsAwarded: { type: Boolean, default: false },
  pointsAwardedAt: { type: Date },
  pointsAwardedAmount: { type: Number },
  pointsAwardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pointsAwardedPriority: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
ticketSchema.index({ type: 1, status: 1, project: 1 });
ticketSchema.index({ type: 1, pointsAwarded: 1 });

const commentSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  projectName: { type: String },
  activityDetails: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  settings: {
    allowSelfRegistration: { type: Boolean, default: true },
    allowEmployeeSelfRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    defaultPriority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  },
  rolePermissions: {
    employee: [{ type: String }],
    team_leader: [{ type: String }],
    hr: [{ type: String }],
    admin: [{ type: String }],
  },
  updatedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  knowledgeBase: { type: String },
  knowledgeBaseOriginalName: { type: String },
  productionUrl: { type: String },
  uatUrl: { type: String },
  productionLink: { type: String },
  teamName: { type: String },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  poc1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  poc2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: Number, enum: [0, 1], default: 1 }, // 0: Inactive/Deleted, 1: Active
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
const Project = mongoose.model('Project', projectSchema);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export { User, Ticket, Comment, Notification, SystemConfig, Project, connectDB };

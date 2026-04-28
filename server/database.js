import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'employee', 'team_leader', 'hr', 'admin'], default: 'client' },
  status: { type: Number, enum: [0, 1], default: 1 },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  project: { type: String },
  type: { type: String, enum: ['client', 'hr', 'employee'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  status: { type: String, enum: ['pending', 'in_progress', 'on_hold', 'completed'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetClient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slaResponseDue: { type: Date },
  slaResolutionDue: { type: Date },
  category: { type: String, default: 'General' },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  attachments: [{ filename: String, path: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

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
    client: [{ type: String }],
    employee: [{ type: String }],
    team_leader: [{ type: String }],
    admin: [{ type: String }],
    super_admin: [{ type: String }],
  },
  updatedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from './database.js';

const normalizeRole = (role = '') => {
  const key = String(role).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const roleMap = {
    superadmin: 'admin',
    super_admin: 'admin',
    teamleader: 'team_leader',
    team_leader: 'team_leader',
    admin: 'admin',
    employee: 'employee',
    hr: 'hr',
    client: 'client'
  };
  return roleMap[key] || role;
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (req.user?.role) {
        req.user.role = normalizeRole(req.user.role);
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not authorized to access this route. Required: ${roles.join(', ')}` });
    }
    next();
  };
};

export { generateToken, protect, authorize, normalizeRole };

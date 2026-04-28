import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../server/database.js';

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.deleteMany({ email });
    await User.create({
      name: 'Test User',
      email,
      password: hashedPassword,
      role: 'admin',
      status: 1
    });
    console.log('Test user created: test@example.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

createTestUser();

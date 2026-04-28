import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../server/database.js';

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}).select('name email role status');
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  }
};

checkUsers();

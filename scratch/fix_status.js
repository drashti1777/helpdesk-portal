
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
  email: String,
  status: { type: Number, default: 1 }
});
const User = mongoose.model('User', userSchema);

async function fixStatus() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  const result = await User.updateMany(
    { status: { $exists: false } },
    { $set: { status: 1 } }
  );
  console.log(`Updated ${result.modifiedCount} users to status: 1`);
  process.exit(0);
}
fixStatus();

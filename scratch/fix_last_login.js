import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/ticketing-portal';

const userSchema = new mongoose.Schema({
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function fixLastLogin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ 
      $or: [
        { lastLogin: { $exists: false } },
        { lastLogin: null }
      ]
    });

    console.log(`Found ${users.length} users with missing lastLogin.`);

    for (const user of users) {
      user.lastLogin = user.createdAt || new Date();
      await user.save();
    }

    console.log(`Fixed ${users.length} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixLastLogin();

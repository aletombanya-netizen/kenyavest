const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const phoneArgs = process.argv.slice(2);

if (phoneArgs.length === 0) {
  console.error('Please provide the user phone number as an argument.');
  console.log('Usage: node makeAdmin.js 0712345678');
  process.exit(1);
}

const targetPhone = phoneArgs[0];

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected.');

    const user = await User.findOne({ phone: targetPhone });

    if (!user) {
      console.error(`User with phone ${targetPhone} not found.`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`Success! User ${user.name} (${user.phone}) is now an admin.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

makeAdmin();

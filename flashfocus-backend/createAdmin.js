const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashfocus';
const User = require('./models/User');

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@flashfocus.com';
        const password = 'adminpassword';

        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists, promoting to admin...');
            user.isAdmin = true;
            await user.save();
        } else {
            console.log('Creating new admin user...');
            user = new User({
                username: 'Administrator',
                email,
                password,
                isAdmin: true
            });
            await user.save();
        }

        console.log(`Admin user ${email} is ready!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        await mongoose.disconnect();
    } catch (e) {
        console.error('Failed to create admin:', e);
    }
}

createAdmin();

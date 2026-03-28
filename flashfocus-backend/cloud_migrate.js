const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB Cloud');

        // Update all users that don't have isDeleted field
        const result = await User.updateMany(
            { isDeleted: { $exists: false } },
            { $set: { isDeleted: false } }
        );

        console.log(`Successfully updated ${result.modifiedCount} users with isDeleted: false.`);
        
        // Also check if our new admin exists
        const admin = await User.findOne({ email: 'admin@flashfocus.com' });
        if (admin) {
            console.log('Confirmed: admin@flashfocus.com is in the cloud database.');
        } else {
            console.log('Admin user not found, creating it now...');
            const newAdmin = new User({
                username: 'Administrator',
                email: 'admin@flashfocus.com',
                password: 'adminpassword',
                isAdmin: true,
                isDeleted: false
            });
            await newAdmin.save();
            console.log('Admin user created in the cloud.');
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();

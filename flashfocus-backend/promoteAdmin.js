const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashfocus';
const User = require('./models/User');

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await User.updateOne(
            { email: 'khanhto23042004@gmail.com' },
            { $set: { isAdmin: true } }
        );

        if (result.matchedCount > 0) {
            console.log('User khanhto23042004@gmail.com promoted to Admin!');
        } else {
            console.log('User not found.');
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();

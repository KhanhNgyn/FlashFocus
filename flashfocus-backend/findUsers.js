const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashfocus';

async function getUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('Valid Users in DB:');
        users.forEach(u => {
            console.log(`- Username: ${u.username}, Email: ${u.email}, ID: ${u._id}`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error('Failed to get users:', e);
    }
}

getUsers();

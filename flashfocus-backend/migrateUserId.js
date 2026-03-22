const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashfocus';

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for migration');

        const db = mongoose.connection.db;
        const result = await db.collection('decks').updateMany(
            { user_id: { $exists: true } },
            { $rename: { 'user_id': 'userId' } }
        );

        console.log(`Migration complete. Updated ${result.modifiedCount} documents.`);
        await mongoose.disconnect();
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();

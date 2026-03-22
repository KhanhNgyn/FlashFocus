const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashfocus';

const User = require('./models/User');
const Deck = require('./models/Deck');
const Card = require('./models/Card');

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // 1. Cleanup "anonymous" data using native collection to avoid ObjectId validation
        console.log('Cleaning up "anonymous" data...');
        const deleteResult = await db.collection('decks').deleteMany({ 
            $or: [
                { userId: "anonymous" },
                { userId: { $type: "string" } }, // Also delete any other string-based userIds
                { user_id: { $exists: true } }    // Clean up old snake_case field if any left
            ]
        });
        console.log(`Deleted ${deleteResult.deletedCount} old/anonymous decks.`);

        // Clean up cards
        const cardDeleteResult = await Card.deleteMany({}); // Delete ALL cards for a fresh start
        console.log(`Deleted ${cardDeleteResult.deletedCount} existing cards.`);
        
        // Delete all decks for a fresh start (Optional, but user said "dọn cho tôi")
        // await Deck.deleteMany({}); 

        // 2. Find or Create Users
        let khanh = await User.findOne({ email: 'khanhto23042004@gmail.com' });
        let hung = await User.findOne({ email: 'hung@gmail.com' });

        if (!khanh) {
            console.log('Creating khanh user...');
            khanh = new User({ username: 'khanh', email: 'khanhto23042004@gmail.com', password: 'khanhbadao123' });
            await khanh.save();
        }
        if (!hung) {
            console.log('Creating hung user...');
            hung = new User({ username: 'hung', email: 'hung@gmail.com', password: 'khanhbadao123' });
            await hung.save();
        }

        console.log(`Using Khanh ID: ${khanh._id}`);
        console.log(`Using Hung ID: ${hung._id}`);

        // 3. Create Seed Decks
        console.log('Seeding new decks...');
        
        // Khanh's Decks
        const decks = [
            { title: 'Từ vựng Tiếng Anh (Khanh)', userId: khanh._id, is_public: true },
            { title: 'Cấu trúc Dữ liệu (Khanh)', userId: khanh._id, is_public: false }
        ];

        for (const dData of decks) {
            const d = new Deck(dData);
            await d.save();
            console.log(`Created deck: ${d.title}`);
            
            // Add some cards
            await new Card({ deck_id: d._id, front: `Thẻ 1 của ${d.title}`, back: 'Đáp án 1' }).save();
            await new Card({ deck_id: d._id, front: `Thẻ 2 của ${d.title}`, back: 'Đáp án 2' }).save();
        }

        // Hung's Deck
        const d_hung = new Deck({ title: 'Toán học Cơ bản (Hung)', userId: hung._id, is_public: false });
        await d_hung.save();
        await new Card({ deck_id: d_hung._id, front: '1 + 1 = ?', back: '2', tags: 'Math' }).save();

        console.log('Seeding complete!');
        await mongoose.disconnect();
    } catch (e) {
        console.error('Seeding failed:', e);
    }
}

seed();

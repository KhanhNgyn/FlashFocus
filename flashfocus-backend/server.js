const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Deck = require('./models/Deck');
const Card = require('./models/Card');
const Message = require('./models/Message');
const auth = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

app.use(cors());
app.use(express.json());

// Ping route to check connectivity
app.get('/api/ping', (req, res) => {
    res.json({ message: 'Server is alive', time: new Date() });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    console.log('Registration request body:', req.body);
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email, password });
        console.log('Attempting to save user to MongoDB:', email);
        await user.save();
        console.log('User saved successfully');
        res.status(201).json({ message: 'User registered successfully' });
    } catch (e) {
        console.error('Registration error FULL:', e);
        if (e.code === 11000) {
            return res.status(400).json({ error: 'Email hoặc tên đăng nhập đã tồn tại!' });
        }
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    console.log('Login request body:', req.body);
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        console.log('Find user result:', user ? 'User found' : 'User NOT found');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, username: user.username, isPremium: user.isPremium } });
    } catch (e) {
        console.error('Login error FULL:', e);
        res.status(500).json({ error: e.message });
    }
});

// Routes
app.get('/api/decks', auth, async (req, res) => {
    try {
        const decks = await Deck.find({
            $or: [
                { user_id: req.user.id },
                { is_public: true }
            ]
        }).populate('user_id', 'username').sort({ created_at: -1 });
        res.json(decks);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/decks', auth, async (req, res) => {
    try {
        const deck = new Deck({
            ...req.body,
            user_id: req.user.id
        });
        await deck.save();
        res.json(deck);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.patch('/api/decks/:id', auth, async (req, res) => {
    try {
        const deck = await Deck.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            req.body,
            { new: true }
        );
        if (!deck) return res.status(404).json({ error: 'Deck not found or unauthorized' });
        res.json(deck);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.delete('/api/decks/:id', auth, async (req, res) => {
    try {
        const deck = await Deck.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
        if (!deck) return res.status(404).json({ error: 'Deck not found or unauthorized' });
        await Card.deleteMany({ deck_id: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/cards/:deckId', auth, async (req, res) => {
    try {
        // Check if user has access to this deck
        const deck = await Deck.findOne({
            _id: req.params.deckId,
            $or: [{ user_id: req.user.id }, { is_public: true }]
        });
        if (!deck) return res.status(403).json({ error: 'Access denied' });

        const cards = await Card.find({ deck_id: req.params.deckId }).sort({ created_at: -1 });
        res.json(cards);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/cards', auth, async (req, res) => {
    try {
        // Ensure user owns the deck they are adding cards to
        const deck = await Deck.findOne({ _id: req.body.deck_id, user_id: req.user.id });
        if (!deck) return res.status(403).json({ error: 'Unauthorized to add cards to this deck' });

        const card = new Card(req.body);
        await card.save();
        res.json(card);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.put('/api/cards/:id', auth, async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ error: 'Card not found' });

        const deck = await Deck.findOne({ _id: card.deck_id, user_id: req.user.id });
        if (!deck) return res.status(403).json({ error: 'Unauthorized' });

        Object.assign(card, req.body);
        await card.save();
        res.json(card);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.delete('/api/cards/:id', auth, async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ error: 'Card not found' });

        const deck = await Deck.findOne({ _id: card.deck_id, user_id: req.user.id });
        if (!deck) return res.status(403).json({ error: 'Unauthorized' });

        await card.deleteOne();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Stats API
app.get('/api/stats', async (req, res) => {
    try {
        const totalDecks = await Deck.countDocuments();
        const totalCards = await Card.countDocuments();
        res.json({ totalDecks, totalCards });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Chat via Socket.io
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('send_message', async (data) => {
        try {
            const { content, user_id, username } = data;
            const msg = new Message({ content, user_id, username });
            await msg.save();
            io.emit('receive_message', msg);
        } catch (e) {
            console.error('Socket error:', e);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// REST Chat backup
app.get('/api/messages', async (req, res) => {
    const messages = await Message.find().sort({ created_at: -1 }).limit(50);
    res.json(messages);
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flashfocus';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error(err));

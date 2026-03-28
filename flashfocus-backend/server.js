const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { VNPay, ignoreLogger, ProductCode, VnpLocale } = require('vnpay');

// VNPay Sandbox configuration
const vnpay = new VNPay({
    tmnCode: 'CGXZLS0Z',
    secureSecret: 'XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
    enableLog: true,
    loggerFn: ignoreLogger,
});

const User = require('./models/User');
const Deck = require('./models/Deck');
const Card = require('./models/Card');
const Message = require('./models/Message');
const Payment = require('./models/Payment');
const auth = require('./middleware/auth');

const adminCheck = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

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
        if (user.isDeleted) {
            return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa!' });
        }
        const token = jwt.sign(
            { id: user._id, username: user.username, isAdmin: user.isAdmin }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );
        res.json({ token, user: { id: user._id, username: user.username, isPremium: user.isPremium, isAdmin: user.isAdmin } });
    } catch (e) {
        console.error('Login error FULL:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get current user info (for refreshing premium status after VNPay)
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ id: user._id, username: user.username, isPremium: user.isPremium, isAdmin: user.isAdmin });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Routes
app.get('/api/decks', auth, async (req, res) => {
    try {
        const decks = await Deck.find({ userId: req.user.id })
            .populate('userId', 'username')
            .sort({ created_at: -1 });
        res.json(decks);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/decks/public', auth, async (req, res) => {
    try {
        const decks = await Deck.find({ 
            is_public: true, 
            userId: { $ne: req.user.id } // Exclude my own public decks
        })
        .populate('userId', 'username')
        .sort({ created_at: -1 });
        res.json(decks);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/decks', auth, async (req, res) => {
    console.log(`User ${req.user.username} is creating a deck:`, req.body.title);
    try {
        const deck = new Deck({
            ...req.body,
            userId: req.user.id
        });
        await deck.save();
        res.json(deck);
    } catch (e) {
        console.error('Create deck error:', e);
        res.status(400).json({ error: e.message });
    }
});

app.patch('/api/decks/:id', auth, async (req, res) => {
    try {
        const deck = await Deck.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
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
    console.log(`User ${req.user.username} is deleting deck ID:`, req.params.id);
    try {
        const deck = await Deck.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!deck) {
            console.log('Deck not found or unauthorized for deletion');
            return res.status(404).json({ error: 'Deck not found or unauthorized' });
        }
        await Card.deleteMany({ deck_id: req.params.id });
        console.log('Deck and associated cards deleted successfully');
        res.json({ success: true });
    } catch (e) {
        console.error('Delete deck error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/cards/:deckId', auth, async (req, res) => {
    try {
        // Check if user has access to this deck
        const deck = await Deck.findOne({
            _id: req.params.deckId,
            $or: [{ userId: req.user.id }, { is_public: true }]
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
        const deck = await Deck.findOne({ _id: req.body.deck_id, userId: req.user.id });
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

        const deck = await Deck.findOne({ _id: card.deck_id, userId: req.user.id });
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

        const deck = await Deck.findOne({ _id: card.deck_id, userId: req.user.id });
        if (!deck) return res.status(403).json({ error: 'Unauthorized' });

        await card.deleteOne();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin Routes (Global Management)
app.get('/api/admin/decks', [auth, adminCheck], async (req, res) => {
    try {
        const decks = await Deck.find()
            .populate('userId', 'username email')
            .sort({ created_at: -1 });
        res.json(decks);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/admin/decks/:id', [auth, adminCheck], async (req, res) => {
    try {
        await Deck.findByIdAndDelete(req.params.id);
        await Card.deleteMany({ deck_id: req.params.id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin User Management
app.get('/api/admin/users', [auth, adminCheck], async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false }).sort({ created_at: -1 });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/admin/users/:id', [auth, adminCheck], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        user.isDeleted = !user.isDeleted; // Toggle ban/unban
        await user.save();
        res.json({ success: true, isDeleted: user.isDeleted });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Payments
app.post('/api/payments', auth, async (req, res) => {
    console.log('Received payment request:', req.body, 'from user:', req.user.id);
    try {
        const { amount, transactionId } = req.body;
        const payment = new Payment({
            userId: req.user.id,
            amount,
            transactionId
        });
        await payment.save();
        console.log('Payment saved to DB');
        
        // Upgrade user to premium
        await User.findByIdAndUpdate(req.user.id, { isPremium: true });
        console.log('User upgraded to premium');
        
        res.status(201).json(payment);
    } catch (e) {
        console.error('Payment error:', e.message);
        res.status(400).json({ error: e.message });
    }
});

app.get('/api/admin/payments', [auth, adminCheck], async (req, res) => {
    console.log('Admin fetching payments...');
    try {
        const payments = await Payment.find()
            .populate('userId', 'username email')
            .sort({ created_at: -1 });
        console.log('Found payments:', payments.length);
        res.json(payments);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// VNPay Payment Routes
app.post('/api/vnpay/create', auth, async (req, res) => {
    console.log('VNPay create payment request from user:', req.user.id);
    try {
        const { amount } = req.body;
        const orderId = 'FF' + Date.now();
        
        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: amount || 199000,
            vnp_IpAddr: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
            vnp_TxnRef: orderId,
            vnp_OrderInfo: `Nang cap Premium FlashFocus - ${orderId}`,
            vnp_OrderType: ProductCode.Pay,
            vnp_ReturnUrl: `${req.protocol}://${req.get('host')}/api/vnpay/return`,
            vnp_Locale: VnpLocale.VN,
        });
        
        // Save pending payment
        const payment = new Payment({
            userId: req.user.id,
            amount: amount || 199000,
            transactionId: orderId,
            status: 'pending',
            paymentMethod: 'vnpay'
        });
        await payment.save();
        console.log('VNPay payment URL created:', paymentUrl);
        
        res.json({ paymentUrl, orderId });
    } catch (e) {
        console.error('VNPay create error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/vnpay/return', async (req, res) => {
    console.log('VNPay return callback:', req.query);
    try {
        const verify = vnpay.verifyReturnUrl(req.query);
        console.log('VNPay verify result:', verify);
        
        const orderId = req.query.vnp_TxnRef;
        const payment = await Payment.findOne({ transactionId: orderId });
        
        if (verify.isVerified && verify.isSuccess) {
            // Update payment status
            if (payment) {
                payment.status = 'completed';
                payment.vnpayData = req.query;
                await payment.save();
                
                // Upgrade user to premium
                await User.findByIdAndUpdate(payment.userId, { isPremium: true });
                console.log('User', payment.userId, 'upgraded to premium via VNPay');
            }
            
            // Redirect to success page
            res.send(`
                <html>
                <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0fdf4;">
                    <div style="text-align:center;padding:40px;background:white;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                        <div style="font-size:60px;">✅</div>
                        <h1 style="color:#16a34a;">Thanh toán thành công!</h1>
                        <p>Mã giao dịch: <strong>${orderId}</strong></p>
                        <p>Bạn đã nâng cấp lên <strong>Premium</strong> thành công.</p>
                        <p style="color:#666;">Hãy quay lại ứng dụng FlashFocus.</p>
                    </div>
                </body>
                </html>
            `);
        } else {
            if (payment) {
                payment.status = 'failed';
                payment.vnpayData = req.query;
                await payment.save();
            }
            res.send(`
                <html>
                <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#fef2f2;">
                    <div style="text-align:center;padding:40px;background:white;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                        <div style="font-size:60px;">❌</div>
                        <h1 style="color:#dc2626;">Thanh toán thất bại</h1>
                        <p>Vui lòng thử lại trong ứng dụng FlashFocus.</p>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (e) {
        console.error('VNPay return error:', e.message);
        res.status(500).send('Error processing payment return');
    }
});

app.get('/api/vnpay/ipn', async (req, res) => {
    try {
        const verify = vnpay.verifyIpnCall(req.query);
        if (verify.isVerified && verify.isSuccess) {
            const orderId = req.query.vnp_TxnRef;
            const payment = await Payment.findOne({ transactionId: orderId });
            if (payment && payment.status !== 'completed') {
                payment.status = 'completed';
                payment.vnpayData = req.query;
                await payment.save();
                await User.findByIdAndUpdate(payment.userId, { isPremium: true });
            }
            return res.json({ RspCode: '00', Message: 'Confirm Success' });
        }
        return res.json({ RspCode: '97', Message: 'Checksum failed' });
    } catch (e) {
        return res.json({ RspCode: '99', Message: 'Unknown error' });
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
            const { content, userId, username } = data;
            const msg = new Message({ content, userId, username });
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

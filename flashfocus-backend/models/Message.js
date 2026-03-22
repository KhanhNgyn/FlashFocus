const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);

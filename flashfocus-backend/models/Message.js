const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    user_id: { type: String, required: true },
    username: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);

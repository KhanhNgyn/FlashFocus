const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema({
    title: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    is_public: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deck', deckSchema);

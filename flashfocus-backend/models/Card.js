const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    deck_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Deck', required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    tags: { type: String, default: "" },
    next_review_date: { type: Date, default: Date.now },
    easiness: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Card', cardSchema);

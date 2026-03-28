const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    status: { type: String, default: 'completed' },
    paymentMethod: { type: String, default: 'vnpay' },
    vnpayData: { type: Object, default: {} },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);

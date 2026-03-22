const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

// Hash password BEFORE saving to DB - Use standard async approach
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    try {
        console.log('Hashing password for user:', this.email);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Hashing complete');
    } catch (err) {
        console.error('Bcrypt hashing error:', err);
        throw err;
    }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

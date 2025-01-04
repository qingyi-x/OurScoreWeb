const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    profile: {
        firstName: String,
        lastName: String,
        school: String,
        program: String,
        graduationYear: Number,
        isProfileComplete: {
            type: Boolean,
            default: false
        }
    }
});

module.exports = mongoose.model('User', userSchema); 
// models/user.cjs
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs'); // Using bcryptjs as per your previous error

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    profilePictureUrl: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Pre-save hook to hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcryptjs.genSalt(10); // Generate a salt
    this.password = await bcryptjs.hash(this.password, salt); // Hash the password
    next();
});

// Method to compare entered password with the hashed password in the database
// This method will be available on user documents (e.g., user.matchPassword(enteredPassword))
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

// models/mood.cjs
const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References your User model
        required: true
    },
    mood: {
        type: String,
        required: true,
        // FIX: Ensure 'Sad' and other desired moods are explicitly in this enum list
        enum: [
            'Happy', 'Sad', 'Neutral', 'Anxious', 'Calm', 'Angry',
            'Excited', 'Bored', 'Confused', 'Motivated', 'Stressed', 'Relaxed',
            'Joyful', 'Depressed', 'Energetic', 'Tired', 'Hopeful', 'Frustrated'
        ],
        message: '`{VALUE}` is not a valid mood. Allowed moods are: {ENUMS}.'
    },
    date: {
        type: Date,
        default: Date.now // Default to the current date if not provided
    }
}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

module.exports = mongoose.model('Mood', moodSchema);

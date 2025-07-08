// routes/moodRoutes.cjs (or .js)
const express = require('express');
const router = express.Router();
const Mood = require('../models/mood'); // Make sure this path is correct relative to routes/
const mongoose = require('mongoose'); // Import mongoose to use ObjectId for validation

// Route to log a new mood
router.post('/moods', async (req, res) => {
  try {
    const { userId, mood } = req.body; // Expect userId and mood from the request body

    // Basic validation
    if (!userId || !mood) {
      return res.status(400).json({ message: 'User ID and mood are required' });
    }

    // Validate userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
         return res.status(400).json({ message: 'Invalid User ID format' });
    }

    const newMoodEntry = new Mood({
      userId: userId,
      mood: mood
    });

    await newMoodEntry.save();
    res.status(201).json({ message: 'Mood logged successfully', moodEntry: newMoodEntry });
  } catch (error) {
    console.error('Error logging mood:', error);
    res.status(500).json({ message: 'Failed to log mood', error: error.message });
  }
});

// Route to get mood data for a specific user
router.get('/moods/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
         return res.status(400).json({ message: 'Invalid User ID format' });
    }

    const moods = await Mood.find({ userId: userId }).sort({ date: 1 }); // Sort by date ascending
    res.status(200).json(moods);
  } catch (error) {
    console.error('Error fetching mood data:', error);
    res.status(500).json({ message: 'Failed to fetch mood data', error: error.message });
  }
});

module.exports = router;
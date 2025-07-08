const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const bcryptjs = require('bcryptjs'); // Using bcryptjs for consistency

// Import Mongoose Models
const User = require('./models/user.cjs');
const Conversation = require('./models/conversation.cjs');
const Mood = require('./models/mood.cjs');
const JournalEntry = require('./models/journalEntry.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MongoDB Connection ---
mongoose.connect('mongodb://127.0.0.1:27017/chatbotDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully!'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// --- Express Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

// ✳️ User Signup Route
app.post('/api/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const user = new User({ fullName, email, password });
        await user.save();

        res.status(201).json({ message: 'Signup successful! Please log in.' });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({ message: 'Signup failed. Please try again later.', error: err.message });
    }
});

// ✳️ User Login Route
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials. User not found.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
        }

        res.status(200).json({
            message: 'Login successful',
            userId: user._id,
            userName: user.fullName
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Login failed due to a server error.', error: err.message });
    }
});

// 💬 Chat message route (for interacting with Llama3)
app.post('/api/chat', async (req, res) => {
    const { message, userId } = req.body;

    if (!message) {
        return res.status(400).json({ reply: 'Message cannot be empty.' });
    }
    if (!userId) {
        return res.status(400).json({ reply: 'User ID is required for chat history.' });
    }

    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'llama3',
            prompt: message,
            stream: false,
        });

        const botReply = response.data.response.trim();

        let convo = await Conversation.findOne({ userId });
        if (!convo) {
            convo = new Conversation({ userId, messages: [] });
        }

        convo.messages.push({ sender: 'user', text: message });
        convo.messages.push({ sender: 'bot', text: botReply });
        await convo.save();

        res.status(200).json({ reply: botReply });
    } catch (err) {
        console.error('Chat API error:', err.message);
        res.status(500).json({ reply: "⚠️ Sorry, I'm having trouble connecting right now. Please try again later." });
    }
});

// 🗃 Get chat history for a specific user
app.get('/api/chat/history/:userId', async (req, res) => {
    try {
        const convo = await Conversation.findOne({ userId: req.params.userId });
        res.status(200).json(convo?.messages || []);
    } catch (err) {
        console.error('Error fetching chat history:', err.message);
        res.status(500).json({ message: 'Failed to fetch chat history.' });
    }
});

// 📝 Edit chat message
app.put('/api/chat/message/:id', async (req, res) => {
    const { newText } = req.body;
    if (!newText) {
        return res.status(400).json({ message: 'New text is required for editing.' });
    }
    try {
        const result = await Conversation.updateOne(
            { "messages._id": req.params.id },
            { $set: { "messages.$.text": newText } }
        );
        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Message not found or not updated.' });
        }
        res.status(200).json({ message: 'Message updated successfully.' });
    } catch (err) {
        console.error('Edit chat message error:', err.message);
        res.status(500).json({ message: 'Failed to edit message.' });
    }
});

// ❌ Delete chat message
app.delete('/api/chat/message/:id', async (req, res) => {
    try {
        const result = await Conversation.updateOne(
            { "messages._id": req.params.id },
            { $pull: { messages: { _id: req.params.id } } }
        );
        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Message not found or not deleted.' });
        }
        res.status(200).json({ message: 'Message deleted successfully.' });
    } catch (err) {
        console.error('Delete chat message error:', err.message);
        res.status(500).json({ message: 'Failed to delete message.' });
    }
});

// --- Mood Tracking Endpoints ---

// 📊 POST: Log a new mood
app.post('/api/moods', async (req, res) => {
    const { mood, userId, date } = req.body; // Expecting date from frontend

    if (!mood || !userId || !date) {
        return res.status(400).json({ message: 'Mood, User ID, and Date are required.' });
    }

    try {
        // Validate userId as a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        // Optional: Verify if the userId corresponds to an existing user
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found for mood logging.' });
        }

        const newMood = new Mood({
            userId: new mongoose.Types.ObjectId(userId), // Explicitly convert to ObjectId
            mood: mood,
            date: new Date(date) // Ensure date is stored as a Date object
        });
        await newMood.save();
        res.status(201).json({ message: 'Mood logged successfully!', mood: newMood });
    } catch (err) {
        console.error('Mood logging error:', err); // Log the full error object for more details
        // Check for Mongoose validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message, errors: err.errors });
        }
        res.status(500).json({ message: 'Failed to log mood. Please try again.', error: err.message });
    }
});

// 📈 GET: Get mood history for a specific user (for the graph)
app.get('/api/moods/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Validate userId as a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        // Find moods for the specific user, sorted by date ascending for chart display
        const moods = await Mood.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ date: 1 });
        res.status(200).json(moods);
    } catch (err) {
        console.error('Error fetching moods for user:', err.message);
        res.status(500).json({ message: 'Error fetching mood data.' });
    }
});

// --- Journaling Endpoints ---

// ✍️ POST: Save a new journal entry
app.post('/api/journal', async (req, res) => {
    const { userId, content } = req.body;

    if (!userId || !content) {
        return res.status(400).json({ message: 'User ID and content are required for journal entry.' });
    }

    try {
        // Validate userId as a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found for journal entry.' });
        }

        const newEntry = new JournalEntry({
            userId: new mongoose.Types.ObjectId(userId), // Explicitly convert to ObjectId
            content: content,
            date: new Date() // Automatically set current date/time
        });
        await newEntry.save();
        res.status(201).json({ message: 'Journal entry saved successfully!', entry: newEntry });
    } catch (err) {
        console.error('Error saving journal entry:', err); // Log full error
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message, errors: err.errors });
        }
        res.status(500).json({ message: 'Failed to save journal entry. Please try again.', error: err.message });
    }
});

// 📖 GET: Get journal entries for a specific user
app.get('/api/journal/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Validate userId as a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        const { limit, sort } = req.query;

        let query = JournalEntry.find({ userId: new mongoose.Types.ObjectId(userId) });

        if (sort) {
            query = query.sort(sort);
        } else {
            query = query.sort({ date: -1 });
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const entries = await query.exec();
        res.status(200).json(entries);
    } catch (err) {
        console.error('Error fetching journal entries:', err.message);
        res.status(500).json({ message: 'Failed to fetch journal entries.' });
    }
});

// --- User Profile Endpoints ---

// 👤 GET: Get user profile details (name, email, profilePictureUrl)
app.get('/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Validate userId as a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        const user = await User.findById(new mongoose.Types.ObjectId(userId)).select('fullName email profilePictureUrl');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({
            name: user.fullName,
            email: user.email,
            profilePictureUrl: user.profilePictureUrl || null
        });
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).json({ message: 'Failed to fetch user profile.', error: error.message });
    }
});

// ✏️ PUT: Update user profile (e.g., name, profilePictureUrl)
app.put('/api/users/:userId/profile', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Validate userId as a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID format.' });
        }

        const { name, profilePictureUrl } = req.body;

        if (name === undefined && profilePictureUrl === undefined) {
            return res.status(400).json({ message: 'No update data provided (name or profilePictureUrl).' });
        }

        const updateFields = {};
        if (name !== undefined) {
            updateFields.fullName = name;
        }
        if (profilePictureUrl !== undefined) {
            updateFields.profilePictureUrl = profilePictureUrl;
        }

        const user = await User.findByIdAndUpdate(
            new mongoose.Types.ObjectId(userId), // Explicitly convert to ObjectId
            updateFields,
            { new: true, runValidators: true }
        ).select('fullName email profilePictureUrl');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'Profile updated successfully!',
            name: user.fullName,
            profilePictureUrl: user.profilePictureUrl
        });
    } catch (error) {
        console.error('Error updating user profile:', error.message);
        res.status(500).json({ message: 'Failed to update profile.', error: error.message });
    }
});


// --- Serve Frontend Files ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});

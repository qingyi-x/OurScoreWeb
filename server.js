require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { sendVerificationEmail } = require('./utils/emailService');
const cors = require('cors');
const path = require('path');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    }
}));
app.use(express.static('public'));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Define User Schema
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

// Create User model
const User = mongoose.model('User', userSchema);

// Create a temporary storage for pending registrations
const pendingRegistrations = new Map();

// Registration route
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        console.log('Registration attempt:', { username, email });

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            console.log('User already exists:', { username, email });
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }

        // Check if there's a pending registration
        if (pendingRegistrations.has(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Verification email already sent. Please check your inbox.' 
            });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        // Store registration data temporarily
        pendingRegistrations.set(verificationToken, {
            username,
            email,
            password: hashedPassword,
            createdAt: new Date()
        });

        // Set timeout to clear pending registration after 24 hours
        setTimeout(() => {
            pendingRegistrations.delete(verificationToken);
        }, 24 * 60 * 60 * 1000);

        // Send verification email
        console.log('Attempting to send verification email');
        await sendVerificationEmail(email, verificationToken);
        console.log('Verification email sent successfully');

        res.json({ 
            success: true, 
            message: 'Please check your email to verify your account.' 
        });
    } catch (err) {
        console.error('Detailed registration error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed: ' + err.message 
        });
    }
});

// Email verification route
app.get('/verify/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const registrationData = pendingRegistrations.get(token);

        if (!registrationData) {
            return res.status(400).send('Invalid or expired verification token');
        }

        // Create new user
        const newUser = new User({
            username: registrationData.username,
            email: registrationData.email,
            password: registrationData.password,
            isVerified: true
        });

        await newUser.save();
        console.log('User created successfully:', registrationData.username);

        // Remove from pending registrations
        pendingRegistrations.delete(token);

        // Redirect to success page
        res.redirect('/verified.html');
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).send('Verification failed');
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('Login attempt for username:', username); // Add logging
        
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('User not found:', username);
            return res.json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', username);
            return res.json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        if (!user.isVerified) {
            console.log('Unverified user attempt:', username);
            return res.json({ 
                success: false, 
                message: 'Please verify your email before logging in' 
            });
        }

        // Login successful
        console.log('Successful login for user:', username);
        
        res.json({ 
            success: true,
            isProfileComplete: user.profile?.isProfileComplete || false
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred during login' 
        });
    }
});

// Profile setup route
app.post('/api/profile', async (req, res) => {
    try {
        const { firstName, lastName, school, program, graduationYear } = req.body;
        
        // Get username from request headers or body
        const username = req.headers.username || req.body.username;
        
        // Find user by username instead of userId
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('User not found for profile update:', username);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Update user profile
        user.profile = {
            firstName,
            lastName,
            school,
            program,
            graduationYear: parseInt(graduationYear),
            isProfileComplete: true
        };

        await user.save();
        console.log('Profile updated successfully for:', username);

        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile: ' + err.message 
        });
    }
});

// Middleware to check if profile is complete
const checkProfileComplete = async (req, res, next) => {
    try {
        const userId = req.session.userId; // Implement this based on your auth system
        const user = await User.findById(userId);
        
        if (!user?.profile?.isProfileComplete) {
            return res.redirect('/profile-setup.html');
        }
        next();
    } catch (err) {
        next(err);
    }
};

// Use middleware for protected routes
app.get('/dashboard', checkProfileComplete, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Add these routes to handle extension data
app.post('/api/scores', async (req, res) => {
    try {
        const { username, rScore, zScore, classes } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update or create scores data
        user.scores = {
            rScore,
            zScore,
            classes,
            lastUpdated: new Date()
        };

        await user.save();
        res.json({ success: true, message: 'Scores updated successfully' });
    } catch (err) {
        console.error('Score update error:', err);
        res.status(500).json({ success: false, message: 'Failed to update scores' });
    }
});

// Get user data for extension
app.get('/api/user-data', async (req, res) => {
    try {
        const username = req.headers.username;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: {
                profile: user.profile,
                scores: user.scores || {}
            }
        });
    } catch (err) {
        console.error('Data fetch error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch user data' });
    }
});

// Endpoint to save grades
app.post('/api/grades', (req, res) => {
    const grades = req.body;
    // Logic to save grades to MongoDB
    res.json({ message: 'Grades saved successfully', grades });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 
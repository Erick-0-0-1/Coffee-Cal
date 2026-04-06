// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// --- Mock Authentication Route ---
router.get('/login', (req, res) => {
    // In a real app, credentials would be checked here.
    res.json({ message: "Login successful (Mock)", token: "mock_jwt_token_123" });
});

// Middleware to protect routes (optional)
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (token && token.startsWith('Bearer ')) {
        // In a real app, verify token signature and expiry
        req.user = { id: 'user_xyz', username: 'authenticated_user' };
        next();
    } else {
        res.status(401).json({ message: "Access denied. No token provided." });
    }
};

// Example protected route
router.get('/profile', authMiddleware, (req, res) => {
    res.json({ 
        message: "Welcome to your profile!", 
        user: req.user 
    });
});

module.exports = router;
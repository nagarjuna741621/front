// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token'); // Common header for JWT

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach the decoded user payload to the request object
        req.user = decoded.user;
        next(); // Call next middleware/route handler
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
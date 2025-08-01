// backend/middleware/authorizeMiddleware.js
module.exports = function(roles = []) {
    // roles can be a single role string (e.g., 'admin') or an array of roles (e.g., ['admin', 'manager'])
    if (typeof roles === 'string') {
        roles = [roles]; // Convert a single role to an array
    }

    return (req, res, next) => {
        // Check if user is authenticated (authMiddleware should run before this)
        if (!req.user) {
            return res.status(401).json({ msg: 'No user data found, authorization denied' });
        }

        // Check if user's role is included in the authorized roles
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied: You do not have the required role.' });
        }

        next(); // User is authorized, proceed to the next middleware/route handler
    };
};
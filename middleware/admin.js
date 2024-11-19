// middleware/admin.js
function admin(req, res, next) {
    // Assuming req.user contains the user info after authentication
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, so continue to the route handler
    } else {
        res.status(403).json({ message: 'Access forbidden: admins only' });
    }
};
module.exports = admin;
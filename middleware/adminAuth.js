const adminAuth = (req, res, next) => {
    // Check for admin API key in headers
    const apiKey = req.header('X-API-KEY');

    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ message: 'Invalid API key' });
    }

    // Check if user is admin (from auth middleware)
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    next();
};

module.exports = adminAuth; 
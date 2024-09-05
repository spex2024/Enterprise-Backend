const extractUserId = (req, res, next) => {
    // Ensure the authenticate middleware has already populated req.user
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    // Extract the user ID
    const userId = req.user.id;

    // Attach the user ID to the request object or use it as needed
    req.userId = userId;

    // Proceed to the next middleware/route handler
    next();
};

export default extractUserId;

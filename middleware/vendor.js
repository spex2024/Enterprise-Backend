import jwt from 'jsonwebtoken';

export const authenticateVendor = (req, res, next) => {
    console.log('Token from cookies:', req.cookies.token); // Debugging line

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded vendor:', decoded.vendor); // Debugging line
        req.vendor = decoded.vendor;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

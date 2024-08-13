import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const authenticate = (req, res, next) => {
    const token = req.cookies.token; // Retrieve the token from cookies
    if (!token) {
        return res.status(401).json({ message: 'Access Denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Attach the user information to the request object
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

export default authenticate;

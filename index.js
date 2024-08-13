
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import connectToMongoDB from './db/db.js';
import userRoute from'./route/auth/route.js'
import agencyRoute from './route/auth/agency.js'
import vendorRoute from './route/auth/vendor.js'
import orderRoute from './route/auth/orders.js'
import adminRoute from "./route/auth/admin.js";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: ['http://localhost:3000','http://localhost:3001','http://localhost:3002','http://localhost:3003'], // Replace with your client URL
    credentials: true,
}));



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});





app.use('/api/user' , userRoute)
app.use('/api/enterprise' , agencyRoute)
app.use('/api/vendor' , vendorRoute)
app.use('/api/orders' ,orderRoute )
app.use('/api/admin' ,adminRoute)
// Connect to MongoDB and start server
connectToMongoDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to MongoDB', error);
    });





import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'
import userRoute from'./route/auth/route.js'
import agencyRoute from './route/auth/agency.js'
import vendorRoute from './route/auth/vendor.js'
import orderRoute from './route/auth/orders.js'
import adminRoute from "./route/auth/admin.js";
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";
import mongoose from "mongoose";

dotenv.config();

const app = express();


// Middleware
app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: ['https://main.d1tchh5v04pztk.amplifyapp.com','https://main.d1lolo334q00y7.amplifyapp.com','https://main.d2pyl4na0l0nj7.amplifyapp.com','https://main.d3h2qrol1316a6.amplifyapp.com','http://localhost:3000','http://localhost:3001'], // Replace with your client URL
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

app.get('/', (req, res) => {
    res.send('Hello World')
})

// Connect to MongoDB and start server
// connectToMongoDB()
//     .then(() => {
//         app.listen(PORT, () => {
//             console.log(`Server is running on port ${PORT}`);
//         });
//     })
//     .catch((error) => {
//         console.error('Failed to connect to MongoDB', error);
//     });
mongoose.connect(process.env.MONGODB_URI)
    .then(() => app.listen(process.env.PORT, () => {
        console.log(`Server connected to the database and running on port ${process.env.PORT}`);
    }))
    .catch((err) => console.log(`Database connection error: ${err.message}`));

// Add this to catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});





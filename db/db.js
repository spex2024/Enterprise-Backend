// // lib/db.js
// import mongoose from 'mongoose';
// import dotenv from "dotenv";
// dotenv.config();
// const connectToMongoDB = () => {
//     return new Promise((resolve, reject) => {
//         mongoose.connect( process.env.MONGODB_URI, {
//         })
//             .then(() => {
//                 console.log('Connected to MongoDB');
//                 resolve();
//             })
//             .catch((error) => {
//                 console.error('Error connecting to MongoDB', error);
//                 reject(error);
//             });
//     });
// };
//
// export default connectToMongoDB;

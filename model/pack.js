import mongoose from 'mongoose';

const packSchema = new mongoose.Schema({
    userCode: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    agency: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'returned','pending','cancelled'],
        required: true,
        default: 'active'
    },



}, { timestamps: true });

const Pack = mongoose.model('Pack', packSchema);
export default Pack;

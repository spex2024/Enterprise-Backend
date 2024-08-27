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
    date: {
        type: Date,
        required: true
    },
    agency: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'return'],
        required: true,
        default: 'active'
    },

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    }

}, { timestamps: true });

const Pack = mongoose.model('Pack', packSchema);
export default Pack;

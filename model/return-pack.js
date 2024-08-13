// models/packRequest.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const returnPackSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] },
}, { timestamps: true });

const PackRequest = mongoose.model('returnPack', returnPackSchema);

export default PackRequest;

// models/user.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    code: { type: String, unique: true, required: true },
    isVerified: { type: Boolean, default: false },
    agency: { type: Schema.Types.ObjectId, ref: 'Agency', required: true },
    activePack: { type: Number, default: 0 },
    returnedPack: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    moneyBalance: { type: Number, default: 0 }, // Add money balance field
    emissionSaved: { type: Number, default: 0 }, // Add money balance field
    imageUrl: { type: String },
    imagePublicId: { type: String },
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }], // Array of Order IDs associated with this User
    pack: { type: Schema.Types.ObjectId, ref: 'Pack' } // Reference to a single Pack document
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;

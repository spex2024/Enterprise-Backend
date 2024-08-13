import mongoose from 'mongoose';

const { Schema } = mongoose;

const AdminSchema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        imageUrl: { type: String },
        imagePublicId: { type: String },
        username : { type: String , required: true },
    },
    { timestamps: true }
);

const Admin = mongoose.model('Admin', AdminSchema);

export default Admin;

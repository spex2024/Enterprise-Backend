

import mongoose from 'mongoose';

const { Schema } = mongoose;


// Define the schema for Order
const orderSchema = new Schema({
    orderId:{ type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    meals: [{
        mealId: { type: Schema.Types.ObjectId, ref: 'Meal', required: true },
        main: { type: String, required: true },
        price: { type: Number, required: true },
        protein: { type: String, required: true },
        sauce: { type: String, required: true },
        extras: { type: String },

    }],
    imageUrl: { type: String , required: true },
    quantity: { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true },
    status: { type: String, required: true, default: 'Pending' }, // e.g., Pending, Completed, Canceled
}, { timestamps: true });

// Create Order model
const Order = mongoose.model('Order', orderSchema);

export default Order;
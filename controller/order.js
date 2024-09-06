import { Meal, Vendor } from "../model/vendor.js";
import Order from "../model/order.js";
import User from "../model/user.js";
import jwt from "jsonwebtoken";
import Pack from "../model/pack.js";

// Function to generate a custom order ID
const generateOrderId = () => {
    // Generate a random 5-digit string and prepend "ORD-" to it
    const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
    return `ORD-${randomStr}`;
};

export const placeOrder = async (req, res) => {
    try {
        // Destructure the cart, totalPrice, and totalQuantity from the request body
        const { cart: meals, totalPrice, totalQuantity } = req.body;

        // Get the user token from cookies and decode it to retrieve user info
        const token = req.cookies.token; // Assuming user ID is stored in cookies
        const decode = jwt.decode(token, process.env.JWT_SECRET);
        const user = decode.user.id; // Extract user ID

        // If user is not authenticated, return a 401 error
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Validate the meals array, ensuring it's not empty
        if (!meals || meals.length === 0) {
            return res.status(400).json({ message: 'No meals provided' });
        }

        // Extract meal IDs from the cart and find corresponding meal records
        const mealIds = meals.map(meal => meal.mealId);
        const foundMeals = await Meal.find({ '_id': { $in: mealIds } }).populate('vendor');

        // Extract meal images to store in the order
        const image = foundMeals.map((meal) => ({
            photo: meal.imageUrl
        }));

        // If no meals are found, return a 404 error
        if (!foundMeals) {
            return res.status(404).json({ message: 'One or more meals not found' });
        }

        // Retrieve the vendor from the first meal (assuming all meals belong to one vendor)
        const vendor = foundMeals[0].vendor;

        // If no vendor is found, return a 404 error
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found for the meal' });
        }

        // Ensure all meals belong to the same vendor
        for (const meal of foundMeals) {
            if (meal.vendor._id.toString() !== vendor._id.toString()) {
                return res.status(400).json({ message: 'Meals do not belong to the same vendor' });
            }
        }

        // Generate a custom order ID
        const customOrderId = generateOrderId();

        // Create a new order in the database
        const order = await Order.create({
            orderId: customOrderId,
            user: user,
            vendor: vendor._id,
            meals,
            totalPrice,
            totalQuantity,
            imageUrl: image[0]?.photo
        });

        // Push the order to the user's orders array
        await User.findByIdAndUpdate(user, { $push: { orders: order._id } });

        // Push the order to the vendor's orders array
        await Vendor.findByIdAndUpdate(vendor._id, { $push: { orders: order._id } });

        // Return the created order
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const completeOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order by its ID and populate user info
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Mark the order as completed
        order.status = 'completed';
        await order.save();

        // Find the vendor associated with the order
        const vendor = await Vendor.findById(order.vendor);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Update vendor's completed orders count and sales totals
        vendor.completedOrders += 1;
        vendor.totalSales += order.totalPrice;  // Assuming vendor schema has totalSales
        vendor.totalAmount += order.totalPrice;  // Assuming vendor schema has totalAmount
        await vendor.save();

        // Retrieve the user associated with the order and populate their agency info
        const user = await User.findById(order.user).populate('agency');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract user's full name and agency company name
        const packUser = `${user.firstName} ${user.lastName}`;
        const enterprise = user.agency.company;

        // Get the current date in YYYY-MM-DD format
        const currentDate = new Date().toISOString().split('T')[0];

        // Check if the pack already exists for the user; if not, create a new one
        let pack = await Pack.findOne({ userCode: user.code });
        if (!pack) {
            pack = await Pack.create({
                packId: `${user.code}-${currentDate}`,
                userCode: user.code,
                userName: packUser,
                agency: enterprise,
                status: 'active',
                issuedPack: 1,
            });
            user.pack = pack._id;
        } else {
            // If the pack exists, just update its status
            pack.status = 'active';
            await pack.save();
        }

        // Update user's activePack field (initialize if undefined)
        if (user.activePack === undefined) {
            user.activePack = 1;
        } else if (user.activePack === 0) {
            user.activePack += 1;
        }

        // Save the updated user
        await user.save();
        res.status(200).json({ message: 'Order marked as completed, user active pack number updated, and pack created/updated', activePackNumber: user.activePack, pack });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order by its ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Mark the order as cancelled
        order.status = 'cancelled';
        await order.save();

        // Find the vendor associated with the order
        const vendor = await Vendor.findById(order.vendor);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Increment the vendor's canceled orders count
        vendor.canceledOrders += 1;  // Assuming vendor schema has a canceledOrders field
        await vendor.save();

        res.status(200).json({ message: 'Order marked as cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

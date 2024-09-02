import { Meal, Vendor } from "../model/vendor.js";
import Order from "../model/order.js";
import User from "../model/user.js";
import jwt from "jsonwebtoken";
import Pack from "../model/pack.js";

// Function to generate a custom order ID
const generateOrderId = () => {

    const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
    return `ORD-${randomStr}`;
};

export const placeOrder = async (req, res) => {
    try {
        const { cart: meals, totalPrice, totalQuantity } = req.body;
        const token = req.cookies.token; // Assuming user ID is stored in cookies
        const decode = jwt.decode(token, process.env.JWT_SECRET);
        const user = decode.user.id;

        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Validate the meals array
        if (!meals || meals.length === 0) {
            return res.status(400).json({ message: 'No meals provided' });
        }

        // Validate and find each meal to get the vendor
        const mealIds = meals.map(meal => meal.mealId);
        const foundMeals = await Meal.find({ '_id': { $in: mealIds } }).populate('vendor');
        const image = foundMeals.map((meal) => ({
            photo:meal.imageUrl
        }));


        if (!foundMeals) {
            return res.status(404).json({ message: 'One or more meals not found' });
        }

        const vendor = foundMeals[0].vendor;

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found for the meal' });
        }

        // Validate that all meals belong to the same vendor
        for (const meal of foundMeals) {
            if (meal.vendor._id.toString() !== vendor._id.toString()) {
                return res.status(400).json({ message: 'Meals do not belong to the same vendor' });
            }
        }


        // Generate a custom order ID
        const customOrderId = generateOrderId();

        // Create a new order
        const order = await Order.create({
            orderId: customOrderId,
            user: user,
            vendor: vendor._id,
            meals,
            totalPrice,
            totalQuantity,
            imageUrl: image[0]?.photo
        });

        // Push the order to the respective user and vendor
        await User.findByIdAndUpdate(user, { $push: { orders: order._id } });
        await Vendor.findByIdAndUpdate(vendor._id, { $push: { orders: order._id } });

        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

export const completeOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order by ID and ensure it exists
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to "completed"
        order.status = 'completed';
        await order.save();

        // Find the vendor associated with this order
        const vendor = await Vendor.findById(order.vendor);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Update the vendor's number of completed orders and total sales
        vendor.completedOrders += 1;
        vendor.totalSales += order.totalPrice;  // Assuming you have a totalSales field in Vendor schema
        vendor.totalAmount += order.totalPrice;  // Assuming you have a totalAmount field in Vendor schema
        await vendor.save();

        // Find the user associated with this order
        const user = await User.findById(order.user).populate('agency');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const packUser = `${user.firstName} ${user.lastName}`;
         const enterprise = user.agency.company


        // Check if a pack already exists for the user on the current date
        const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
        let pack = await Pack.findOne({ userCode: user.code });

        if (!pack) {
            // Create a new pack if it doesn't exist
            pack = await Pack.create({
                packId: `${user.code}-${currentDate}`,
                userCode: user.code,
                userName: packUser,
                agency: enterprise, // Assuming user has an agency field
                status: 'active'
            });

            user.pack= pack._id;
        } else {
            // If the pack exists, update its status to active
            pack.status = 'active';
            await pack.save();

        }




        if (user.activePack === undefined) {
            // Initialize activePackNumber if it does not exist
            user.activePack = 1;
        } else if (user.activePack === 0) {
            // Increment activePackNumber if it is not 0
            user.activePack += 1;
        }


        // Save the updated user
        await user.save();
        res.status(200).json({ message: 'Order marked as completed, user active pack number updated, and pack created/updated', activePackNumber: user.activePackNumber, pack });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};



export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order by ID and ensure it exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to "canceled"
        order.status = 'cancelled';
        await order.save();

        // Find the vendor associated with this order
        const vendor = await Vendor.findById(order.vendor);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Update the vendor's number of canceled orders
        vendor.canceledOrders += 1;  // Assuming you have a canceledOrders field in Vendor schema
        await vendor.save();

        res.status(200).json({ message: 'Order marked as cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


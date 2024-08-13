// Submit a pack request
import User from "../model/user.js";
import PackRequest from "../model/return-pack.js";

export const submitPackRequest = async (req, res) => {
    const { code } = req.body;
    const userId = req.user.id; // Assuming you have middleware that sets req.user

    try {
        const user = await User.findById(userId);
        if (!user || user.code !== code) {
            return res.status(400).json({ message: 'Invalid code' });
        }

        // Create a new pack request
        const packRequest = await PackRequest.create({
            user: userId,
            code,
        });


        res.status(200).json({ message: 'Pack request submitted successfully', packRequest });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting pack request', error });
    }
};

// Approve a pack request
// Approve a pack request
// Approve or Reject a pack request
export const handlePackRequest = async (req, res) => {
    const { id, action } = req.body; // action can be 'approve' or 'reject'

    if (!id || !action) {
        return res.status(400).json({ message: 'id and action are required' });
    }

    try {
        // Find the pack request by its ID
        const packRequest = await PackRequest.findById(id).populate('user');
        if (!packRequest || (packRequest.status !== 'Pending' && action === 'approve')) {
            return res.status(400).json({ message: 'Invalid or already processed request' });
        }

        if (action === 'approve') {
            // Approve the pack request
            packRequest.status = 'Approved';
            await packRequest.save();

            // Update the user's returnedPack count, points, and moneyBalance
            const user = packRequest.user;
            user.returnedPack = (user.returnedPack || 0) + 1; // Increment returnedPack
            user.points = user.returnedPack * 2; // Set points to twice the returnedPack count
            user.moneyBalance = user.points * 0.50; // Set moneyBalance to points * 0.50
            await user.save();

            res.status(200).json({ message: 'Pack request approved and user rewarded', packRequest });
        } else if (action === 'reject') {
            // Reject the pack request
            packRequest.status = 'Rejected';
            await packRequest.save();

            res.status(200).json({ message: 'Pack request rejected', packRequest });
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Error handling pack request:', error); // Add logging
        res.status(500).json({ message: 'Error handling pack request', error });
    }
};



// Get all returned packs
export const getAllReturnedPacks = async (req, res) => {
    try {
        // Find all pack requests
        const packRequests = await PackRequest.find().populate('user');

        res.status(200).json({ packRequests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching returned packs', error });
    }
};

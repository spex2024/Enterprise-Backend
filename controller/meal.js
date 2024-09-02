// Import Vendor and Meal models
import { Meal, Vendor } from "../model/vendor.js";
import upload from "../middleware/multer-upload.js";
import  {v2 as cloudinary} from 'cloudinary'

export const createMeal = async (req, res) => {
    upload.single('image')(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ message: 'Image upload failed', error: err.message });
        }

        try {
            const vendorId = req.vendor.id

            // Assuming vendor ID is available from authenticated user

            const main = JSON.parse(req.body.main || '{}');
            const protein = JSON.parse(req.body.protein || '[]');
            const sauce = JSON.parse(req.body.sauce || '[]');
            const extras = JSON.parse(req.body.extras || '[]');

            // Ensure protein, sauce, and extras are arrays
            const proteins = Array.isArray(protein) ? protein.map(option => ({ name: option.option })) : [];
            const sauces = Array.isArray(sauce) ? sauce.map(option => ({ name: option.option })) : [];
            const extra = Array.isArray(extras) ? extras.map(option => ({ name: option.option })) : [];

            // Upload image to Cloudinary
            const uploadedPhoto = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: 'meals',
                        transformation: [
                            { quality: 'auto', fetch_format: 'auto' },
                            { crop: 'fill', gravity: 'auto', width: 500, height: 600 }
                        ]
                    },
                    (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve(result);
                    }
                ).end(req.file.buffer);
            });

            // Create a new meal instance
            const newMeal = await Meal.create({
                vendor: vendorId,
                main: {
                    name: main.name,
                    price: parseFloat(main.price), // Convert price to number
                },
                protein: proteins,
                sauce: sauces,
                extras: extra,
                imageUrl: uploadedPhoto.secure_url,
                imagePublicId: uploadedPhoto.public_id
            });

            // Associate this meal with the vendor
            await Vendor.findByIdAndUpdate(
                vendorId,
                { $push: { meals: newMeal._id } }, // Add the new meal's ID to the vendor's meals array
                { new: true }
            );

            res.status(201).json({ message: 'Meal created successfully', meal: newMeal });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err});
        }
    });
};

export const getAllMeals = async (req, res) => {
    try {
        // Fetch all meals from the database
        const meals = await Meal.find().populate('vendor'); // Optionally populate vendor details

        res.status(200).json(meals); // Send meals as JSON response
    } catch (err) {
        console.error('Error fetching meals:', err);
        res.status(500).json({ message: err });
    }
};
export const updateMeal = async (req, res) => {
    upload.single('image')(req, res, async function (err) {
        if (err) {
            return res.status(500).json({ message: 'Image upload failed', error: err.message });
        }

        try {
            const mealId = req.params.id;
            const meal = await Meal.findById(mealId);

            if (!meal) {
                return res.status(404).json({ message: 'Meal not found' });
            }

            const updatedData = {};

            if (req.body.main) {
                const main = JSON.parse(req.body.main);
                updatedData.main = {
                    name: main.name,
                    price: parseFloat(main.price)
                };
            }

            if (req.body.protein) {
                const protein = JSON.parse(req.body.protein);
                updatedData.protein = Array.isArray(protein) ? protein.map(option => ({ name: option.option })) : [];
            }

            if (req.body.sauce) {
                const sauce = JSON.parse(req.body.sauce);
                updatedData.sauce = Array.isArray(sauce) ? sauce.map(option => ({ name: option.option })) : [];
            }

            if (req.body.extras) {
                const extras = JSON.parse(req.body.extras);
                updatedData.extras = Array.isArray(extras) ? extras.map(option => ({ name: option.option })) : [];
            }

            if (req.file) {
                const uploadedPhoto = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'meals',
                            transformation: [
                                { quality: 'auto', fetch_format: 'auto' },
                                { crop: 'fill', gravity: 'auto', width: 500, height: 600 }
                            ]
                        },
                        (error, result) => {
                            if (error) {
                                return reject(error);
                            }
                            resolve(result);
                        }
                    ).end(req.file.buffer);
                });

                updatedData.imageUrl = uploadedPhoto.secure_url;
                updatedData.imagePublicId = uploadedPhoto.public_id;

                // Optionally, you may want to delete the old image from Cloudinary
                if (meal.imagePublicId) {
                    await cloudinary.uploader.destroy(meal.imagePublicId);
                }
            }

            // Update the meal with the new data
            const updatedMeal = await Meal.findByIdAndUpdate(mealId, updatedData, { new: true });

            res.status(200).json({ message: 'Meal updated successfully', meal: updatedMeal });
        } catch (err) {
            console.error('Error updating meal:', err);
            res.status(500).json({ message: err });
        }
    });
};

export const getMealById = async (req, res) => {
    try {
        const mealId = req.params.id;
        // Fetch the meal from the database by its ID
        const meal = await Meal.findById(mealId).populate('vendor'); // Optionally populate vendor details

        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        res.status(200).json(meal); // Send the meal as JSON response
    } catch (err) {
        console.error('Error fetching meal:', err);
        res.status(500).json({ message: err });
    }
};
// routes/vendorRoutes.js

import express from 'express';
import {
    createVendor,
    updateVendor,
    resetPassword,
    resendVerificationEmail,
    signIn,
    getCurrentVendor,
    verifyEmail,
    signOut,
    resetPasswordRequest,
    getSharedVendors,
    addVendor, deleteVendor, getVendor
} from "../../controller/vendor.js"; // Ensure all necessary methods are imported
import {
    createMeal,
    getAllMeals, getMealById, updateMeal
} from "../../controller/meal.js";
import authenticate from "../../middleware/protected.js";
import {authenticateVendor} from "../../middleware/vendor.js";
import attachUser from "../../middleware/user.js"


const router = express.Router();

// Vendor Routesrs
router.post('/register', createVendor);              // Route for creating a new vendor
router.post('/add-vendor', addVendor);              // Route for creating a new vendor
router.post('/login', signIn);
router.post('/logout',signOut)// Route for vendor login
router.put('/update/:vendorId', updateVendor);             // Route for updating vendor details
router.get('/vendor',authenticateVendor, getCurrentVendor); // Route for fetching vendors by agency
router.get('/:vendorId', getVendor);
router.get('/meal',attachUser, getSharedVendors); // Route for fetching vendors by agency
router.get('/verify/:token', verifyEmail); // Route for fetching vendors by agency
router.delete('/:vendorId', deleteVendor); // Route for fetching vendors by agency

// Password and Verification Routes
router.post('/request', resetPasswordRequest); // Request a password reset
router.post('/reset', resetPassword);                // Reset the password
router.post('/resend', resendVerificationEmail); // Resend verification email

// Meal Routes
router.post('/add-meal', authenticateVendor, createMeal);                        // Route for creating a new meal
router.get('/meals', getAllMeals);
router.put('/meal/:id', authenticateVendor, updateMeal);
router.get('/meal/:id', authenticateVendor, getMealById);
// Route for getting all meals

export default router;

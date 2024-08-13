import { Router } from 'express';
import {
    getAllUsers, getCurrentUser, getVendor, requestPasswordReset, resendVerificationEmail, resetPassword,
    signIn, signOut, signUp, updateUserInfo, verifyEmail
} from "../../controller/user.js";

import authenticate from "../../middleware/protected.js";
import { handlePackRequest, submitPackRequest} from "../../controller/returned-pack.js";
import {getAllVendors} from "../../controller/vendor.js";
 // Adjust the path as necessary

const router = Router();

// Public routes
router.post('/login', signIn);
router.post('/register', signUp);
router.get('/verify/:token', verifyEmail);
router.post('/resend', resendVerificationEmail);
router.get('/employees',authenticate,  getAllUsers);
router.get('/employee', getCurrentUser);
router.get('/vendor', authenticate, getVendor);
router.get('/vendors', authenticate, getAllVendors);
router.post('/logout', signOut);
router.post('/request', requestPasswordReset);
router.post('/reset', resetPassword);
router.post('/return-pack',authenticate, submitPackRequest);
router.post('/approve', handlePackRequest);
router.put('/update',authenticate, updateUserInfo);
//
// router.get('/profile', );

export default router;

import { Router } from 'express';
import {
    createAdmin,
    deleteAdmin,
    getAllAdmins, getAllAgencies, getAllOrders, getAllUsers, getAllVendors, getCurrentAdmin,
    resetPassword,
    signIn, signOut,
    updateAdmin
} from "../../controller/admin.js";
import authenticate from "../../middleware/protected.js";
import {getAllReturnedPacks} from "../../controller/returned-pack.js";


const router = Router();

// Public routes
router.post('/login', signIn);
router.post('/register', createAdmin);
router.get('/users',authenticate,  getAllAdmins);
router.get('/user', authenticate, getCurrentAdmin);
router.post('/logout',authenticate, signOut);
router.post('/reset', resetPassword);
router.put('/update',authenticate, updateAdmin);
router.delete('/update',authenticate, deleteAdmin);
router.get('/users', getAllUsers);
router.get('/vendors', getAllVendors);
router.get('/users', getAllAgencies);
router.get('/users', getAllOrders);
router.get('/return-packs', getAllReturnedPacks);
//
// router.get('/profile', );

export default router;

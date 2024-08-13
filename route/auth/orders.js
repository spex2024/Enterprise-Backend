import { Router } from 'express';
import {cancelOrder, completeOrder, placeOrder} from "../../controller/order.js";
import authenticate from "../../middleware/protected.js";
import {getAllOrders} from "../../controller/admin.js";

// Adjust the path as necessary

const router = Router();

// Public routes
router.post('/order', authenticate, placeOrder);
router.post('/complete',authenticate, completeOrder);
router.post('/cancel',authenticate, cancelOrder);
router.get('/orders',authenticate, getAllOrders);
// router.post('/register', signUp);
// router.get('/verify/:token', verifyEmail);
// router.post('/resend', resendVerificationEmail);
//
// router.get('/profile', );

export default router;

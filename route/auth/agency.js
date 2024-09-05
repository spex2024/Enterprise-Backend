import { Router } from 'express';
import {
    getAllAgencies,
    agencySignIn,
    agencySignUp,
    verifyAgencyEmail,
    getCurrentAgency,
    signOut,
    forgotAgencyPassword,
    resetAgencyPassword,
    resendVerificationEmail,
    addVendor, disconnectVendor
} from "../../controller/agency.js";
import authenticate from "../../middleware/protected.js";
import extractUserId from "../../middleware/extract.js";

const router = Router();

router.post('/login', agencySignIn);
router.post('/register', agencySignUp);
router.post('/logout', signOut);
router.post('/reset', resetAgencyPassword);
router.post('/request', forgotAgencyPassword);
router.post('/resend', resendVerificationEmail);
router.get('/agencies', authenticate,getAllAgencies);
router.get('/agency', authenticate ,getCurrentAgency );
router.post('/add-vendor', authenticate ,addVendor );
router.post('/disconnect',authenticate, disconnectVendor);
router.get('/verify/:token', verifyAgencyEmail);

export default router;

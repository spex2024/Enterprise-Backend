import { Router } from 'express';
import {
    getAllAgencies,
    agencySignIn,
    agencySignUp,
    verifyAgencyEmail, getCurrentAgency, signOut, forgotAgencyPassword, resetAgencyPassword, resendVerificationEmail
} from "../../controller/agency.js";
import authenticate from "../../middleware/protected.js";

const router = Router();

router.post('/login', agencySignIn);
router.post('/register', agencySignUp);
router.post('/logout', signOut);
router.post('/reset', resetAgencyPassword);
router.post('/request', forgotAgencyPassword);
router.post('/resend', resendVerificationEmail);
router.get('/agencies', getAllAgencies);
router.get('/agency', authenticate ,getCurrentAgency );
router.get('/verify/:token', verifyAgencyEmail);

export default router;

import Agency from "../model/agency.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from 'cloudinary';
import upload from "../middleware/multer-upload.js";
import Admin from "../model/admin.js";
import User from "../model/user.js";
import {Vendor} from "../model/vendor.js";
dotenv.config();
const URL = "https://main.d1lolo334q00y7.amplifyapp.com";
const verify = "https://enterprise-backend.vercel.app";
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: "spexdev95@gmail.com",
        pass: process.env.APP,
    },
});

const sendVerificationEmail = (agency, emailToken) => {
    const url = `${verify}/api/enterprise/verify/${emailToken}`;
    transporter.sendMail({
        to: agency.email,
        subject: 'Verify your email',
        html: `Thanks for signing up on spex platform , Company Name: ${agency.company}, Account ID: ${agency.code}. Click <a href="${url}">here</a> to verify your email.`
    });
};

const sendResetEmail = (agency, resetToken) => {
    const url = `${URL}/reset/password-reset?token=${resetToken}`;
    transporter.sendMail({
        to: agency.email,
        subject: 'Password Reset Request',
        html: `Click <a href="${url}">here</a> to reset your password.`,
    });
};

// Function to generate initials from company and branch
const generateInitials = (company, branch) => {
    const companyParts = company.split(' '); // Split company into parts by spaces
    const branchParts = branch.split(' '); // Split branch into parts by spaces
    let initials = '';

    // Get the first letter of each part and concatenate
    companyParts.forEach(part => {
        initials += part.charAt(0).toUpperCase(); // First letter of each part of company
    });

    branchParts.forEach(part => {
        initials += part.charAt(0).toUpperCase(); // First letter of each part of branch
    });

    return initials;
};

// Updated generateUniqueCode function to use initials
const generateUniqueCode = async (company, branch) => {
    const initials = generateInitials(company, branch);
    let code;
    const randomCounter = Math.floor(Math.random() * 900) + 100; // Generates a random number between 100 and 999
    const paddedCounter = String(randomCounter).padStart(3, '0');
    code = `${initials}${paddedCounter}`;
    return code;
};

const generateToken = (payload, expiresIn) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const agencySignUp = async (req, res) => {
    const uploadSingle = upload.single('profilePhoto');
    uploadSingle(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Multer error", error: err.message });
        }

        const { company, branch, email, password , phone , location} = req.body;
        const profilePhoto = req.file;

        if (!company || !branch || !email || !password ) {
            return res.status(400).json({ message: "Please fill in all required fields" });
        }

        try {
            const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
            const existingVendor = await Vendor.findOne({ $or: [{ email }, { phone }] });
            const existingAgency = await Agency.findOne({ $or: [{ email }, { phone }] });
            const existingAdmin = await Admin.findOne({ $or: [{ email }, { phone }] });

            if (existingUser || existingVendor || existingAgency || existingAdmin) {
                return res.status(400).json({ message: "Email or phone already in use by another account" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '2m' }); // Sign JWT token with email, set to expire in 2 minutes
            const initials = generateInitials(company, branch);
            const code = await generateUniqueCode(company, branch);

            // Upload profile photo to Cloudinary
            const uploadedPhoto = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: 'agency',
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
                ).end(profilePhoto.buffer);
            });

           const  agency = await Agency.create({
                company,
                branch,
                email,
                phone,
                location,
                code,
                initials,
                password: hashedPassword, // Remember to hash the password
                isVerified: false,
                imageUrl: uploadedPhoto.secure_url,
                imagePublicId: uploadedPhoto.public_id
            });

            sendVerificationEmail(agency, token); // Send verification email with JWT token

            setTimeout(async () => {
                const agencyToDelete = await Agency.findOne({ email, token });
                if (agencyToDelete && agencyToDelete.isVerified === false) {
                    await Agency.deleteOne({ email });
                    res.json(`Deleted agency ${email} due to expired verification token.`);
                }
            }, 2 * 60 * 1000); // Delete agency after 2 minutes if not verified

            res.status(200).json({ status: "Sign up successful, please check your email to verify your account." });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    });
};

export const verifyAgencyEmail = async (req, res) => {
    const token = req.params.token;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify JWT token
        const user = await Agency.findOne({ email: decoded.email });

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ message: 'Agency not found' });
        }

        // Check if the user is already verified
        if (user.isVerified) {
            return res.redirect(`${URL}/verify?status=verified`);
        }

        const agencyEmail = decoded.email;

        const agency = await Agency.findOneAndUpdate({ email: agencyEmail }, { isVerified: true });

        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }

        res.redirect(`${URL}/verify?status=success`); // Redirect on successful verification

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.redirect(`${URL}/verify?status=expired`);
        }
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    try {
        // Find agency by email
        const agency = await Agency.findOne({ email });
        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }

        // Check if the agency is already verified
        if (agency.isVerified) {
            return res.status(400).json({ message: 'Agency already verified' });
        }

        // Generate a new verification token
        const token = jwt.sign({ email: agency.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        sendVerificationEmail(agency, token);

        res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const agencySignIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        const agency = await Agency.findOne({ email });
        if (!agency) {
            return res.status(400).json({ message: 'Account does not exist or token has expired. Please create an account.' });
        }

        if (!agency.isVerified) {
            return res.status(400).json({ message: 'Please verify your email first' });
        }

        const match = await bcrypt.compare(password, agency.password);
        if (!match) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        const payload = {
            agency: {
                id: agency._id,
                email: agency.email,
            },
        };

        const token = generateToken(payload, '1d');
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',    // Use 'none' in production, 'lax' otherwise
            secure: true, // Secure flag true only in production
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });


        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const getAllAgencies = async (req, res) => {
    try {
        // Fetch only verified agencies
        const agencies = await Agency.find({ isVerified: true })
            .populate({
                path: 'users',
                populate: {
                    path: 'orders',
                    populate: {
                        path: 'vendor',
                    }
                }
            });

        res.status(200).json(agencies);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


export const getCurrentAgency = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const agency = await Agency.findById(decoded.agency.id).populate({
            path: 'users',
            populate: {
                path: 'orders',
                populate: [
                    {
                        path: 'user' // Populate user in orders
                    },
                    {
                        path: 'vendor' // Populate vendor in orders
                    }
                ]
            }
        }).populate('vendors');

        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }

        res.status(200).json(agency);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const forgotAgencyPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const agency = await Agency.findOne({ email });

        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }

        if (!agency.isVerified) {
            return res.status(400).json({ message: 'Check your email and verify your account.' });
        }

        const resetToken = generateToken({ email: agency.email }, '1h'); // Token expires in 1 hour
        agency.resetToken = resetToken;
        await agency.save();

        sendResetEmail(agency, resetToken);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const resetAgencyPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const agency = await Agency.findOne({ email: decoded.email });

        if (!agency) {
            return res.status(404).json({ message: 'Invalid token or agency not found' });
        }

        const isSamePassword = await bcrypt.compare(newPassword, agency.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'New password must be different from the old password.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        agency.password = hashedPassword;
        agency.resetToken = null;
        await agency.save();

        res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


export const updateAgencyProfile = async (req, res) => {
    const uploadSingle = upload.single('profilePhoto');
    uploadSingle(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Multer error", error: err.message });
        }

        const { company, branch, email , location } = req.body;
        const profilePhoto = req.file;

        if (!company || !branch || !email) {
            return res.status(400).json({ message: "Please fill in all required fields" });
        }

        try {
            const agency = await Agency.findOne({ email });
            if (!agency) {
                return res.status(404).json({ message: 'Agency not found' });
            }

            if (profilePhoto) {
                // Upload new profile photo to Cloudinary
                const uploadedPhoto = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'agency',
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
                    ).end(profilePhoto.buffer);
                });

                // Delete old profile photo from Cloudinary
                if (agency.imagePublicId) {
                    await cloudinary.uploader.destroy(agency.imagePublicId);
                }

                agency.imageUrl = uploadedPhoto.secure_url;
                agency.imagePublicId = uploadedPhoto.public_id;
            }

            agency.company = company;
            agency.branch = branch;
            await agency.save();

            res.status(200).json({ message: 'Profile updated successfully', agency });
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    });
};

export const updateAgencyPassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    try {
        const agency = await Agency.findOne({ email });

        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, agency.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        agency.password = hashedPassword;
        await agency.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const deleteAgencyAccount = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    try {
        const agency = await Agency.findOne({ email });

        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }

        const isMatch = await bcrypt.compare(password, agency.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        // Delete profile photo from Cloudinary
        if (agency.imagePublicId) {
            await cloudinary.uploader.destroy(agency.imagePublicId);
        }

        await agency.remove();

        res.status(200).json({ message: 'Agency account deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const signOut = (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


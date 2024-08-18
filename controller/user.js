import User from '../model/user.js';
import Agency from "../model/agency.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { v2 as cloudinary} from 'cloudinary'
import upload from "../middleware/multer-upload.js";
import {Vendor} from "../model/vendor.js";
import Admin from "../model/admin.js";
URL = process.env.USER_URL;
dotenv.config();

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

const sendVerificationEmail = (user, emailToken) => {
    const url = `http://localhost:8080/api/user/verify/${emailToken}`;
    transporter.sendMail({
        to: user.email,
        subject: 'Verify your email',
        html: `Thanks for signing up on spex platform ,  Account ID: ${user.code}. Click <a href="${url}">here</a> to verify your email.`
    });
}



const sendResetEmail = (user, resetToken) => {
    const url = `${URL}/reset/password-reset?token=${resetToken}`;
    transporter.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `Click <a href="${url}">here</a> to reset your password.`,
    });
};









// Function to generate unique user code based on agency's initials and random 3-digit counter
const generateUserCode = (agencyInitials, firstName, lastName) => {
    const counter = Math.floor(Math.random() * 900) + 100; // Generates a random number between 100 and 999
    return `${agencyInitials}${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}${counter}`;
};

const generateToken = (payload, expiresIn) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const signUp = async (req, res) => {
    const uploadSingle = upload.single('profilePhoto');
    uploadSingle(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Multer error", error: err.message });
        }

        const { firstName, lastName, email, password, code, phone } = req.body;
        const profilePhoto = req.file;

        if (!firstName || !lastName || !email || !password || !code || !phone ) {
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


            // Find the agency based on the provided code
            const agency = await Agency.findOne({ code });
            if (!agency) {
                return res.status(400).json({ message: "Invalid agency code" });
            }

            // Generate user code based on agency's initials
            const userCode = generateUserCode(agency.initials, firstName, lastName);

            // Upload profile photo to Cloudinary
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
                ).end(profilePhoto.buffer);
            });


            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await  User.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phone,
                imageUrl: uploadedPhoto.secure_url,
                imagePublicId: uploadedPhoto.public_id,
                code: userCode,
                agency: agency._id,
                isVerified: false,
            });


            // Generate email verification token
            const emailToken = generateToken({ userId: user._id, email: user.email }, '1h');

            sendVerificationEmail(user, emailToken);
            setTimeout(async () => {
                try {

                    const userToDelete = await User.findOne({ email:user.email });

                    if (userToDelete && userToDelete.isVerified === false) {
                        await User.deleteOne({ email });

                    }
                } catch (error) {
                    console.error(`Error deleting user ${email}:`, error.message);
                }
            }, 60 * 60 * 1000);

            res.status(200).json({ message: "User registered successfully. Please check your email for verification link." });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error", error });
        }
    });
};


export const verifyEmail = async (req, res) => {
    const token = req.params.token;

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user by email
        const user = await User.findOne({ email: decoded.email });

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is already verified
        if (user.isVerified) {
            return res.redirect(`${URL}/verify?status=verified`);
        }

        // Update user verification status
        await User.findOneAndUpdate({ email: decoded.email }, { isVerified: true });

        // Find the agency and update it
        const agency = await Agency.findById(user.agency);
        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }
        agency.users.push(user._id);
        await agency.save();

        // Redirect on successful verification
        return res.redirect(`${URL}/verify?status=success`);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.redirect(`${URL}/verify?status=expired`);
        }

        // Log error and send a generic server error response if necessary
        console.error(error.message);
        if (!res.headersSent) {
            return res.status(500).send('Server Error');
        }
    }
};

export const resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is already verified
        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        // Generate a new verification token
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        sendVerificationEmail(user, token);

        res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const signIn = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).populate('agency');

        if (!user) {
            return res.status(400).json({ message: 'Account does not exist or token has expired. Please create an account.' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email first.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Incorrect password.' });
        }

        const payload = {
            user: {
                id: user._id,
                email: user.email,
            },
        };

        const token = generateToken(payload, '1d');

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 1 hour
        });

        res.json({message: 'Login successful'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send(error.message);
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

export const getCurrentUser = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).populate('agency').populate('orders');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        res.status(200).json({ user});
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
};

export const getVendor = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access' });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).populate('agency');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch the agency and populate vendors
        const agency = await Agency.findById(user.agency._id).populate({
            path: 'vendors',
            populate: {
                path: 'meals',
                model: 'Meal' // Ensure this matches the correct meal model name
            }
        });

        if (!agency) {
            return res.status(404).json({ message: 'Agency not found' });
        }
         const vendors = agency.vendors
        res.status(200).json({ vendors});
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
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





export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User with this email does not exist.' });
        }
        if (user && user.isVerified === false) {
            return res.status(400).json({ message: 'check your email and verify your account' });
        }


        const resetToken = generateToken({ email: user.email }, '1h'); // Token expires in 15 minutes
        user.resetPasswordToken = resetToken;
        await user.save();

        sendResetEmail(user, resetToken);

        res.status(200).json({ message: 'Password reset link has been sent to your email.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};


export const resetPassword = async (req, res) => {

    const {newPassword:password , token} = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'New password must be different from the old password.' });
        }

        const newPassword = await bcrypt.hash(password, 10);
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send(error.message);
    }
};



export const updateUserInfo = async (req, res) => {
    const uploadSingle = upload.single('profilePhoto');
    uploadSingle(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Multer error", error: err.message });
        }

        const { firstName, lastName, phone } = req.body;
        const profilePhoto = req.file;



        try {
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if(firstName){

            user.firstName = firstName;
            }

            if(lastName){

            user.lastName = lastName;
            }

            if(phone){

                user.phone = phone;

            }


            if (profilePhoto) {
                // Delete the old profile photo from Cloudinary
                if (user.imagePublicId) {
                    await cloudinary.uploader.destroy(user.imagePublicId);
                }

                // Upload the new profile photo to Cloudinary
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
                    ).end(profilePhoto.buffer);
                });

                user.imageUrl = uploadedPhoto.secure_url;
                user.imagePublicId = uploadedPhoto.public_id;
            }

            await user.save();

            res.status(200).json({ message: "User information updated successfully", user });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: "Server error", error });
        }
    });
};


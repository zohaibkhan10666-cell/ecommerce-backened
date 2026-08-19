import User from '../models/userModel.js'
import { Session } from '../models/sessionModel.js'
import { hashPassword, comparePassword } from '../../utils/hash.js'
import jwt from 'jsonwebtoken'
import { sendOTPEmail } from '../../utils/emailService.js'
import dotenv from 'dotenv'

dotenv.config({ path: process.env.DOTENV_PATH || undefined })

const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || 'default_secret_key_12345'

export const register = async (req, res) => {
    try {
        console.log('Register body:', req.body)
        const { firstName, lastName, email, password } = req.body
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required", success: false })
        }
        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ message: "User already exists", success: false })
        }

        const hashedPassword = await hashPassword(password)
        const otp = Math.floor(10000 + Math.random() * 90000).toString()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            otp: otp,
            otpExpiry: otpExpiry
        })

        // Try to send verification email
        let emailSent = false;
        try {
            await sendOTPEmail(email, otp, 'verification')
            console.log('Verification email sent successfully')
            emailSent = true;
        } catch (emailError) {
            console.log('Email not sent - use this OTP:', otp)
        }

        const token = jwt.sign({ id: newUser._id, email: newUser.email }, SECRET_KEY, { expiresIn: '7d' })
        newUser.token = token
        await newUser.save()

        res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify your email with OTP.",
            token: token,
            otp: otp, // For testing - remove in production!
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role
            }
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ message: "Server error: " + error.message, success: false, error: error.message })
    }
}


export const verify = async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" })
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ success: false, message: "OTP expired" })
        }

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '7d' })

        user.token = token
        user.isVerified = true
        user.otp = null
        user.otpExpiry = null
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            token: token,
            user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName }
        })
    } catch (error) {
        console.error('Verification error:', error)
        res.status(500).json({ message: "Server error", error: error.message })
    }
}


export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required", success: false })
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false })
        }
        const isPasswordValid = await comparePassword(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials", success: false })
        }
        if (user.isVerified === false) {
            return res.status(400).json({ message: "Email not verified", success: false })
        }

        const accessToken = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '10d' })
        user.token = accessToken
        user.isloggedIn = true
        await user.save()

        return res.status(200).json({
            message: "Welcome back, " + user.firstName,
            user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
            accessToken,
            success: true
        })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}


export const logout = async (req, res) => {
    try {
        const userId = req.id
        if (!userId) {
            return res.status(400).json({ success: false, message: "User not authenticated" })
        }
        await Session.deleteMany({ userId })
        await User.findByIdAndUpdate(userId, { isloggedIn: false, token: null })
        res.status(200).json({ success: true, message: "Logged out successfully" })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}


export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(200).json({ success: true, message: "If the email exists, an OTP will be sent" })
        }

        const otp = Math.floor(10000 + Math.random() * 90000).toString()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

        user.otp = otp
        user.otpExpiry = otpExpiry
        await user.save()

        try {
            await sendOTPEmail(email, otp, 'reset')
            console.log('Password reset OTP sent to:', email)
        } catch (emailError) {
            console.log('Failed to send OTP email:', emailError.message)
        }

        res.status(200).json({ success: true, message: "OTP sent to email for password reset" })
    } catch (error) {
        console.error('Forgot password error:', error)
        res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}


export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" })
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ success: false, message: "OTP expired" })
        }

        const hashedPassword = await hashPassword(newPassword)
        user.password = hashedPassword
        user.otp = null
        user.otpExpiry = null
        await user.save()

        res.status(200).json({ success: true, message: "Password reset successfully" })
    } catch (error) {
        console.error('Reset password error:', error)
        res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}


export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -otp -otpExpiry')
        res.status(200).json({ success: true, message: "Users retrieved successfully", users })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}


export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id
        const user = await User.findById(userId).select('-password -otp -otpExpiry')
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }
        res.status(200).json({ success: true, message: "User retrieved successfully", user })
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}


export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" })
        }

        if (user.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" })
        }

        user.otp = null
        user.otpExpiry = null
        await user.save()

        res.status(200).json({ success: true, message: "OTP verified successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}

export const reVerify = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required", success: false })
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found", success: false })
        }

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '7d' })
        user.token = token
        await user.save()

        return res.status(200).json({
            message: "User reverified successfully",
            success: true,
            email: user.email,
            token: token
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        });
    }
}

export const promoteToAdmin = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        user.role = 'admin'
        await user.save()

        res.status(200).json({
            success: true,
            message: `User ${email} has been promoted to admin`,
            user: { id: user._id, email: user.email, role: user.role }
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}

export const changePassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: "New password and confirm password are required" })
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" })
        }

        const hashedPassword = await hashPassword(newPassword)
        user.password = hashedPassword
        await user.save()

        res.status(200).json({ success: true, message: "Password changed successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        console.log('Update profile req.id:', req.id);
        console.log('Update profile req.body:', req.body);
        const userId = req.id
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" })
        }

        const { firstName, lastName, phoneNo, address, address2, city, zipCode, profilePic } = req.body
        const user = await User.findById(userId)
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        if (firstName !== undefined && firstName !== '') user.firstName = firstName
        if (lastName !== undefined && lastName !== '') user.lastName = lastName
        if (phoneNo !== undefined && phoneNo !== '') user.phoneNo = phoneNo
        if (address !== undefined && address !== '') user.address = address
        if (address2 !== undefined && address2 !== '') user.address2 = address2
        if (city !== undefined && city !== '') user.city = city
        if (zipCode !== undefined && zipCode !== '') user.zipCode = zipCode
        if (profilePic !== undefined && profilePic !== '') user.profilePic = profilePic

        const savedUser = await user.save()

        console.log('Updated user saved:', savedUser.firstName, savedUser.phoneNo);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: { 
              id: savedUser._id, 
              firstName: savedUser.firstName, 
              lastName: savedUser.lastName, 
              email: savedUser.email, 
              role: savedUser.role, 
              isVerified: savedUser.isVerified,
              phoneNo: savedUser.phoneNo,
              address: savedUser.address,
              address2: savedUser.address2,
              city: savedUser.city,
              zipCode: savedUser.zipCode,
              profilePic: savedUser.profilePic
            }
        })
    } catch (error) {
        console.error('Update profile error:', error)
        return res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
}

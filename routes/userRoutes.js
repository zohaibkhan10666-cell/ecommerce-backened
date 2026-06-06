import express from 'express'
import { register, verify, reVerify, login, logout, forgotPassword, resetPassword, verifyOTP, changePassword, getAllUsers, promoteToAdmin, getUserById, updateUserProfile } from '../database/controllers/userController.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify', verify)
router.post('/reVerify', reVerify)
router.post('/login', login)
router.post('/logout', isAuthenticated, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/verify-otp/:email', verifyOTP)
router.post('/change-password/:email', changePassword)
router.get('/all-users', isAuthenticated, isAdmin, getAllUsers)
router.get('/get-users/:userId', getUserById)
router.put('/update-profile', isAuthenticated, updateUserProfile)

// Temporary route to promote user to admin (REMOVE AFTER USE)
router.post('/promote-to-admin', promoteToAdmin)

// TEMPORARY PUBLIC ROUTE FOR TESTING - Remove in production!
router.post('/make-admin-public', async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" })
        }
        
        const User = (await import('../database/models/userModel.js')).default
        const user = await User.findOne({ email })
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }
        
        user.role = 'admin'
        await user.save()
        
        res.status(200).json({ 
            success: true, 
            message: `User ${email} is now an admin!` 
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router

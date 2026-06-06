import jwt from 'jsonwebtoken'
import User from "../database/models/userModel.js"

const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || 'default_secret_key_12345'


export const isAuthenticated = async (req, res, next) => {
    try {
        // NOTE: `localStorage` is a browser API and is NOT available in Node/Express.
        // Use only request headers for auth.
        // Frontend sends: Authorization: Bearer <jwt>
        // Some clients may send: token/access_token headers
        let token = req.headers.authorization || req.headers.token || req.headers.access_token;

        // Normalize common case: "Bearer <jwt>" into just <jwt>
        if (typeof token === 'string' && token.toLowerCase().startsWith('bearer ')) {
            token = token.replace(/^Bearer\s+/i, '');
        }


        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided"
            })
        }


        token = token.replace(/^Bearer\s+/i, '').trim().replace(/^["']|["']$/g, '')
        
        if (!token || token.length < 10) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid token format"
            })
        }
        
        let verified
        try {
            verified = jwt.verify(token, SECRET_KEY)
        } catch (e) {
            const envSecret = process.env.SECRET_KEY
            if (envSecret && envSecret !== SECRET_KEY) {
                try {
                    verified = jwt.verify(token, envSecret)
                } catch (e2) {
                    // Ignore
                }
            }
        }
        
        if (!verified || !verified.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid token"
            })
        }
        
        if (!req.user || !req.user._id || req.user._id.toString() !== verified.id.toString()) {
            const user = await User.findById(verified.id).select('-password -otp -otpExpiry')
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                })
            }
            req.user = user
            req.id = user._id
        } else {
            req.id = verified.id
        }
        
        next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: " + error.message
        })
    }
}

export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Please login first"
            })
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admin access required"
            })
        }

        next()
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error during admin authorization"
        })
    }
}


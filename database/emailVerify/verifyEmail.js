import { sendOTPEmail } from '../../utils/emailService.js';

export const verifyEmail = async (email, otp) => {
    try {
        console.log(`Sending verification email to: ${email}`);
        
        const result = await sendOTPEmail(email, otp, 'verification');
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        return { 
            success: true, 
            message: "Verification email sent", 
            info: result.info 
        };
    } catch (error) {
        console.error("Error sending verification email:", error.message);
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
}

export default { verifyEmail };

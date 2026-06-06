import { sendOTPEmail } from '../../utils/emailService.js';

export const sentOTPMail = async (email, otp) => {
    try {
        console.log(`Sending password reset email to: ${email}`);
        
        const result = await sendOTPEmail(email, otp, 'password_reset');
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        return { 
            success: true, 
            message: "Password reset email sent", 
            info: result.info 
        };
    } catch (error) {
        console.error("Error sending password reset email:", error.message);
        throw new Error(`Failed to send password reset email: ${error.message}`);
    }
}

export default { sentOTPMail };


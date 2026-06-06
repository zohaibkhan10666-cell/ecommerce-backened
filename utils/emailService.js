import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Create Gmail transporter using SMTP
async function createGmailTransporter() {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    
    console.log('\n=== Creating Gmail Transporter ===');
    console.log('User:', mailUser);
    
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: mailUser,
            pass: mailPass
        },
        connectionTimeout: 30000
    });
    
    return transporter;
}

export async function sendOTPEmail(email, otp, type) {
    console.log('\n=== SENDING OTP EMAIL ===');
    console.log('To:', email);
    console.log('OTP:', otp);
    
    const subject = type === 'verification' ? 'Email Verification OTP' : 'Password Reset OTP';
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px;">
            <h2 style="color: #4CAF50;">Email Verification</h2>
            <p>Your OTP code is:</p>
            <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 20px; text-align: center; 
                        letter-spacing: 8px; font-size: 36px; border-radius: 10px;">
                ${otp}
            </h1>
            <p style="color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
    `;
    
    // Check if Gmail is configured
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
        try {
            console.log('Trying to send via Gmail...');
            const transporter = await createGmailTransporter();
            
            console.log('Verifying Gmail connection...');
            await transporter.verify();
            console.log('Gmail connection OK!');
            
            console.log('Sending email via Gmail to:', email);
            const info = await transporter.sendMail({
                from: process.env.MAIL_USER,
                to: email,
                subject: subject,
                html: htmlContent
            });
            
            console.log('✅ Email sent to Gmail successfully!');
            console.log('Message ID:', info.messageId);
            
            return { success: true, info: info, method: 'gmail' };
            
        } catch (error) {
            console.log('Gmail failed:', error.message);
            console.log('Will try Ethereal as fallback...');
        }
    } else {
        console.log('Gmail not configured, using Ethereal...');
    }
    
    // Fallback to Ethereal
    try {
        console.log('Creating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        
        console.log('Verifying Ethereal connection...');
        await transporter.verify();
        
        console.log('Sending via Ethereal...');
        const info = await transporter.sendMail({
            from: '"E-Commerce App" <test@ethereal.email>',
            to: email,
            subject: subject,
            html: htmlContent
        });
        
        console.log('✅ Email sent via Ethereal!');
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Preview URL:', previewUrl);
        
        return { success: true, info: info, previewUrl: previewUrl, method: 'ethereal' };
        
    } catch (error) {
        console.log('Ethereal also failed:', error.message);
        throw error;
    }
}

export default { sendOTPEmail };

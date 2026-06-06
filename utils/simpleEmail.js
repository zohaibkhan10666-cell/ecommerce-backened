import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== SIMPLE EMAIL SERVICE ===');
console.log('MAIL_USER:', process.env.MAIL_USER ? 'SET' : 'NOT SET');
console.log('MAIL_PASS length:', process.env.MAIL_PASS ? process.env.MAIL_PASS.length : 'NOT SET');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    transporter.verify()
        .then(function() {
            console.log('SMTP Connection OK');
        })
        .catch(function(err) {
            console.log('SMTP Connection Failed:', err.message);
        });
}

export const sendOTPEmail = async function(email, otp, type) {
    const subject = type === 'verification' ? 'Email Verification OTP' : 'Password Reset OTP';
    const htmlContent = '<div style="font-family:Arial;padding:20px;"><h2>Your OTP</h2><h1 style="background:#eee;padding:10px;">' + otp + '</h1><p>Expires in 10 minutes</p></div>';
    
    const info = await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: subject,
        html: htmlContent
    });
    
    console.log('Email sent:', info.messageId);
    return { success: true, info: info };
};

export default { sendOTPEmail: sendOTPEmail };

// Cloudinary configuration - lazy loads only when credentials are configured
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

let isConfigured = false;

// Check if Cloudinary credentials are provided
const checkConfig = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
    
    if (!isConfigured) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      isConfigured = true;
      console.log('✅ Cloudinary configured successfully');
    }
    return true;
  }
  return false;
};

// Upload image to Cloudinary - returns null if not configured
export const uploadImage = async (base64String, options = {}) => {
  if (!checkConfig() || !base64String) {
    return null;
  }

  try {
    const defaultOptions = {
      folder: 'user_profiles',
      resource_type: 'image',
      ...options
    };

    const result = await cloudinary.uploader.upload(base64String, defaultOptions);
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    return null;
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  if (!checkConfig() || !publicId) {
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
    return false;
  }
};

export default cloudinary;


import mongoose from "mongoose";

const connectDB = async () => {
// Use Atlas first, fallback to local
  const uri = process.env.MONGO_URI || process.env.mongo_uri || 'mongodb://127.0.0.1:27017/ecommerce';
  console.log('Using DB URI:', uri.replace(/\/\/[^@]+@/, '//user:***@')); // Hide password

  
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    // Don't exit, just warn - server can still run for testing
    console.warn("Server will continue without database connection");
  }
};

export default connectDB;

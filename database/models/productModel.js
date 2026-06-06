import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: null },
    category: { type: String, required: true },
    subCategory: { type: String },
    brand: { type: String },
    images: [{ type: String }], // Array of image URLs
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }],
    specifications: {
        color: { type: String },
        size: { type: String },
        weight: { type: String },
        dimensions: { type: String },
        material: { type: String },
        other: { type: String }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model("Product", productSchema);


import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    subtotal: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true }
    },
    items: [orderItemSchema],
    shippingAddress: {
        address: { type: String, required: true },
        address2: { type: String },
        city: { type: String, required: true },
        state: { type: String },
        zipCode: { type: String, required: true },
        country: { type: String, default: 'India' },
        phoneNo: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'upi', 'netbanking'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentDetails: {
        transactionId: { type: String },
        paidAt: { type: Date }
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String }
}, { timestamps: true });

/**
 * Generate order number before saving.
 * IMPORTANT: Use normal function signature `pre('save', function(next){})`
 * so Mongoose provides `next` correctly.
 */
orderSchema.pre('save', async function () {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        this.orderNumber = `ORD-${year}${month}-${random}`;
    }
});

// Index for faster queries
orderSchema.index({ 'user.userId': 1 });

orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);


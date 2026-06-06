import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Get counts
        const [
            totalUsers,
            totalProducts,
            totalOrders,
            activeProducts,
            lowStockProducts
        ] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments({ isActive: true }),
            Product.countDocuments({ isActive: true }),
            Product.countDocuments({ 
                isActive: true, 
                stock: { $lt: 10, $gt: 0 } 
            })
        ]);

        // Get revenue stats
        const revenueStats = await Order.aggregate([
            { 
                $match: { 
                    isActive: true,
                    paymentStatus: 'paid',
                    orderStatus: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' }
                }
            }
        ]);

        // Get recent orders
        const recentOrders = await Order.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderNumber total orderStatus paymentStatus createdAt user.name');

        // Get recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName email role createdAt');

        // Get orders by status
        const ordersByStatus = await Order.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        // Get top selling products
        const topProducts = await Order.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$items' },
            { 
                $group: { 
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: '$items.subtotal' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        const revenue = revenueStats[0]?.totalRevenue || 0;
        const totalCompletedOrders = revenueStats[0]?.totalOrders || 0;
        const avgOrderValue = revenueStats[0]?.averageOrderValue || 0;

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalProducts,
                activeProducts,
                totalOrders,
                lowStockProducts,
                revenue,
                totalCompletedOrders,
                avgOrderValue,
                recentOrders,
                recentUsers,
                ordersByStatus,
                topProducts
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Admin: Get all users with pagination
export const getAllUsersAdmin = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 20 } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -otp -otpExpiry -token')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get all users admin error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Admin: Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role. Must be 'user' or 'admin'"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent demoting yourself
        if (user._id.toString() === req.id && role === 'user') {
            return res.status(400).json({
                success: false,
                message: "You cannot demote yourself"
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User role updated to ${role}`,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Admin: Delete user (soft delete)
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent deleting yourself
        if (userId === req.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Admin: Get order statistics
export const getOrderStats = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        let dateFilter = new Date();
        switch (period) {
            case 'week':
                dateFilter.setDate(dateFilter.getDate() - 7);
                break;
            case 'month':
                dateFilter.setMonth(dateFilter.getMonth() - 1);
                break;
            case 'year':
                dateFilter.setFullYear(dateFilter.getFullYear() - 1);
                break;
            default:
                dateFilter.setMonth(dateFilter.getMonth() - 1);
        }

        const stats = await Order.aggregate([
            {
                $match: {
                    isActive: true,
                    createdAt: { $gte: dateFilter }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
            { $limit: 30 }
        ]);

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Admin: Get product statistics
export const getProductStats = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    totalStock: { $sum: '$stock' },
                    avgRating: { $avg: '$rating' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const totalProducts = await Product.countDocuments({ isActive: true });
        const outOfStock = await Product.countDocuments({ isActive: true, stock: 0 });
        const lowStock = await Product.countDocuments({ isActive: true, stock: { $gt: 0, $lt: 10 } });

        res.status(200).json({
            success: true,
            stats,
            summary: {
                totalProducts,
                outOfStock,
                lowStock,
                inStock: totalProducts - outOfStock
            }
        });
    } catch (error) {
        console.error('Get product stats error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


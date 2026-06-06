import express from 'express';
import { 
    getDashboardStats, 
    getAllUsersAdmin, 
    updateUserRole, 
    deleteUser,
    getOrderStats,
    getProductStats
} from '../database/controllers/adminController.js';
import { 
    getAllOrders, 
    updateOrderStatus, 
    updatePaymentStatus, 
    deleteOrder 
} from '../database/controllers/orderController.js';
import { isAuthenticated, isAdmin } from '../middleware/isAuthenticated.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/stats/orders', getOrderStats);
router.get('/stats/products', getProductStats);

// User Management
router.get('/users', getAllUsersAdmin);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Order Management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/payment', updatePaymentStatus);
router.delete('/orders/:id', deleteOrder);

export default router;


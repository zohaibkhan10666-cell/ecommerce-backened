import express from 'express';
import { 
    createOrder, 
    getUserOrders, 
    getOrderById,
    initiateJazzcashPayment
} from '../database/controllers/orderController.js';
import { isAuthenticated } from '../middleware/isAuthenticated.js';

const router = express.Router();

// User routes (require authentication)
router.post('/', isAuthenticated, createOrder);
router.get('/my-orders', isAuthenticated, getUserOrders);
router.get('/:id', isAuthenticated, getOrderById);

/**
 * NOTE:
 * JazzCash initiation endpoint is handled by `backened/routes/jazzcashRoutes.js` under:
 *   POST /api/v1/orders/jazzcash/initiate-jazzcash
 *
 * Duplicated `/initiate-jazzcash*` endpoints here can cause routing/middleware confusion
 * and break test mode (`next is not a function`). Kept empty intentionally.
 */


export default router;




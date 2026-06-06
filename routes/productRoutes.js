import express from 'express';
import { 
    getProducts, 
    getProductById, 
    getFeaturedProducts, 
    getCategories,
    createProduct,
    updateProduct,
    deleteProduct
} from '../database/controllers/productController.js';
import { isAuthenticated, isAdmin } from '../middleware/isAuthenticated.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin routes
router.post('/', isAuthenticated, isAdmin, createProduct);
router.put('/:id', isAuthenticated, isAdmin, updateProduct);
router.delete('/:id', isAuthenticated, isAdmin, deleteProduct);

export default router;


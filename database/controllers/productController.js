import Product from '../models/productModel.js';
import mongoose from 'mongoose';
import sampleProducts from '../sampleProducts.js';

// Get all products with filtering, sorting, pagination - FIXED: timeouts, sequential queries
export const getProducts = async (req, res) => {
    try {
        console.log('Fetching products with query:', req.query);
        
        const {
            search,
            category,
            minPrice,
            maxPrice,
            brand,
            rating,
            sortBy,
            sortOrder,
            page = 1,
            limit = 12,
            featured
        } = req.query;

        // Build query
        const query = { isActive: true };

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Price range
        const priceQuery = {};
        if (minPrice) priceQuery.$gte = Number(minPrice);
        if (maxPrice) priceQuery.$lte = Number(maxPrice);
        if (Object.keys(priceQuery).length > 0) {
            query.price = priceQuery;
        }

        // Brand filter
        if (brand) {
            query.brand = { $regex: brand, $options: 'i' };
        }

        // Rating filter
        if (rating) {
            query.rating = { $gte: Number(rating) };
        }

        // Featured filter
        if (featured === 'true') {
            query.isFeatured = true;
        }

        // Sorting
        let sort = { createdAt: -1 };
        if (sortBy) {
            const order = sortOrder === 'asc' ? 1 : -1;
            switch (sortBy) {
                case 'price':
                    sort = { price: order };
                    break;
                case 'rating':
                    sort = { rating: order };
                    break;
                case 'name':
                    sort = { name: order };
                    break;
                case 'popularity':
                    sort = { reviewCount: order };
                    break;
            }
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const skip = (pageNum - 1) * limitNum;

        // SEQUENTIAL QUERIES WITH TIMEOUTS (fix parallel timeout)
        // If DB is not connected, return sample fallback data
        if (mongoose.connection.readyState !== 1) {
            console.warn('MongoDB not connected - returning sample products fallback');
            const fallback = sampleProducts.filter(p => p.isActive);
            return res.status(200).json({
                success: true,
                products: fallback,
                pagination: { page: 1, limit: fallback.length, total: fallback.length, pages: 1 },
                filters: { categories: [...new Set(fallback.map(p=>p.category))], brands: [...new Set(fallback.map(p=>p.brand))], minPrice: Math.min(...fallback.map(p=>p.price)), maxPrice: Math.max(...fallback.map(p=>p.price)) }
            });
        }

        const products = await Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .maxTimeMS(5000) // 5s timeout
            .lean();

        const total = await Product.countDocuments(query).maxTimeMS(5000);

        // Filters with defaults & timeouts
        const categories = await Product.distinct('category', { isActive: true }).maxTimeMS(5000).catch(() => []);
        const brands = await Product.distinct('brand', { isActive: true, brand: { $exists: true, $ne: '' } }).maxTimeMS(5000).catch(() => []);
        
        const minPriceProduct = await Product.findOne({ isActive: true }).select('price').sort({ price: 1 }).maxTimeMS(5000).lean();
        const maxPriceProduct = await Product.findOne({ isActive: true }).select('price').sort({ price: -1 }).maxTimeMS(5000).lean();

        console.log(`Products found: ${products.length}, Total: ${total}, Categories: ${categories.length}`);

        res.status(200).json({
            success: true,
            products: products || [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total || 0,
                pages: Math.ceil((total || 0) / limitNum)
            },
            filters: {
                categories: categories || [],
                brands: brands || [],
                minPrice: minPriceProduct?.price || null,
                maxPrice: maxPriceProduct?.price || null
            }
        });
    } catch (error) {
        console.error('Get products error:', error.message);
        res.status(500).json({
            success: false,
            message: "Server error loading products",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
        });
    }
};


// Get single product
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        // Fallback to sample data when DB is not connected
        if (mongoose.connection.readyState !== 1) {
            const product = sampleProducts.find(p => p._id === id || p.id === id || String(p._id) === id || p.name === id);
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }
            const relatedProducts = sampleProducts.filter(p => p.category === product.category && p.name !== product.name).slice(0, 4);
            return res.status(200).json({ success: true, product, relatedProducts });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Get related products (same category)
        const relatedProducts = await Product.find({ category: product.category, _id: { $ne: product._id }, isActive: true }).limit(4);

        res.status(200).json({ success: true, product, relatedProducts });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const products = sampleProducts.filter(p => p.isActive && p.isFeatured).slice(0, 8);
            return res.status(200).json({ success: true, products });
        }

        const products = await Product.find({ isActive: true, isFeatured: true }).sort({ rating: -1, reviewCount: -1 }).limit(8);

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Get categories - FIXED: timeout handling
export const getCategories = async (req, res) => {
    try {
        console.log('Fetching categories...');
        
        const categories = await Product.distinct('category', { isActive: true })
            .maxTimeMS(5000)
            .catch(() => []);

        // Simplified aggregate with timeout
        const categoryData = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
        ], { maxTimeMS: 5000 }).catch(() => []);

        console.log(`Categories found: ${categories.length}`);

        res.status(200).json({
            success: true,
            categories: categories || [],
            categoryData: categoryData || []
        });
    } catch (error) {
        console.error('Get categories error:', error.message);
        res.status(500).json({
            success: false,
            message: "Server error loading categories",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
        });
    }
};


// Admin: Create product
export const createProduct = async (req, res) => {
    try {
        const productData = {
            ...req.body,
            createdBy: req.user?._id
        };

        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Admin: Update product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// Admin: Delete product (soft delete)
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


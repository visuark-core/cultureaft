const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');



/**
 * Get all products with filtering and pagination
 */
const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            search,
            minPrice,
            maxPrice,
            inStock,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            isFeatured,
            isNew
        } = req.query;

        const query = { isActive: true };

        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        if (search) {
            const searchLower = search.toLowerCase();
            query.$or = [
                { name: { $regex: searchLower, $options: 'i' } },
                { description: { $regex: searchLower, $options: 'i' } },
                { sku: { $regex: searchLower, $options: 'i' } },
                { tags: { $regex: searchLower, $options: 'i' } }
            ];
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) {
                query.price.$gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                query.price.$lte = parseFloat(maxPrice);
            }
        }

        if (inStock === 'true') {
            query.stock = { $gt: 0 };
        }

        if (isFeatured === 'true') {
            query.isFeatured = true;
        }

        if (isNew === 'true') {
            query.isNew = true;
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, totalCount] = await Promise.all([
            Product.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalCount / parseInt(limit));

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
};

/**
 * Get single product by ID
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const product = await Product.findById(id).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product',
            error: error.message
        });
    }
};

/**
 * Create new product (Admin only)
 */
const createProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const productData = {
            ...req.body,
            createdBy: req.user?.id
        };

        // Handle image uploads if present
        if (req.files && req.files.length > 0) {
            const imageUrls = [];
            const publicIds = [];

            for (const file of req.files) {
                imageUrls.push(file.path);
                publicIds.push(file.filename);
            }

            productData.image = imageUrls[0];
            productData.images = imageUrls;
            productData.imagePublicIds = publicIds;
        } else if (req.body.image) {
            // Handle image URL directly
            productData.image = req.body.image;
            if (req.body.images) {
                productData.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
            }
        }

        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Error creating product:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SKU already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message
        });
    }
};/**

 * Update product (Admin only)
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const updateData = {
            ...req.body,
            updatedBy: req.user?.id
        };

        // Handle new image uploads
        if (req.files && req.files.length > 0) {
            const imageUrls = [];
            const publicIds = [];

            for (const file of req.files) {
                imageUrls.push(file.path);
                publicIds.push(file.filename);
            }

            updateData.image = imageUrls[0];
            updateData.images = imageUrls;
            updateData.imagePublicIds = publicIds;
        } else if (req.body.image) {
            // Handle image URL directly
            updateData.image = req.body.image;
            if (req.body.images) {
                updateData.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
            }
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Error updating product:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this SKU already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message
        });
    }
};

/**
 * Delete product (Admin only)
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete images from Cloudinary
        if (product.imagePublicIds && product.imagePublicIds.length > 0) {
            try {
                await Promise.all(
                    product.imagePublicIds.map(publicId =>
                        cloudinary.uploader.destroy(publicId)
                    )
                );
            } catch (cloudinaryError) {
                console.error('Error deleting images from Cloudinary:', cloudinaryError);
            }
        }

        await Product.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message
        });
    }
};/**
 *
 Get products by category
 */
const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        const filter = {
            category: { $regex: category, $options: 'i' },
            isActive: true
        };

        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, totalCount] = await Promise.all([
            Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalCount / parseInt(limit));

        res.json({
            success: true,
            data: {
                products,
                category,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products by category',
            error: error.message
        });
    }
};

/**
 * Get featured products
 */
const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const products = await Product.find({
            isActive: true,
            isFeatured: true
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured products',
            error: error.message
        });
    }
};

/**
 * Get product categories
 */
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category', { isActive: true });

        // Get category counts
        const categoryCounts = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const categoriesWithCounts = categoryCounts.map(cat => ({
            name: cat._id,
            count: cat.count
        }));

        res.json({
            success: true,
            data: {
                categories,
                categoriesWithCounts
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getFeaturedProducts,
    getCategories
};
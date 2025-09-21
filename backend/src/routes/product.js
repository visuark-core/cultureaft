const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// GET /api/products
router.get('/', productController.getAllProducts);

// GET /api/products/:id
router.get('/:id', productController.getProductById);

// POST /api/products
router.post('/', upload.any(), productController.createProduct);

// PUT /api/products/:id
router.put('/:id', upload.any(), productController.updateProduct);

// DELETE /api/products/:id
router.delete('/:id', productController.deleteProduct);

module.exports = router;

const Product = require('../models/Product');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    // Merge req.body and file info
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Map file fields to schema fields
        if (file.fieldname === 'mainImage') data.mainImage = file.path;
        if (file.fieldname === 'instructions') data.instructions = file.path;
        if (file.fieldname === 'complianceCertificates') {
          if (!data.complianceCertificates) data.complianceCertificates = [];
          data.complianceCertificates.push(file.path);
        }
        if (["additionalImages","lifestyleImages","infographicImages","view360","productVideos"].includes(file.fieldname)) {
          if (!data[file.fieldname]) data[file.fieldname] = [];
          data[file.fieldname].push(file.path);
        }
      });
    }
    // Convert arrays from string if needed
    ["additionalImages","lifestyleImages","infographicImages","view360","productVideos","complianceCertificates"].forEach(field => {
      if (typeof data[field] === 'string') {
        data[field] = [data[field]];
      }
    });

    // Convert numbers and dates from string
    const numberFields = [
      'regularPrice','discountPrice','minPrice','maxPrice','stockQty','safetyStock','handlingTime','shippingWeight'
    ];
    numberFields.forEach(field => {
      if (data[field] !== undefined) {
        const n = Number(data[field]);
        if (!isNaN(n)) data[field] = n;
      }
    });
    const dateFields = [
      'offerStart','offerEnd','restockDate','expiryDate'
    ];
    dateFields.forEach(field => {
      if (data[field]) {
        const d = new Date(data[field]);
        if (!isNaN(d.getTime())) data[field] = d;
      }
    });

    const product = new Product(data);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Product creation error:', err);
    console.error('Received body:', req.body);
    console.error('Received files:', req.files);
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.fieldname === 'mainImage') data.mainImage = file.path;
        if (file.fieldname === 'instructions') data.instructions = file.path;
        if (file.fieldname === 'complianceCertificates') {
          if (!data.complianceCertificates) data.complianceCertificates = [];
          data.complianceCertificates.push(file.path);
        }
        if (["additionalImages","lifestyleImages","infographicImages","view360","productVideos"].includes(file.fieldname)) {
          if (!data[file.fieldname]) data[file.fieldname] = [];
          data[file.fieldname].push(file.path);
        }
      });
    }
    ["additionalImages","lifestyleImages","infographicImages","view360","productVideos","complianceCertificates"].forEach(field => {
      if (typeof data[field] === 'string') {
        data[field] = [data[field]];
      }
    });
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

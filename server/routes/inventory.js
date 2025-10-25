const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const mongoose = require('mongoose');

const {
  validateObjectId,
  sanitizeRequest,
  securityHeaders
} = require('../middleware/validation');

// Apply middleware to all routes
router.use(securityHeaders);
router.use(sanitizeRequest);

// In-memory reservations store (in production, use Redis or database)
const reservations = new Map();

/**
 * Get stock level for a single product
 */
router.get('/stock/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Find product by ID or SKU
    const product = await Product.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(productId) ? productId : null },
        { sku: productId }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        data: null
      });
    }

    // Calculate reserved stock from active reservations
    let reservedStock = 0;
    const now = new Date();
    
    for (const [reservationId, reservation] of reservations.entries()) {
      if (reservation.expiry > now) {
        const reservedItem = reservation.items.find(item => 
          item.id === productId || item.id === product._id.toString()
        );
        if (reservedItem) {
          reservedStock += reservedItem.quantity;
        }
      } else {
        // Clean up expired reservations
        reservations.delete(reservationId);
      }
    }

    const stockLevel = {
      productId: product._id,
      availableStock: Math.max(0, (product.stock || 100) - reservedStock),
      reservedStock: reservedStock,
      totalStock: product.stock || 100,
      isAvailable: product.status === 'active' && (product.stock || 100) > reservedStock,
      lowStockThreshold: product.lowStockThreshold || 10,
      isLowStock: (product.stock || 100) - reservedStock <= (product.lowStockThreshold || 10)
    };

    res.status(200).json({
      success: true,
      data: stockLevel,
      message: 'Stock level retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching stock level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock level',
      data: null
    });
  }
});

/**
 * Get stock levels for multiple products
 */
router.post('/batch-stock', async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required',
        data: null
      });
    }

    const stocks = [];
    const now = new Date();

    // Clean up expired reservations first
    for (const [reservationId, reservation] of reservations.entries()) {
      if (reservation.expiry <= now) {
        reservations.delete(reservationId);
      }
    }

    for (const productId of productIds) {
      try {
        const product = await Product.findOne({
          $or: [
            { _id: mongoose.Types.ObjectId.isValid(productId) ? productId : null },
            { sku: productId }
          ]
        });

        if (!product) {
          continue; // Skip products that don't exist
        }

        // Calculate reserved stock
        let reservedStock = 0;
        for (const reservation of reservations.values()) {
          const reservedItem = reservation.items.find(item => 
            item.id === productId || item.id === product._id.toString()
          );
          if (reservedItem) {
            reservedStock += reservedItem.quantity;
          }
        }

        const stockLevel = {
          productId: product._id,
          availableStock: Math.max(0, (product.stock || 100) - reservedStock),
          reservedStock: reservedStock,
          totalStock: product.stock || 100,
          isAvailable: product.status === 'active' && (product.stock || 100) > reservedStock,
          lowStockThreshold: product.lowStockThreshold || 10,
          isLowStock: (product.stock || 100) - reservedStock <= (product.lowStockThreshold || 10)
        };

        stocks.push(stockLevel);

      } catch (productError) {
        console.error(`Error processing product ${productId}:`, productError);
        // Continue with other products
      }
    }

    res.status(200).json({
      success: true,
      data: { stocks },
      message: 'Batch stock levels retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching batch stock levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock levels',
      data: null
    });
  }
});

/**
 * Create temporary inventory reservation
 */
router.post('/reserve', async (req, res) => {
  try {
    const { reservationId, items, expiry } = req.body;

    if (!reservationId || !items || !Array.isArray(items) || !expiry) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID, items array, and expiry are required',
        data: null
      });
    }

    const expiryDate = new Date(expiry);
    if (expiryDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be in the future',
        data: null
      });
    }

    // Validate that all items are available
    const now = new Date();
    for (const item of items) {
      const product = await Product.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(item.id) ? item.id : null },
          { sku: item.id }
        ]
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.id} not found`,
          data: null
        });
      }

      // Calculate current reserved stock
      let reservedStock = 0;
      for (const [existingReservationId, reservation] of reservations.entries()) {
        if (reservation.expiry > now && existingReservationId !== reservationId) {
          const reservedItem = reservation.items.find(existingItem => 
            existingItem.id === item.id || existingItem.id === product._id.toString()
          );
          if (reservedItem) {
            reservedStock += reservedItem.quantity;
          }
        }
      }

      const availableStock = Math.max(0, (product.stock || 100) - reservedStock);
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
          data: null
        });
      }
    }

    // Create the reservation
    reservations.set(reservationId, {
      items,
      expiry: expiryDate,
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: {
        reservationId,
        items,
        expiry: expiryDate.toISOString()
      },
      message: 'Inventory reservation created successfully'
    });

  } catch (error) {
    console.error('Error creating inventory reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory reservation',
      data: null
    });
  }
});

/**
 * Release inventory reservation
 */
router.delete('/reserve/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;

    if (reservations.has(reservationId)) {
      reservations.delete(reservationId);
      res.status(200).json({
        success: true,
        message: 'Reservation released successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Reservation not found or already expired'
      });
    }

  } catch (error) {
    console.error('Error releasing reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release reservation',
      data: null
    });
  }
});

/**
 * Confirm reservation (convert to permanent allocation)
 */
router.post('/confirm-reservation', async (req, res) => {
  try {
    const { reservationId, orderId } = req.body;

    if (!reservationId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID and Order ID are required',
        data: null
      });
    }

    const reservation = reservations.get(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or expired',
        data: null
      });
    }

    if (reservation.expiry <= new Date()) {
      reservations.delete(reservationId);
      return res.status(400).json({
        success: false,
        message: 'Reservation has expired',
        data: null
      });
    }

    // In a real implementation, this would permanently allocate the inventory
    // For now, we'll just remove the reservation since the order will handle inventory
    reservations.delete(reservationId);

    res.status(200).json({
      success: true,
      data: {
        reservationId,
        orderId,
        confirmedAt: new Date().toISOString()
      },
      message: 'Reservation confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm reservation',
      data: null
    });
  }
});

/**
 * Get reservation details
 */
router.get('/reserve/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = reservations.get(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
        data: null
      });
    }

    if (reservation.expiry <= new Date()) {
      reservations.delete(reservationId);
      return res.status(404).json({
        success: false,
        message: 'Reservation has expired',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: {
        reservationId,
        ...reservation,
        timeRemaining: Math.max(0, reservation.expiry.getTime() - Date.now())
      },
      message: 'Reservation details retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching reservation details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservation details',
      data: null
    });
  }
});

/**
 * Get inventory statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Count active reservations
    const now = new Date();
    let activeReservations = 0;
    let totalReservedItems = 0;

    for (const [reservationId, reservation] of reservations.entries()) {
      if (reservation.expiry > now) {
        activeReservations++;
        totalReservedItems += reservation.items.reduce((sum, item) => sum + item.quantity, 0);
      } else {
        reservations.delete(reservationId);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        activeReservations,
        totalReservedItems,
        lastUpdated: new Date().toISOString()
      },
      message: 'Inventory statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory statistics',
      data: null
    });
  }
});

module.exports = router;
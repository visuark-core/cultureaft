const InventoryService = require('../services/inventoryService');

/**
 * Middleware to verify inventory availability before cart operations
 */
const verifyInventoryAvailability = async (req, res, next) => {
  try {
    const { items } = req.body;

    // Skip verification if no items provided
    if (!items || !Array.isArray(items) || items.length === 0) {
      return next();
    }

    const unavailableItems = [];

    // Check availability for each item
    for (const item of items) {
      try {
        const availability = await InventoryService.verifyAvailability(item.productId, item.quantity);
        
        if (!availability.available) {
          unavailableItems.push({
            productId: item.productId,
            requestedQuantity: item.quantity,
            availableQuantity: availability.currentStock,
            message: availability.message
          });
        }
      } catch (error) {
        const errorResponse = InventoryService.handleInventoryError(error, { productId: item.productId });
        unavailableItems.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity: 0,
          message: errorResponse.userMessage
        });
      }
    }

    // If any items are unavailable, return error
    if (unavailableItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${unavailableItems.length} item(s) are not available in the requested quantities`,
        unavailableItems,
        errorCode: 'INVENTORY_UNAVAILABLE'
      });
    }

    // Add inventory status to request for downstream use
    req.inventoryVerified = true;
    next();

  } catch (error) {
    console.error('Inventory verification middleware error:', error);
    const errorResponse = InventoryService.handleInventoryError(error);
    return res.status(500).json({
      success: false,
      message: errorResponse.userMessage,
      errorCode: errorResponse.errorCode
    });
  }
};

/**
 * Middleware to automatically release reservations on request timeout/error
 */
const autoReleaseReservation = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  // Override response methods to cleanup reservations on error responses
  res.send = function(data) {
    if (res.statusCode >= 400 && req.sessionId) {
      // Async cleanup - don't wait for it
      InventoryService.releaseReservation(req.sessionId)
        .then(result => console.log('Auto-released reservation:', result.message))
        .catch(err => console.error('Failed to auto-release reservation:', err));
    }
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    if (res.statusCode >= 400 && req.sessionId) {
      // Async cleanup - don't wait for it
      InventoryService.releaseReservation(req.sessionId)
        .then(result => console.log('Auto-released reservation:', result.message))
        .catch(err => console.error('Failed to auto-release reservation:', err));
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to add inventory status indicators to responses
 */
const addInventoryStatus = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Add inventory metadata to successful responses
    if (res.statusCode < 400 && data && typeof data === 'object') {
      data.inventoryStatus = {
        verified: req.inventoryVerified || false,
        timestamp: new Date().toISOString(),
        reservationActive: !!req.sessionId
      };
    }
    return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  verifyInventoryAvailability,
  autoReleaseReservation,
  addInventoryStatus
};
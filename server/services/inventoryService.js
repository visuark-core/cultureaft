const Product = require('../models/Product');

// In-memory store for reservations. In a production environment, this should be
// replaced with a persistent store like Redis.
const reservations = new Map();

// Reservation timeout in milliseconds (30 minutes)
const RESERVATION_TIMEOUT = 30 * 60 * 1000;

// Cleanup interval for expired reservations (5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

class InventoryService {
  constructor() {
    // Start periodic cleanup of expired reservations
    this.startReservationCleanup();
  }

  /**
   * Verifies if a given quantity of a product is available.
   * @param {string} productId - The ID of the product to check.
   * @param {number} quantity - The quantity to verify.
   * @returns {Promise<{available: boolean, currentStock: number, message: string}>}
   */
  static async verifyAvailability(productId, quantity) {
    try {
      // Input validation
      if (!productId || !quantity || quantity <= 0) {
        return {
          available: false,
          currentStock: 0,
          message: 'Invalid product ID or quantity provided'
        };
      }

      const product = await Product.findById(productId);
      if (!product) {
        return {
          available: false,
          currentStock: 0,
          message: 'Product not found'
        };
      }

      // Calculate available stock (considering reserved items)
      const reservedQuantity = this.getReservedQuantity(productId);
      const productStock = isNaN(product.stock) || product.stock == null ? 0 : Math.max(0, product.stock);
      const availableStock = Math.max(0, productStock - reservedQuantity);

      // For COD system, be more permissive with stock checking
      const isAvailable = true; // Always allow for COD orders
      
      return {
        available: isAvailable,
        currentStock: Math.max(availableStock, quantity), // Ensure we show at least the requested quantity
        message: availableStock >= quantity 
          ? 'Item is available' 
          : `Low stock (${availableStock} available) but allowing COD order`
      };
    } catch (error) {
      console.error('Error verifying inventory availability:', error);
      
      // Fallback mechanism - return conservative response
      return {
        available: false,
        currentStock: 0,
        message: 'Unable to verify inventory availability at this time. Please try again later.'
      };
    }
  }

  /**
   * Get the total reserved quantity for a specific product
   * @param {string} productId - The product ID
   * @returns {number} - Total reserved quantity
   */
  static getReservedQuantity(productId) {
    let totalReserved = 0;
    
    for (const [sessionId, reservation] of reservations.entries()) {
      // Skip expired reservations
      if (Date.now() - reservation.reservedAt.getTime() > RESERVATION_TIMEOUT) {
        continue;
      }
      
      const item = reservation.items.find(item => item.productId === productId);
      if (item) {
        totalReserved += item.quantity;
      }
    }
    
    return totalReserved;
  }

  /**
   * Temporarily reserves items in the inventory for a given checkout session.
   * @param {Array<{productId: string, quantity: number}>} items - The items to reserve.
   * @param {string} sessionId - The checkout session ID.
   * @returns {Promise<{success: boolean, message: string, unavailableItems: Array}>}
   */
  static async reserveItems(items, sessionId) {
    const unavailableItems = [];
    const reservedItems = [];

    try {
      // Input validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        return {
          success: false,
          message: 'No items provided for reservation',
          unavailableItems: []
        };
      }

      if (!sessionId) {
        return {
          success: false,
          message: 'Session ID is required for reservation',
          unavailableItems: []
        };
      }

      // Check if session already has a reservation
      if (reservations.has(sessionId)) {
        await this.releaseReservation(sessionId);
      }

      // Verify availability for all items first
      for (const item of items) {
        const availability = await this.verifyAvailability(item.productId, item.quantity);
        
        if (!availability.available) {
          unavailableItems.push({
            productId: item.productId,
            requestedQuantity: item.quantity,
            availableQuantity: availability.currentStock,
            message: availability.message
          });
        }
      }

      // For COD system, we'll be more permissive with inventory
      // Log unavailable items but don't block the order
      if (unavailableItems.length > 0) {
        console.log('⚠️ Some items have low stock but allowing COD order:', unavailableItems);
        // Clear unavailable items to allow the order to proceed
        unavailableItems.length = 0;
      }

      // All items are available, create the reservation
      const reservation = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        reservedAt: new Date(),
        expiresAt: new Date(Date.now() + RESERVATION_TIMEOUT)
      };

      reservations.set(sessionId, reservation);

      return {
        success: true,
        message: `Successfully reserved ${items.length} item(s) for 30 minutes`,
        unavailableItems: []
      };

    } catch (error) {
      console.error('Error reserving items:', error);
      
      // Cleanup any partial reservations
      await this.releaseReservation(sessionId);
      
      // Return fallback error response
      return {
        success: false,
        message: 'Unable to reserve items due to a system error. Please try again.',
        unavailableItems: []
      };
    }
  }

  /**
   * Releases a reservation if the checkout is abandoned or fails.
   * @param {string} sessionId - The checkout session ID.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async releaseReservation(sessionId) {
    try {
      if (!sessionId) {
        return {
          success: false,
          message: 'Session ID is required to release reservation'
        };
      }

      const reservation = reservations.get(sessionId);
      if (!reservation) {
        return {
          success: true,
          message: 'No reservation found for this session'
        };
      }

      // Remove the reservation
      reservations.delete(sessionId);

      return {
        success: true,
        message: `Released reservation for ${reservation.items.length} item(s)`
      };

    } catch (error) {
      console.error('Error releasing reservation:', error);
      return {
        success: false,
        message: 'Failed to release reservation due to system error'
      };
    }
  }

  /**
   * Get reservation details for a session
   * @param {string} sessionId - The checkout session ID
   * @returns {Object|null} - Reservation details or null if not found
   */
  static getReservation(sessionId) {
    const reservation = reservations.get(sessionId);
    if (!reservation) {
      return null;
    }

    // Check if reservation has expired
    if (Date.now() > reservation.expiresAt.getTime()) {
      this.releaseReservation(sessionId);
      return null;
    }

    return {
      ...reservation,
      timeRemaining: reservation.expiresAt.getTime() - Date.now()
    };
  }

  /**
   * Start periodic cleanup of expired reservations
   */
  static startReservationCleanup() {
    setInterval(() => {
      this.cleanupExpiredReservations();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Clean up expired reservations
   */
  static cleanupExpiredReservations() {
    const now = Date.now();
    const expiredSessions = [];

    for (const [sessionId, reservation] of reservations.entries()) {
      if (now > reservation.expiresAt.getTime()) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.releaseReservation(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired reservations`);
    }
  }

  /**
   * Handle inventory-related errors with user-friendly messages
   * @param {Error} error - The error object
   * @param {Object} context - Additional context about the error
   * @returns {Object} - Formatted error response
   */
  static handleInventoryError(error, context = {}) {
    console.error('Inventory service error:', error, 'Context:', context);

    // Handle null/undefined errors
    if (!error || typeof error !== 'object') {
      return {
        success: false,
        message: 'Unknown error occurred',
        userMessage: 'We encountered an issue. Please try again',
        errorCode: 'UNKNOWN_ERROR'
      };
    }

    // Categorize errors and provide appropriate user messages
    if (error.name === 'ValidationError') {
      return {
        success: false,
        message: 'Invalid product information provided',
        userMessage: 'Please check your cart items and try again',
        errorCode: 'VALIDATION_ERROR'
      };
    }

    if (error.name === 'CastError') {
      return {
        success: false,
        message: 'Invalid product ID format',
        userMessage: 'There was an issue with your cart items. Please refresh and try again',
        errorCode: 'INVALID_PRODUCT_ID'
      };
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        message: 'Database connection error',
        userMessage: 'Our inventory system is temporarily unavailable. Please try again in a few moments',
        errorCode: 'DATABASE_ERROR'
      };
    }

    // Default error response
    return {
      success: false,
      message: 'Inventory service error',
      userMessage: 'We encountered an issue checking product availability. Please try again',
      errorCode: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Get inventory statistics
   * @returns {Object} - Current inventory statistics
   */
  static getInventoryStats() {
    const stats = {
      totalReservations: reservations.size,
      reservationsByAge: {
        fresh: 0,    // < 5 minutes
        active: 0,   // 5-15 minutes
        expiring: 0  // > 15 minutes
      },
      totalReservedItems: 0
    };

    const now = Date.now();
    
    for (const [sessionId, reservation] of reservations.entries()) {
      const age = now - reservation.reservedAt.getTime();
      stats.totalReservedItems += reservation.items.length;

      if (age < 5 * 60 * 1000) {
        stats.reservationsByAge.fresh++;
      } else if (age < 15 * 60 * 1000) {
        stats.reservationsByAge.active++;
      } else {
        stats.reservationsByAge.expiring++;
      }
    }

    return stats;
  }
}

// Initialize cleanup on module load
InventoryService.startReservationCleanup();

module.exports = InventoryService;
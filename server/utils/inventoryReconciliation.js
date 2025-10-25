const Product = require('../models/Product');
const Order = require('../models/Order');
const InventoryService = require('../services/inventoryService');

/**
 * Inventory reconciliation utilities
 */
class InventoryReconciliation {
  /**
   * Reconcile product stock with actual orders
   * @param {string} productId - Product ID to reconcile
   * @returns {Promise<Object>} - Reconciliation result
   */
  static async reconcileProductStock(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return {
          success: false,
          message: 'Product not found',
          productId
        };
      }

      // Get all confirmed orders for this product
      const confirmedOrders = await Order.find({
        'items.productId': productId,
        status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
      });

      // Calculate total sold quantity
      let totalSold = 0;
      for (const order of confirmedOrders) {
        const orderItem = order.items.find(item => item.productId.toString() === productId);
        if (orderItem) {
          totalSold += orderItem.quantity;
        }
      }

      // Get reserved quantity
      const reservedQuantity = InventoryService.getReservedQuantity(productId);

      return {
        success: true,
        productId,
        productName: product.name,
        currentStock: product.stock,
        totalSold,
        reservedQuantity,
        availableStock: Math.max(0, product.stock - reservedQuantity),
        reconciliationDate: new Date()
      };

    } catch (error) {
      console.error('Error reconciling product stock:', error);
      return {
        success: false,
        message: 'Failed to reconcile product stock',
        error: error.message,
        productId
      };
    }
  }

  /**
   * Reconcile all products inventory
   * @param {Object} options - Reconciliation options
   * @returns {Promise<Object>} - Reconciliation results
   */
  static async reconcileAllProducts(options = {}) {
    try {
      const { limit = 100, category = null } = options;
      
      let query = {};
      if (category) {
        query.category = category;
      }

      const products = await Product.find(query, null, { limit });
      const results = [];
      const errors = [];

      for (const product of products) {
        const result = await this.reconcileProductStock(product._id);
        if (result.success) {
          results.push(result);
        } else {
          errors.push(result);
        }
      }

      return {
        success: true,
        totalProducts: products.length,
        successfulReconciliations: results.length,
        errors: errors.length,
        results,
        errors: errors.slice(0, 10), // Limit error details
        reconciliationDate: new Date()
      };

    } catch (error) {
      console.error('Error reconciling all products:', error);
      return {
        success: false,
        message: 'Failed to reconcile inventory',
        error: error.message
      };
    }
  }

  /**
   * Find products with stock discrepancies
   * @param {number} threshold - Minimum discrepancy to report
   * @returns {Promise<Array>} - Products with discrepancies
   */
  static async findStockDiscrepancies(threshold = 5) {
    try {
      const products = await Product.find({ stock: { $gte: 0 } });
      const discrepancies = [];

      for (const product of products) {
        const reconciliation = await this.reconcileProductStock(product._id);
        
        if (reconciliation.success) {
          const expectedStock = reconciliation.currentStock - reconciliation.totalSold;
          const actualStock = reconciliation.availableStock;
          const discrepancy = Math.abs(expectedStock - actualStock);

          if (discrepancy >= threshold) {
            discrepancies.push({
              productId: product._id,
              productName: product.name,
              currentStock: reconciliation.currentStock,
              expectedStock,
              actualStock,
              discrepancy,
              reservedQuantity: reconciliation.reservedQuantity
            });
          }
        }
      }

      return discrepancies;

    } catch (error) {
      console.error('Error finding stock discrepancies:', error);
      throw error;
    }
  }

  /**
   * Generate inventory report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} - Inventory report
   */
  static async generateInventoryReport(options = {}) {
    try {
      const { includeDiscrepancies = true, category = null } = options;
      
      const reconciliation = await this.reconcileAllProducts({ category });
      let discrepancies = [];
      
      if (includeDiscrepancies) {
        discrepancies = await this.findStockDiscrepancies();
      }

      const inventoryStats = InventoryService.getInventoryStats();

      return {
        success: true,
        report: {
          summary: {
            totalProducts: reconciliation.totalProducts,
            successfulReconciliations: reconciliation.successfulReconciliations,
            errors: reconciliation.errors,
            discrepanciesFound: discrepancies.length
          },
          reservations: inventoryStats,
          discrepancies: discrepancies ? discrepancies.slice(0, 20) : [], // Limit to top 20
          reconciliation: reconciliation.results ? reconciliation.results.slice(0, 50) : [], // Limit to 50 products
          generatedAt: new Date()
        }
      };

    } catch (error) {
      console.error('Error generating inventory report:', error);
      return {
        success: false,
        message: 'Failed to generate inventory report',
        error: error.message
      };
    }
  }

  /**
   * Cleanup abandoned orders and release their reservations
   * @param {number} hoursOld - Orders older than this many hours
   * @returns {Promise<Object>} - Cleanup result
   */
  static async cleanupAbandonedOrders(hoursOld = 24) {
    try {
      const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
      
      // Find orders that are still pending and old
      const abandonedOrders = await Order.find({
        status: 'pending',
        'inventory.reserved': true,
        createdAt: { $lt: cutoffDate }
      });

      const cleanupResults = [];

      for (const order of abandonedOrders) {
        try {
          // Release inventory reservation
          order.inventory.reserved = false;
          order.inventory.releasedAt = new Date();
          order.status = 'cancelled';
          order.timeline.push({
            status: 'cancelled',
            timestamp: new Date(),
            notes: 'Order cancelled due to abandonment - inventory released',
            automated: true
          });

          await order.save();

          cleanupResults.push({
            orderId: order.orderId,
            customerId: order.customerId,
            itemCount: order.items.length,
            status: 'cleaned'
          });

        } catch (error) {
          cleanupResults.push({
            orderId: order.orderId,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        success: true,
        totalAbandonedOrders: abandonedOrders.length,
        cleanedOrders: cleanupResults.filter(r => r.status === 'cleaned').length,
        errors: cleanupResults.filter(r => r.status === 'error').length,
        results: cleanupResults,
        cleanupDate: new Date()
      };

    } catch (error) {
      console.error('Error cleaning up abandoned orders:', error);
      return {
        success: false,
        message: 'Failed to cleanup abandoned orders',
        error: error.message
      };
    }
  }
}

module.exports = InventoryReconciliation;
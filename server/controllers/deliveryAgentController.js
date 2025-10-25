const deliveryAgentService = require('../services/deliveryAgentService');
const { validationResult } = require('express-validator');

const deliveryAgentController = {
  /**
   * Get delivery agents with filtering and pagination.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async getDeliveryAgents(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const filters = {
        status: req.query.status,
        isAvailable: req.query.isAvailable,
        assignedZone: req.query.assignedZone
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        search: req.query.search || ''
      };

      const result = await deliveryAgentService.getDeliveryAgents(filters, options);
      res.json({ success: true, message: 'Delivery agents retrieved successfully', data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve delivery agents' });
    }
  },

  /**
   * Get delivery agent statistics.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async getDeliveryAgentStatistics(req, res) {
    try {
      const statistics = await deliveryAgentService.getDeliveryAgentStatistics();
      res.json({ success: true, message: 'Delivery agent statistics retrieved successfully', data: statistics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve delivery agent statistics' });
    }
  },

  /**
   * Get a single delivery agent by ID.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async getDeliveryAgentById(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const agent = await deliveryAgentService.getDeliveryAgentById(req.params.id);
      res.json({ success: true, message: 'Delivery agent retrieved successfully', data: agent });
    } catch (error) {
      const statusCode = error.message === 'Delivery agent not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to retrieve delivery agent' });
    }
  },

  /**
   * Create a new delivery agent.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async createDeliveryAgent(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const agent = await deliveryAgentService.createDeliveryAgent(req.body, req.admin.id);
      res.status(201).json({ success: true, message: 'Delivery agent created successfully', data: agent });
    } catch (error) {
      const statusCode = error.message.includes('duplicate key') ? 409 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to create delivery agent' });
    }
  },

  /**
   * Update an existing delivery agent.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async updateDeliveryAgent(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const agent = await deliveryAgentService.updateDeliveryAgent(req.params.id, req.body, req.admin.id);
      res.json({ success: true, message: 'Delivery agent updated successfully', data: agent });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Delivery agent not found') statusCode = 404;
      if (error.message.includes('duplicate key')) statusCode = 409;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to update delivery agent' });
    }
  },

  /**
   * Soft delete (deactivate) a delivery agent.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async deleteDeliveryAgent(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const agent = await deliveryAgentService.deleteDeliveryAgent(req.params.id, req.admin.id);
      res.json({ success: true, message: 'Delivery agent deactivated successfully', data: agent });
    } catch (error) {
      const statusCode = error.message === 'Delivery agent not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to delete delivery agent' });
    }
  },

  /**
   * Assign an order to a delivery agent.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async assignOrderToAgent(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { orderId } = req.body;
      const agent = await deliveryAgentService.assignOrderToAgent(req.params.id, orderId, req.admin.id);
      res.json({ success: true, message: 'Order assigned to delivery agent successfully', data: agent });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to assign order to delivery agent' });
    }
  },

  /**
   * Update delivery agent's current location.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async updateAgentLocation(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { latitude, longitude, accuracy } = req.body;
      const agent = await deliveryAgentService.updateAgentLocation(req.params.id, latitude, longitude, accuracy);
      res.json({ success: true, message: 'Delivery agent location updated successfully', data: agent });
    } catch (error) {
      const statusCode = error.message === 'Delivery agent not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to update delivery agent location' });
    }
  },

  /**
   * Record a delivery attempt for an order.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async recordDeliveryAttempt(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { orderId, ...attemptData } = req.body;
      const order = await deliveryAgentService.recordDeliveryAttempt(orderId, attemptData, req.admin.id);
      res.json({ success: true, message: 'Delivery attempt recorded successfully', data: order });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to record delivery attempt' });
    }
  },

  /**
   * Upload delivery proof for an order.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async uploadDeliveryProof(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { orderId, ...proofData } = req.body;
      const order = await deliveryAgentService.uploadDeliveryProof(orderId, proofData, req.admin.id);
      res.json({ success: true, message: 'Delivery proof uploaded successfully', data: order });
    } catch (error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to upload delivery proof' });
    }
  },

  /**
   * Get delivery analytics.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async getDeliveryAnalytics(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { startDate, endDate } = req.query;
      const analytics = await deliveryAgentService.getDeliveryAnalytics(new Date(startDate), new Date(endDate));
      res.json({ success: true, message: 'Delivery analytics retrieved successfully', data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve delivery analytics' });
    }
  },

  /**
   * Get available agents for assignment.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async getAvailableAgents(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { pincode, priority } = req.query;
      const agents = await deliveryAgentService.getAvailableAgentsForAssignment(pincode, parseInt(priority) || 1);
      res.json({ success: true, message: 'Available agents retrieved successfully', data: agents });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve available agents' });
    }
  },

  /**
   * Auto-assign orders to best available agents.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async autoAssignOrders(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { orderIds } = req.body;
      const results = await deliveryAgentService.autoAssignOrders(orderIds);
      res.json({ success: true, message: 'Auto-assignment completed', data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to auto-assign orders' });
    }
  },

  /**
   * Handle failed delivery with retry logic.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async handleFailedDelivery(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { orderId, reason, autoReschedule } = req.body;
      const result = await deliveryAgentService.handleFailedDelivery(orderId, reason, autoReschedule);
      res.json({ success: true, message: 'Failed delivery handled successfully', data: result });
    } catch (error) {
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to handle failed delivery' });
    }
  },

  /**
   * Get real-time delivery tracking information.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  async getDeliveryTracking(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const { orderId } = req.params;
      const trackingData = await deliveryAgentService.getDeliveryTracking(orderId);
      res.json({ success: true, message: 'Delivery tracking retrieved successfully', data: trackingData });
    } catch (error) {
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message || 'Failed to retrieve delivery tracking' });
    }
  }
};

module.exports = deliveryAgentController;
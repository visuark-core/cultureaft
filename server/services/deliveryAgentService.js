const DeliveryAgent = require('../models/DeliveryAgent');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

const deliveryAgentService = {
  /**
   * Get delivery agents with filtering, pagination, and sorting.
   * @param {Object} filters - Filters to apply (status, isAvailable, assignedZone).
   * @param {Object} options - Pagination and sorting options (page, limit, sortBy, sortOrder, search).
   * @returns {Object} - Paginated list of delivery agents and total count.
   */
  async getDeliveryAgents(filters, options) {
    const { page, limit, sortBy, sortOrder, search } = options;
    const skip = (page - 1) * limit;

    const query = {};

    if (filters.status && filters.status !== 'all') {
      query['employment.status'] = filters.status;
    }
    if (filters.isAvailable !== undefined) {
      query['availability.isAvailable'] = filters.isAvailable;
    }
    if (filters.assignedZone) {
      query['location.assignedZones.name'] = filters.assignedZone;
    }

    if (search) {
      query.$or = [
        { 'profile.name': { $regex: search, $options: 'i' } },
        { 'profile.employeeId': { $regex: search, $options: 'i' } },
        { 'profile.email': { $regex: search, $options: 'i' } },
        { 'profile.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    if (sortBy && sortOrder) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort['createdAt'] = -1; // Default sort
    }

    const deliveryAgents = await DeliveryAgent.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalCount = await DeliveryAgent.countDocuments(query);

    return {
      deliveryAgents,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  },

  /**
   * Get delivery agent statistics.
   * @returns {Object} - Various statistics about delivery agents.
   */
  async getDeliveryAgentStatistics() {
    const totalAgents = await DeliveryAgent.countDocuments();
    const activeAgents = await DeliveryAgent.countDocuments({ 'employment.status': 'active' });
    const availableAgents = await DeliveryAgent.countDocuments({ 'availability.isAvailable': true });
    const suspendedAgents = await DeliveryAgent.countDocuments({ 'employment.status': 'suspended' });

    const performanceStats = await DeliveryAgent.aggregate([
      {
        $match: {
          'employment.status': 'active'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$performance.customerRating' },
          averageDeliveries: { $avg: '$performance.totalDeliveries' },
          totalDeliveries: { $sum: '$performance.totalDeliveries' },
          successfulDeliveries: { $sum: '$performance.successfulDeliveries' },
          averageSuccessRate: { $avg: '$performance.deliverySuccessRate' }
        }
      }
    ]);

    const topPerformers = await DeliveryAgent.getTopPerformers(5);

    return {
      totalAgents,
      activeAgents,
      availableAgents,
      suspendedAgents,
      performance: performanceStats.length > 0 ? performanceStats : {},
      topPerformers
    };
  },

  /**
   * Get a single delivery agent by ID.
   * @param {string} agentId - The ID of the delivery agent.
   * @returns {DeliveryAgent} - The delivery agent object.
   */
  async getDeliveryAgentById(agentId) {
    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      throw new Error('Delivery agent not found');
    }
    return agent;
  },

  /**
   * Create a new delivery agent.
   * @param {Object} agentData - Data for the new delivery agent.
   * @param {string} adminId - The ID of the admin performing the action.
   * @returns {DeliveryAgent} - The newly created delivery agent.
   */
  async createDeliveryAgent(agentData, adminId) {
    const newAgent = new DeliveryAgent(agentData);
    await newAgent.save();

    await AuditLog.create({
      admin: adminId,
      action: 'CREATE_DELIVERY_AGENT',
      target: newAgent._id,
      targetModel: 'DeliveryAgent',
      description: `Created new delivery agent: ${newAgent.profile.name}`
    });

    return newAgent;
  },

  /**
   * Update an existing delivery agent.
   * @param {string} agentId - The ID of the delivery agent to update.
   * @param {Object} updateData - Data to update the delivery agent with.
   * @param {string} adminId - The ID of the admin performing the action.
   * @returns {DeliveryAgent} - The updated delivery agent.
   */
  async updateDeliveryAgent(agentId, updateData, adminId) {
    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      throw new Error('Delivery agent not found');
    }

    Object.assign(agent, updateData);
    await agent.save();

    await AuditLog.create({
      admin: adminId,
      action: 'UPDATE_DELIVERY_AGENT',
      target: agent._id,
      targetModel: 'DeliveryAgent',
      description: `Updated delivery agent: ${agent.profile.name}`
    });

    return agent;
  },

  /**
   * Soft delete (deactivate) a delivery agent.
   * @param {string} agentId - The ID of the delivery agent to delete.
   * @param {string} adminId - The ID of the admin performing the action.
   * @returns {DeliveryAgent} - The deactivated delivery agent.
   */
  async deleteDeliveryAgent(agentId, adminId) {
    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      throw new Error('Delivery agent not found');
    }

    agent.employment.status = 'inactive';
    agent.availability.isAvailable = false;
    await agent.save();

    await AuditLog.create({
      admin: adminId,
      action: 'DEACTIVATE_DELIVERY_AGENT',
      target: agent._id,
      targetModel: 'DeliveryAgent',
      description: `Deactivated delivery agent: ${agent.profile.name}`
    });

    return agent;
  },

  /**
   * Assign an order to a delivery agent.
   * @param {string} agentId - The ID of the delivery agent.
   * @param {string} orderId - The ID of the order to assign.
   * @param {string} adminId - The ID of the admin performing the action.
   * @returns {DeliveryAgent} - The updated delivery agent.
   */
  async assignOrderToAgent(agentId, orderId, adminId) {
    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      throw new Error('Delivery agent not found');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (agent.availability.currentOrders.length >= agent.availability.maxOrders) {
      throw new Error('Delivery agent has reached maximum order capacity');
    }

    // Assign order to agent
    await agent.assignOrder(orderId);

    // Update order with assigned agent and status
    order.delivery.assignedAgent = agentId;
    order.delivery.deliveryStatus = 'assigned';
    order.status = 'assigned'; // Update main order status
    await order.save();

    await AuditLog.create({
      admin: adminId,
      action: 'ASSIGN_ORDER_TO_AGENT',
      target: agent._id,
      targetModel: 'DeliveryAgent',
      description: `Assigned order ${orderId} to delivery agent ${agent.profile.name}`
    });

    return agent;
  },

  /**
   * Update a delivery agent's current location.
   * @param {string} agentId - The ID of the delivery agent.
   * @param {number} latitude - The current latitude.
   * @param {number} longitude - The current longitude.
   * @param {number} [accuracy] - The accuracy of the location.
   * @returns {DeliveryAgent} - The updated delivery agent.
   */
  async updateAgentLocation(agentId, latitude, longitude, accuracy) {
    const agent = await DeliveryAgent.findById(agentId);
    if (!agent) {
      throw new Error('Delivery agent not found');
    }

    await agent.updateLocation(latitude, longitude, accuracy);

    // Optionally, update the location of the currently assigned order if it's out for delivery
    if (agent.availability.currentOrders && agent.availability.currentOrders.length > 0) {
      for (const orderId of agent.availability.currentOrders) {
        const order = await Order.findById(orderId);
        if (order && order.delivery.deliveryStatus === 'out_for_delivery') {
          order.delivery.currentLocation = { latitude, longitude, timestamp: new Date() };
          await order.save();
          // Emit real-time update for this order
          // WebSocketService.emitOrderUpdate(orderId, { currentLocation: order.delivery.currentLocation });
        }
      }
    }

    return agent;
  },

  /**
   * Record a delivery attempt for an order.
   * @param {string} orderId - The ID of the order.
   * @param {Object} attemptData - Data for the delivery attempt (status, reason, notes, etc.).
   * @param {string} deliveryAgentId - The ID of the delivery agent.
   * @returns {Order} - The updated order.
   */
  async recordDeliveryAttempt(orderId, attemptData, deliveryAgentId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const agent = await DeliveryAgent.findById(deliveryAgentId);
    if (!agent) {
      throw new Error('Delivery agent not found');
    }

    attemptData.deliveryAgent = deliveryAgentId;
    await order.addDeliveryAttempt(attemptData);

    if (attemptData.status === 'successful') {
      // Calculate delivery time in minutes
      const deliveryTime = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60));
      await agent.completeOrder(orderId, deliveryTime);
      
      // Update order status to delivered
      order.status = 'delivered';
      order.delivery.deliveryStatus = 'delivered';
      order.delivery.actualDeliveryTime = new Date();
      order.shipping.actualDelivery = new Date();
      await order.save();
      
    } else if (attemptData.status === 'failed') {
      await agent.failOrder(orderId, attemptData.reason);
      
      // Handle failed delivery - implement rescheduling logic
      order.delivery.deliveryStatus = 'failed';
      
      // Auto-reschedule if this is not the final attempt (max 3 attempts)
      const attemptCount = order.delivery.attempts.length;
      if (attemptCount < 3 && attemptData.nextAttemptDate) {
        order.delivery.deliveryStatus = 'rescheduled';
        order.delivery.estimatedDeliveryTime = new Date(attemptData.nextAttemptDate);
        
        // Add timeline event for rescheduling
        order.timeline.push({
          status: 'rescheduled',
          timestamp: new Date(),
          updatedBy: deliveryAgentId,
          notes: `Delivery rescheduled due to: ${attemptData.reason}`,
          automated: false
        });
      } else if (attemptCount >= 3) {
        // Mark as permanently failed after 3 attempts
        order.status = 'delivery_failed';
        order.delivery.deliveryStatus = 'permanently_failed';
        
        // Remove from agent's current orders
        if (agent.availability.currentOrders.includes(orderId)) {
          agent.availability.currentOrders = agent.availability.currentOrders.filter(
            id => !id.equals(orderId)
          );
          agent.availability.isAvailable = agent.availability.currentOrders.length < agent.availability.maxOrders;
          await agent.save();
        }
      }
      
      await order.save();
      
    } else if (attemptData.status === 'rescheduled') {
      order.delivery.deliveryStatus = 'rescheduled';
      if (attemptData.nextAttemptDate) {
        order.delivery.estimatedDeliveryTime = new Date(attemptData.nextAttemptDate);
      }
      await order.save();
    }

    await AuditLog.create({
      admin: deliveryAgentId,
      action: 'RECORD_DELIVERY_ATTEMPT',
      target: order._id,
      targetModel: 'Order',
      description: `Recorded delivery attempt for order ${order.orderNumber} by agent ${agent.profile.name}. Status: ${attemptData.status}`
    });

    return order;
  },

  /**
   * Upload delivery proof for an order.
   * @param {string} orderId - The ID of the order.
   * @param {Object} proofData - Data for the delivery proof (type, data, location, verifiedBy).
   * @param {string} deliveryAgentId - The ID of the delivery agent.
   * @returns {Order} - The updated order.
   */
  async uploadDeliveryProof(orderId, proofData, deliveryAgentId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.delivery.proof = proofData;
    order.delivery.deliveryStatus = 'delivered';
    order.status = 'delivered';
    order.shipping.actualDelivery = new Date();
    order.delivery.actualDeliveryTime = new Date();
    await order.save();

    await AuditLog.create({
      admin: deliveryAgentId,
      action: 'UPLOAD_DELIVERY_PROOF',
      target: order._id,
      targetModel: 'Order',
      description: `Uploaded delivery proof for order ${order.orderNumber} by agent ${deliveryAgentId}`
    });

    return order;
  },

  /**
   * Get delivery analytics.
   * @param {Date} startDate - Start date for analytics.
   * @param {Date} endDate - End date for analytics.
   * @returns {Object} - Delivery analytics data.
   */
  async getDeliveryAnalytics(startDate, endDate) {
    const agentPerformance = await DeliveryAgent.getPerformanceStats(startDate, endDate);
    const orderDeliveryStats = await Order.aggregate([
      {
        $match: {
          'delivery.actualDeliveryTime': { $gte: startDate, $lte: endDate },
          'delivery.deliveryStatus': 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveredOrders: { $sum: 1 },
          averageDeliveryTime: { $avg: { $subtract: ['$delivery.actualDeliveryTime', '$createdAt'] } } // in milliseconds
        }
      }
    ]);

    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const deliveredOrders = await Order.countDocuments({
      'delivery.deliveryStatus': 'delivered',
      'delivery.actualDeliveryTime': { $gte: startDate, $lte: endDate }
    });
    const failedOrders = await Order.countDocuments({
      'delivery.deliveryStatus': 'failed',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const deliverySuccessRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    return {
      agentPerformance: agentPerformance.length > 0 ? agentPerformance[0] : {},
      orderDeliveryStats: orderDeliveryStats.length > 0 ? orderDeliveryStats[0] : {},
      overall: {
        totalOrders,
        deliveredOrders,
        failedOrders,
        deliverySuccessRate
      }
    };
  },

  /**
   * Get available agents for order assignment based on location and capacity.
   * @param {string} pincode - Delivery pincode.
   * @param {number} priority - Order priority (1-5, 5 being highest).
   * @returns {Array} - List of available delivery agents.
   */
  async getAvailableAgentsForAssignment(pincode, priority = 1) {
    const agents = await DeliveryAgent.findAvailableAgents(pincode);
    
    // Sort by performance and availability
    return agents.sort((a, b) => {
      // Prioritize agents with higher ratings and lower current load
      const aScore = (a.performance.customerRating * 0.4) + 
                    ((a.availability.maxOrders - a.availability.currentOrders.length) / a.availability.maxOrders * 0.6);
      const bScore = (b.performance.customerRating * 0.4) + 
                    ((b.availability.maxOrders - b.availability.currentOrders.length) / b.availability.maxOrders * 0.6);
      return bScore - aScore;
    });
  },

  /**
   * Auto-assign orders to best available agents.
   * @param {Array} orderIds - Array of order IDs to assign.
   * @returns {Object} - Assignment results.
   */
  async autoAssignOrders(orderIds) {
    const results = {
      successful: [],
      failed: []
    };

    for (const orderId of orderIds) {
      try {
        const order = await Order.findById(orderId);
        if (!order || order.delivery.assignedAgent) {
          results.failed.push({ orderId, reason: 'Order not found or already assigned' });
          continue;
        }

        const availableAgents = await this.getAvailableAgentsForAssignment(
          order.shipping.address.pincode,
          order.delivery.priority === 'urgent' ? 5 : 1
        );

        if (availableAgents.length === 0) {
          results.failed.push({ orderId, reason: 'No available agents' });
          continue;
        }

        const bestAgent = availableAgents[0];
        await this.assignOrderToAgent(bestAgent._id.toString(), orderId, 'system');
        
        results.successful.push({ 
          orderId, 
          agentId: bestAgent._id, 
          agentName: bestAgent.profile.name 
        });

      } catch (error) {
        results.failed.push({ orderId, reason: error.message });
      }
    }

    return results;
  },

  /**
   * Handle failed delivery and implement retry logic.
   * @param {string} orderId - The order ID.
   * @param {string} reason - Failure reason.
   * @param {boolean} autoReschedule - Whether to auto-reschedule.
   * @returns {Object} - Updated order and next steps.
   */
  async handleFailedDelivery(orderId, reason, autoReschedule = true) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const attemptCount = order.delivery.attempts.length;
    const maxAttempts = 3;

    if (attemptCount >= maxAttempts) {
      // Mark as permanently failed
      order.status = 'delivery_failed';
      order.delivery.deliveryStatus = 'permanently_failed';
      
      // Release from agent
      if (order.delivery.assignedAgent) {
        const agent = await DeliveryAgent.findById(order.delivery.assignedAgent);
        if (agent) {
          agent.availability.currentOrders = agent.availability.currentOrders.filter(
            id => !id.equals(orderId)
          );
          agent.availability.isAvailable = agent.availability.currentOrders.length < agent.availability.maxOrders;
          await agent.save();
        }
      }

      await order.save();
      return { status: 'permanently_failed', nextAction: 'contact_customer' };
    }

    if (autoReschedule) {
      // Schedule next attempt (next business day)
      const nextAttempt = new Date();
      nextAttempt.setDate(nextAttempt.getDate() + 1);
      nextAttempt.setHours(10, 0, 0, 0); // 10 AM next day

      order.delivery.deliveryStatus = 'rescheduled';
      order.delivery.estimatedDeliveryTime = nextAttempt;
      
      await order.save();
      return { status: 'rescheduled', nextAttempt, nextAction: 'retry_delivery' };
    }

    return { status: 'failed', nextAction: 'manual_intervention' };
  },

  /**
   * Get real-time delivery tracking information.
   * @param {string} orderId - The order ID.
   * @returns {Object} - Real-time tracking data.
   */
  async getDeliveryTracking(orderId) {
    const order = await Order.findById(orderId)
      .populate('delivery.assignedAgent', 'profile location performance')
      .populate('delivery.attempts.deliveryAgent', 'profile');

    if (!order) {
      throw new Error('Order not found');
    }

    const trackingData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.delivery.deliveryStatus,
      estimatedDelivery: order.delivery.estimatedDeliveryTime,
      actualDelivery: order.delivery.actualDeliveryTime,
      currentLocation: order.delivery.currentLocation,
      assignedAgent: order.delivery.assignedAgent ? {
        name: order.delivery.assignedAgent.profile.name,
        phone: order.delivery.assignedAgent.profile.phone,
        rating: order.delivery.assignedAgent.performance.customerRating,
        currentLocation: order.delivery.assignedAgent.location.current
      } : null,
      attempts: order.delivery.attempts.map(attempt => ({
        attemptNumber: attempt.attemptNumber,
        date: attempt.attemptDate,
        status: attempt.status,
        reason: attempt.reason,
        agentName: attempt.deliveryAgent?.profile?.name
      })),
      proof: order.delivery.proof,
      timeline: order.timeline
    };

    return trackingData;
  }
};

module.exports = deliveryAgentService;
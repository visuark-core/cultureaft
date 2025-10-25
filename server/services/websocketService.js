const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const AnalyticsService = require('./analyticsService');
const { initializeRedis } = require('../config/redis');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.analyticsSubscriber = null;
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        
        // Only allow admin users to connect to analytics WebSocket
        if (decoded.role !== 'admin') {
          return next(new Error('Admin access required'));
        }

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Initialize analytics event listeners
    this.initializeAnalyticsListeners();

    console.log('WebSocket service initialized');
  }

  /**
   * Handle new WebSocket connection
   * @param {Object} socket - Socket.io socket instance
   */
  handleConnection(socket) {
    console.log(`Admin user connected: ${socket.userId}`);
    
    // Store client connection
    this.connectedClients.set(socket.id, {
      userId: socket.userId,
      userRole: socket.userRole,
      connectedAt: new Date(),
      socket: socket
    });

    // Join analytics room
    socket.join('analytics');

    // Send initial analytics data
    this.sendInitialAnalyticsData(socket);

    // Handle client events
    socket.on('subscribe:analytics', (data) => {
      this.handleAnalyticsSubscription(socket, data);
    });

    socket.on('unsubscribe:analytics', () => {
      socket.leave('analytics');
    });

    socket.on('request:analytics:refresh', async () => {
      try {
        const analyticsData = await AnalyticsService.getRealTimeAnalytics();
        socket.emit('analytics:data', analyticsData);
      } catch (error) {
        console.error('Error refreshing analytics data:', error);
        socket.emit('analytics:error', { message: 'Failed to refresh analytics data' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Admin user disconnected: ${socket.userId}, reason: ${reason}`);
      this.connectedClients.delete(socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Send initial analytics data to newly connected client
   * @param {Object} socket - Socket.io socket instance
   */
  async sendInitialAnalyticsData(socket) {
    try {
      const analyticsData = await AnalyticsService.getRealTimeAnalytics();
      socket.emit('analytics:initial', analyticsData);
    } catch (error) {
      console.error('Error sending initial analytics data:', error);
      socket.emit('analytics:error', { message: 'Failed to load initial analytics data' });
    }
  }

  /**
   * Handle analytics subscription with filters
   * @param {Object} socket - Socket.io socket instance
   * @param {Object} data - Subscription data
   */
  handleAnalyticsSubscription(socket, data) {
    const { metrics = [], refreshInterval = 30000 } = data;
    
    // Store subscription preferences
    const client = this.connectedClients.get(socket.id);
    if (client) {
      client.analyticsSubscription = {
        metrics,
        refreshInterval,
        lastUpdate: new Date()
      };
    }

    socket.join('analytics');
    console.log(`Client ${socket.userId} subscribed to analytics with metrics: ${metrics.join(', ')}`);
  }

  /**
   * Initialize analytics event listeners
   */
  initializeAnalyticsListeners() {
    // Listen for analytics updates from the service
    const analyticsEmitter = AnalyticsService.getEventEmitter();
    
    analyticsEmitter.on('analytics:update', (data) => {
      this.broadcastAnalyticsUpdate(data);
    });

    // Initialize Redis pub/sub subscriber
    this.analyticsSubscriber = AnalyticsService.initializePubSub();
    
    // Set up periodic analytics refresh
    this.startPeriodicAnalyticsRefresh();
  }

  /**
   * Broadcast analytics update to all connected clients
   * @param {Object} data - Analytics update data
   */
  broadcastAnalyticsUpdate(data) {
    if (!this.io) return;

    // Broadcast to all clients in analytics room
    this.io.to('analytics').emit('analytics:update', {
      eventType: data.eventType,
      orderData: data.orderData,
      timestamp: data.timestamp || new Date().toISOString()
    });

    console.log(`Broadcasted analytics update to ${this.connectedClients.size} clients`);
  }

  /**
   * Send real-time metrics update to specific client or all clients
   * @param {Object} metricsData - Real-time metrics data
   * @param {string} socketId - Optional specific socket ID
   */
  async sendMetricsUpdate(metricsData, socketId = null) {
    if (!this.io) return;

    try {
      const updateData = {
        ...metricsData,
        timestamp: new Date().toISOString()
      };

      if (socketId && this.connectedClients.has(socketId)) {
        const client = this.connectedClients.get(socketId);
        client.socket.emit('analytics:metrics', updateData);
      } else {
        this.io.to('analytics').emit('analytics:metrics', updateData);
      }
    } catch (error) {
      console.error('Error sending metrics update:', error);
    }
  }

  /**
   * Start periodic analytics refresh for all connected clients
   */
  startPeriodicAnalyticsRefresh() {
    setInterval(async () => {
      if (this.connectedClients.size === 0) return;

      try {
        const analyticsData = await AnalyticsService.getRealTimeAnalytics();
        this.io.to('analytics').emit('analytics:refresh', analyticsData);
      } catch (error) {
        console.error('Error in periodic analytics refresh:', error);
      }
    }, 30000); // Refresh every 30 seconds
  }

  /**
   * Send notification to all connected admin clients
   * @param {Object} notification - Notification data
   */
  sendNotification(notification) {
    if (!this.io) return;

    this.io.to('analytics').emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected clients count
   * @returns {number} Number of connected clients
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get connected clients info
   * @returns {Array} Array of connected client info
   */
  getConnectedClientsInfo() {
    return Array.from(this.connectedClients.values()).map(client => ({
      userId: client.userId,
      userRole: client.userRole,
      connectedAt: client.connectedAt,
      analyticsSubscription: client.analyticsSubscription
    }));
  }

  /**
   * Broadcast order status update to analytics dashboard
   * @param {Object} orderData - Order data
   */
  broadcastOrderUpdate(orderData) {
    if (!this.io) return;

    this.io.to('analytics').emit('order:update', {
      orderId: orderData.orderId,
      status: orderData.status,
      paymentStatus: orderData.payment?.status || orderData.paymentStatus,
      totalAmount: orderData.pricing?.total || orderData.totalAmount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast payment update to analytics dashboard
   * @param {Object} paymentData - Payment data
   */
  broadcastPaymentUpdate(paymentData) {
    if (!this.io) return;

    this.io.to('analytics').emit('payment:update', {
      orderId: paymentData.orderId,
      paymentMethod: paymentData.method,
      paymentStatus: paymentData.status,
      amount: paymentData.amount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast customer registration to analytics dashboard
   * @param {Object} customerData - Customer data
   */
  broadcastCustomerRegistration(customerData) {
    if (!this.io) return;

    this.io.to('analytics').emit('customer:registration', {
      customerId: customerData.customerId,
      name: customerData.name,
      email: customerData.email,
      registrationDate: customerData.registrationDate,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Emit real-time delivery update for a specific order or to all relevant clients.
   * @param {string} orderId - The ID of the order.
   * @param {Object} updateData - The delivery update data (status, location, etc.).
   * @param {string} [customerId] - Optional customer ID to emit to a specific customer.
   * @param {string} [deliveryAgentId] - Optional delivery agent ID to emit to a specific agent.
   */
  emitDeliveryUpdate(orderId, updateData, customerId = null, deliveryAgentId = null) {
    if (!this.io) return;

    const payload = {
      orderId,
      ...updateData,
      timestamp: new Date().toISOString()
    };

    // Emit to admin analytics dashboard
    this.io.to('analytics').emit('delivery:update', payload);

    // If customerId is provided, emit to that specific customer's room (if implemented)
    if (customerId) {
      this.io.to(`customer-${customerId}`).emit('delivery:update', payload);
    }

    // If deliveryAgentId is provided, emit to that specific agent's room (if implemented)
    if (deliveryAgentId) {
      this.io.to(`deliveryAgent-${deliveryAgentId}`).emit('delivery:update', payload);
    }
  }

  /**
   * Handle graceful shutdown
   */
  shutdown() {
    if (this.analyticsSubscriber) {
      this.analyticsSubscriber.disconnect();
    }
    
    if (this.io) {
      this.io.close();
    }
    
    this.connectedClients.clear();
    console.log('WebSocket service shut down');
  }
}

// Export singleton instance
module.exports = new WebSocketService();
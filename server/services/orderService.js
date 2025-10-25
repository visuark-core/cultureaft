const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const DeliveryAgent = require('../models/DeliveryAgent');
const AnalyticsEventService = require('./analyticsEventService');
const WebSocketService = require('./websocketService');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../utils/emailService');
const { generateUniqueOrderNumber } = require('../utils/orderUtils');
const dataService = require('./dataService');

exports.getOrders = async (filters, options) => {
    try {
        // Get all orders from data service (Google Sheets)
        const allOrders = await dataService.findAllOrders();

        // Ensure allOrders is an array
        if (!Array.isArray(allOrders)) {
            console.warn('findAllOrders returned non-array data:', allOrders);
            return {
                orders: [],
                total: 0,
                page: parseInt(options.page) || 1,
                limit: parseInt(options.limit) || 50,
                pages: 0
            };
        }

        // Apply filters
        let filteredOrders = allOrders;

        if (filters.status) {
            filteredOrders = filteredOrders.filter(order => order.status === filters.status);
        }

        if (filters.paymentStatus) {
            filteredOrders = filteredOrders.filter(order =>
                order.payment?.status === filters.paymentStatus ||
                order.paymentStatus === filters.paymentStatus
            );
        }

        if (filters.paymentMethod) {
            filteredOrders = filteredOrders.filter(order =>
                order.payment?.method === filters.paymentMethod ||
                order.paymentMethod === filters.paymentMethod
            );
        }

        if (options.search) {
            const searchLower = options.search.toLowerCase();
            filteredOrders = filteredOrders.filter(order =>
                order.orderId?.toLowerCase().includes(searchLower) ||
                order.customer?.name?.toLowerCase().includes(searchLower) ||
                order.customer?.email?.toLowerCase().includes(searchLower) ||
                order.items?.some(item => item.name?.toLowerCase().includes(searchLower))
            );
        }

        // Sort orders
        const { sortBy = 'orderDate', sortOrder = 'desc' } = options;
        filteredOrders.sort((a, b) => {
            let aVal = a[sortBy] || a.createdAt || a.orderDate;
            let bVal = b[sortBy] || b.createdAt || b.orderDate;

            if (aVal && bVal) {
                if (sortOrder === 'asc') {
                    return new Date(aVal) - new Date(bVal);
                } else {
                    return new Date(bVal) - new Date(aVal);
                }
            }
            return 0;
        });

        // Apply pagination
        const { page = 1, limit = 50 } = options;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

        return {
            orders: paginatedOrders,
            total: filteredOrders.length,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(filteredOrders.length / limit)
        };
    } catch (error) {
        throw new Error(`Error fetching orders: ${error.message}`);
    }
};

exports.getOrderById = async (id) => {
    try {
        const order = await Order.findById(id)
            .populate('customer.customerId', 'firstName lastName email phone addresses')
            .populate('items.productId', 'name image sku description price');

        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    } catch (error) {
        throw new Error(`Error fetching order by ID: ${error.message}`);
    }
};

exports.createOrder = async (orderData) => {
    try {
        const newOrder = new Order(orderData);
        await newOrder.save();
        return newOrder;
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.updateOrderStatus = async (orderId, status, adminId, notes) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Add timeline event and update status
        order.status = status;
        order.delivery.deliveryStatus = status; // Sync delivery status with main status
        await order.addTimelineEvent(status, notes, adminId, false); // Not automated
        WebSocketService.emitDeliveryUpdate(order._id, { status: status }, order.customer.customerId, order.delivery.assignedAgent);

        return order;
    } catch (error) {
        throw new Error(`Error updating order status: ${error.message}`);
    }
};

exports.updatePaymentStatus = async (orderId, paymentStatus, adminId, transactionId, notes) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        order.payment.status = paymentStatus;
        if (transactionId) {
            order.payment.transactionId = transactionId;
        }
        order.payment.paidAt = new Date(); // Assuming update means it's paid or status changed

        // Add timeline event
        await order.addTimelineEvent(order.status, `Payment status updated to ${paymentStatus}. ${notes || ''}`, adminId, false);

        await order.save();
        return order;
    } catch (error) {
        throw new Error(`Error updating payment status: ${error.message}`);
    }
};

exports.cancelOrder = async (orderId, adminId, reason) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        if (['shipped', 'delivered', 'completed', 'cancelled'].includes(order.status)) {
            throw new Error('Cannot cancel order at this stage');
        }

        await order.cancelOrder(reason, 'admin', 0); // Assuming no immediate refund amount for now
        await order.addTimelineEvent('cancelled', `Order cancelled by admin. Reason: ${reason}`, adminId, false);
        WebSocketService.emitDeliveryUpdate(order._id, { status: 'cancelled' }, order.customer.customerId, order.delivery.assignedAgent);

        return order;
    } catch (error) {
        throw new Error(`Error cancelling order: ${error.message}`);
    }
};

exports.bulkUpdateOrders = async (orderIds, updateData, adminId) => {
    try {
        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: updateData }
        );

        // Add timeline event for each updated order (simplified for bulk)
        for (const id of orderIds) {
            const order = await Order.findById(id);
            if (order) {
                if (updateData.status) {
                    order.status = updateData.status;
                    order.delivery.deliveryStatus = updateData.status;
                    await order.addTimelineEvent(updateData.status, `Bulk status update to ${updateData.status}`, adminId, false);
                    WebSocketService.emitDeliveryUpdate(order._id, { status: updateData.status }, order.customer.customerId, order.delivery.assignedAgent);
                }
                if (updateData.paymentStatus) {
                    order.payment.status = updateData.paymentStatus;
                    await order.addTimelineEvent(order.status, `Bulk payment status update to ${updateData.paymentStatus}`, adminId, false);
                }
                await order.save();
            }
        }

        return result;
    } catch (error) {
        throw new Error(`Error performing bulk update: ${error.message}`);
    }
};

exports.checkInventoryAvailability = async (items) => {
    try {
        const inventoryCheck = {
            available: true,
            unavailableItems: [],
            lowStockItems: [],
            totalValue: 0
        };

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                inventoryCheck.available = false;
                inventoryCheck.unavailableItems.push({
                    productId: item.productId,
                    name: item.name || 'Unknown Product',
                    reason: 'Product not found'
                });
                continue;
            }

            if (product.status !== 'active') {
                inventoryCheck.available = false;
                inventoryCheck.unavailableItems.push({
                    productId: item.productId,
                    name: product.name,
                    reason: 'Product is not active'
                });
                continue;
            }

            if (product.stock < item.quantity) {
                inventoryCheck.available = false;
                inventoryCheck.unavailableItems.push({
                    productId: item.productId,
                    name: product.name,
                    requestedQuantity: item.quantity,
                    availableStock: product.stock,
                    reason: 'Insufficient stock'
                });
                continue;
            }

            // Check for low stock warning (less than 10 units)
            if (product.stock - item.quantity < 10) {
                inventoryCheck.lowStockItems.push({
                    productId: item.productId,
                    name: product.name,
                    remainingStock: product.stock - item.quantity
                });
            }

            inventoryCheck.totalValue += product.price * item.quantity;
        }

        return inventoryCheck;
    } catch (error) {
        throw new Error(`Error checking inventory availability: ${error.message}`);
    }
};

exports.reserveInventory = async (items, orderId) => {
    try {
        const reservationResults = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}`);
            }

            // Reserve the inventory
            product.stock -= item.quantity;
            product.reserved = (product.reserved || 0) + item.quantity;

            // Add reservation record
            if (!product.reservations) {
                product.reservations = [];
            }

            product.reservations.push({
                orderId: orderId,
                quantity: item.quantity,
                reservedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
            });

            await product.save();

            reservationResults.push({
                productId: item.productId,
                name: product.name,
                reservedQuantity: item.quantity,
                remainingStock: product.stock
            });
        }

        return reservationResults;
    } catch (error) {
        throw new Error(`Error reserving inventory: ${error.message}`);
    }
};

exports.releaseInventory = async (items, orderId) => {
    try {
        const releaseResults = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                continue; // Skip if product not found
            }

            // Find and remove the reservation
            if (product.reservations) {
                const reservationIndex = product.reservations.findIndex(
                    res => res.orderId.toString() === orderId.toString()
                );

                if (reservationIndex !== -1) {
                    const reservation = product.reservations[reservationIndex];

                    // Restore stock
                    product.stock += reservation.quantity;
                    product.reserved = Math.max(0, (product.reserved || 0) - reservation.quantity);

                    // Remove reservation
                    product.reservations.splice(reservationIndex, 1);

                    await product.save();

                    releaseResults.push({
                        productId: item.productId,
                        name: product.name,
                        releasedQuantity: reservation.quantity,
                        restoredStock: product.stock
                    });
                }
            }
        }

        return releaseResults;
    } catch (error) {
        throw new Error(`Error releasing inventory: ${error.message}`);
    }
};

exports.exportOrders = async (filters) => {
    try {
        const query = { ...filters };

        // Date filtering
        if (filters.orderDateFrom || filters.orderDateTo) {
            query.createdAt = {};
            if (filters.orderDateFrom) query.createdAt.$gte = new Date(filters.orderDateFrom);
            if (filters.orderDateTo) query.createdAt.$lte = new Date(filters.orderDateTo);
        }

        const orders = await Order.find(query)
            .populate('customer.customerId', 'firstName lastName email phone')
            .populate('items.productId', 'name sku');

        // Generate CSV content
        let csv = 'Order ID,Customer Name,Customer Email,Total Amount,Status,Payment Status,Order Date,Items\n';
        orders.forEach(order => {
            const items = order.items.map(item => `${item.name} (x${item.quantity})`).join('; ');
            csv += `${order.orderId},"${order.customer.name || 'N/A'}","${order.customer.email || 'N/A'}",${order.pricing.total},${order.status},${order.payment.status},${order.createdAt.toISOString()},"${items}"\n`;
        });

        return csv;
    } catch (error) {
        throw new Error(`Error exporting orders: ${error.message}`);
    }
};
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AnalyticsService = require('../services/analyticsService');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

describe('AnalyticsService', () => {
    let mongoServer;

    beforeAll(async () => {
        // Start in-memory MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        // Clean up
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear all collections before each test
        await Order.deleteMany({});
        await Customer.deleteMany({});
        await Product.deleteMany({});
    });

    describe('calculateKPIs', () => {
        it('should calculate KPIs correctly with sample data', async () => {
            // Create test customers
            const customer1 = await Customer.create({
                customerId: 'CUST-001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                registrationDate: new Date('2024-01-15')
            });

            const customer2 = await Customer.create({
                customerId: 'CUST-002',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                registrationDate: new Date('2024-01-20')
            });

            // Create test orders for current period (last 30 days)
            const currentDate = new Date();
            const currentPeriodDate = new Date();
            currentPeriodDate.setDate(currentDate.getDate() - 15);

            await Order.create({
                orderId: 'ORD-001',
                customerId: customer1._id,
                products: [{
                    productId: new mongoose.Types.ObjectId(),
                    name: 'Test Product 1',
                    sku: 'SKU-001',
                    quantity: 1,
                    price: 1000,
                    category: 'Furniture'
                }],
                totalAmount: 1000,
                status: 'completed',
                orderDate: currentPeriodDate
            });

            await Order.create({
                orderId: 'ORD-002',
                customerId: customer2._id,
                products: [{
                    productId: new mongoose.Types.ObjectId(),
                    name: 'Test Product 2',
                    sku: 'SKU-002',
                    quantity: 2,
                    price: 1500,
                    category: 'Decor'
                }],
                totalAmount: 3000,
                status: 'delivered',
                orderDate: currentPeriodDate
            });

            // Create test orders for previous period
            const previousPeriodDate = new Date();
            previousPeriodDate.setDate(currentDate.getDate() - 45);

            await Order.create({
                orderId: 'ORD-003',
                customerId: customer1._id,
                products: [{
                    productId: new mongoose.Types.ObjectId(),
                    name: 'Test Product 3',
                    sku: 'SKU-003',
                    quantity: 1,
                    price: 800,
                    category: 'Furniture'
                }],
                totalAmount: 800,
                status: 'completed',
                orderDate: previousPeriodDate
            });

            const kpis = await AnalyticsService.calculateKPIs(30);

            expect(kpis).toHaveProperty('totalRevenue');
            expect(kpis).toHaveProperty('totalSales');
            expect(kpis).toHaveProperty('newCustomers');
            expect(kpis).toHaveProperty('avgOrderValue');

            expect(kpis.totalRevenue.value).toBe(4000);
            expect(kpis.totalSales.value).toBe(2);
            expect(kpis.avgOrderValue.value).toBe(2000);
            expect(kpis.newCustomers.value).toBe(2);

            // Check percentage changes
            expect(kpis.totalRevenue.change).toBe(400); // (4000-800)/800 * 100
            expect(kpis.totalSales.change).toBe(100); // (2-1)/1 * 100
        });

        it('should handle empty data gracefully', async () => {
            const kpis = await AnalyticsService.calculateKPIs(30);

            expect(kpis.totalRevenue.value).toBe(0);
            expect(kpis.totalSales.value).toBe(0);
            expect(kpis.avgOrderValue.value).toBe(0);
            expect(kpis.newCustomers.value).toBe(0);
        });

        it('should throw error on database failure', async () => {
            // Close the connection to simulate database failure
            await mongoose.disconnect();

            await expect(AnalyticsService.calculateKPIs(30)).rejects.toThrow('Failed to calculate KPI metrics');

            // Reconnect for other tests
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
        });
    });

    describe('getSalesChartData', () => {
        it('should return daily sales data for specified period', async () => {
            const customer = await Customer.create({
                customerId: 'CUST-001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
            });

            // Create orders for different days
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            await Order.create({
                orderId: 'ORD-001',
                customerId: customer._id,
                products: [{
                    productId: new mongoose.Types.ObjectId(),
                    name: 'Test Product',
                    sku: 'SKU-001',
                    quantity: 1,
                    price: 1000,
                    category: 'Furniture'
                }],
                totalAmount: 1000,
                status: 'completed',
                orderDate: today
            });

            await Order.create({
                orderId: 'ORD-002',
                customerId: customer._id,
                products: [{
                    productId: new mongoose.Types.ObjectId(),
                    name: 'Test Product 2',
                    sku: 'SKU-002',
                    quantity: 1,
                    price: 2000,
                    category: 'Decor'
                }],
                totalAmount: 2000,
                status: 'delivered',
                orderDate: yesterday
            });

            const salesData = await AnalyticsService.getSalesChartData(7);

            expect(Array.isArray(salesData)).toBe(true);
            expect(salesData).toHaveLength(7);
            expect(salesData[0]).toHaveProperty('name');
            expect(salesData[0]).toHaveProperty('Sales');
            expect(salesData[0]).toHaveProperty('orderCount');

            // Check that we have some sales data
            const totalSales = salesData.reduce((sum, day) => sum + day.Sales, 0);
            expect(totalSales).toBe(3000);
        });

        it('should fill missing days with zero sales', async () => {
            const salesData = await AnalyticsService.getSalesChartData(5);

            expect(salesData).toHaveLength(5);
            salesData.forEach(day => {
                expect(day.Sales).toBe(0);
                expect(day.orderCount).toBe(0);
            });
        });
    });

    describe('getCategoryDistribution', () => {
        it('should return category distribution correctly', async () => {
            const customer = await Customer.create({
                customerId: 'CUST-001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
            });

            await Order.create({
                orderId: 'ORD-001',
                customerId: customer._id,
                products: [
                    {
                        productId: new mongoose.Types.ObjectId(),
                        name: 'Furniture Item',
                        sku: 'SKU-001',
                        quantity: 2,
                        price: 1000,
                        category: 'Furniture'
                    },
                    {
                        productId: new mongoose.Types.ObjectId(),
                        name: 'Decor Item',
                        sku: 'SKU-002',
                        quantity: 1,
                        price: 500,
                        category: 'Decor'
                    }
                ],
                totalAmount: 2500,
                status: 'completed',
                orderDate: new Date()
            });

            const categoryData = await AnalyticsService.getCategoryDistribution();

            expect(Array.isArray(categoryData)).toBe(true);
            expect(categoryData).toHaveLength(2);

            const furnitureCategory = categoryData.find(cat => cat.name === 'Furniture');
            const decorCategory = categoryData.find(cat => cat.name === 'Decor');

            expect(furnitureCategory.value).toBe(2000);
            expect(decorCategory.value).toBe(500);
        });

        it('should exclude categories with zero sales', async () => {
            const categoryData = await AnalyticsService.getCategoryDistribution();
            expect(categoryData).toHaveLength(0);
        });
    });

    describe('getTopProducts', () => {
        it('should return top products ranked by units sold', async () => {
            const customer = await Customer.create({
                customerId: 'CUST-001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
            });

            // Create orders with different products
            await Order.create({
                orderId: 'ORD-001',
                customerId: customer._id,
                products: [{
                    productId: new mongoose.Types.ObjectId(),
                    name: 'Popular Product',
                    sku: 'SKU-001',
                    quantity: 5,
                    price: 1000,
                    category: 'Furniture'
                }],
                totalAmount: 5000,
                status: 'completed',
                orderDate: new Date()
            });

            await Order.create({
                orderId: 'ORD-002',
                customerId: customer._id,
                products: [{
                    productId: new mongoose.Types.ObjectId(),
                    name: 'Less Popular Product',
                    sku: 'SKU-002',
                    quantity: 2,
                    price: 1500,
                    category: 'Decor'
                }],
                totalAmount: 3000,
                status: 'delivered',
                orderDate: new Date()
            });

            const topProducts = await AnalyticsService.getTopProducts(5);

            expect(Array.isArray(topProducts)).toBe(true);
            expect(topProducts).toHaveLength(2);

            // Check that products are sorted by units sold
            expect(topProducts[0].name).toBe('Popular Product');
            expect(topProducts[0].unitsSold).toBe(5);
            expect(topProducts[1].name).toBe('Less Popular Product');
            expect(topProducts[1].unitsSold).toBe(2);

            // Check revenue formatting
            expect(topProducts[0].revenue).toBe('₹5,000');
            expect(topProducts[1].revenue).toBe('₹3,000');
        });

        it('should limit results to specified number', async () => {
            const customer = await Customer.create({
                customerId: 'CUST-001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
            });

            // Create multiple products
            for (let i = 1; i <= 15; i++) {
                await Order.create({
                    orderId: `ORD-${i.toString().padStart(3, '0')}`,
                    customerId: customer._id,
                    products: [{
                        productId: new mongoose.Types.ObjectId(),
                        name: `Product ${i}`,
                        sku: `SKU-${i.toString().padStart(3, '0')}`,
                        quantity: i,
                        price: 1000,
                        category: 'Furniture'
                    }],
                    totalAmount: i * 1000,
                    status: 'completed',
                    orderDate: new Date()
                });
            }

            const topProducts = await AnalyticsService.getTopProducts(10);
            expect(topProducts).toHaveLength(10);

            // Check that results are properly sorted (highest units sold first)
            expect(topProducts[0].unitsSold).toBeGreaterThan(topProducts[1].unitsSold);
        });
    });

    describe('getRecentOrders', () => {
        it('should return recent orders with customer information', async () => {
            const customer = await Customer.create({
                customerId: 'CUST-001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
            });

            await Order.create({
                orderId: 'ORD-001',
                customerId: customer._id,
                products: [{
                    productId: new mongoose.Types.ObjectId(),
                    name: 'Test Product',
                    sku: 'SKU-001',
                    quantity: 1,
                    price: 1000,
                    category: 'Furniture'
                }],
                totalAmount: 1000,
                status: 'completed',
                orderDate: new Date()
            });

            const recentOrders = await AnalyticsService.getRecentOrders(5);

            expect(Array.isArray(recentOrders)).toBe(true);
            expect(recentOrders).toHaveLength(1);
            expect(recentOrders[0]).toHaveProperty('orderId');
            expect(recentOrders[0]).toHaveProperty('customerName');
            expect(recentOrders[0]).toHaveProperty('totalAmount');
            expect(recentOrders[0]).toHaveProperty('orderDate');
            expect(recentOrders[0]).toHaveProperty('status');
            expect(recentOrders[0]).toHaveProperty('productCount');

            expect(recentOrders[0].customerName).toBe('John Doe');
            expect(recentOrders[0].totalAmount).toBe(1000);
            expect(recentOrders[0].productCount).toBe(1);
        });
    });

    describe('getCustomerAnalytics', () => {
        it('should return customer analytics data', async () => {
            // Create customers with different registration dates
            const thisMonth = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(thisMonth.getMonth() - 1);

            await Customer.create({
                customerId: 'CUST-001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                registrationDate: thisMonth,
                totalSpent: 5000,
                totalOrders: 3,
                status: 'active'
            });

            await Customer.create({
                customerId: 'CUST-002',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                registrationDate: lastMonth,
                totalSpent: 3000,
                totalOrders: 2,
                status: 'active'
            });

            const customerAnalytics = await AnalyticsService.getCustomerAnalytics();

            expect(customerAnalytics).toHaveProperty('totalCustomers');
            expect(customerAnalytics).toHaveProperty('customersThisMonth');
            expect(customerAnalytics).toHaveProperty('topCustomers');

            expect(customerAnalytics.totalCustomers).toBe(2);
            expect(customerAnalytics.customersThisMonth).toBe(1);
            expect(Array.isArray(customerAnalytics.topCustomers)).toBe(true);
            expect(customerAnalytics.topCustomers).toHaveLength(2);

            // Check top customer (highest spender first)
            expect(customerAnalytics.topCustomers[0].name).toBe('John Doe');
            expect(customerAnalytics.topCustomers[0].totalSpent).toBe(5000);
        });
    });
});
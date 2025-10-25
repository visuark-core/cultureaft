#!/usr/bin/env node

/**
 * Migration Script: MongoDB to Google Sheets (Minimal MongoDB)
 * 
 * This script migrates data from MongoDB to Google Sheets, keeping only essential data in MongoDB.
 * 
 * What gets migrated to Google Sheets:
 * - All customer data (except login credentials)
 * - All order data
 * - All product data
 * 
 * What stays in MongoDB:
 * - User authentication (email, passwordHash, session tokens)
 * - Admin user data (complete admin profiles and permissions)
 * - Audit logs (security and compliance data)
 * - Analytics data (for performance reasons)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import MongoDB models
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Product = require('../models/Product');
const AdminUser = require('../models/AdminUser');
const Analytics = require('../models/Analytics');
const AuditLog = require('../models/AuditLog');
const Payment = require('../models/Payment');
const DeliveryAgent = require('../models/DeliveryAgent');

// Import Google Sheets DAOs
const CustomerSheetsDAO = require('../services/sheets/CustomerSheetsDAO');
const OrderSheetsDAO = require('../services/sheets/OrderSheetsDAO');
const AdminUserSheetsDAO = require('../services/sheets/AdminUserSheetsDAO');

// Import services
const googleSheetsService = require('../services/googleSheetsService');

class MigrationManager {
    constructor() {
        this.stats = {
            customers: { migrated: 0, errors: 0 },
            orders: { migrated: 0, errors: 0 },
            products: { migrated: 0, errors: 0 },
            userAuth: { created: 0, errors: 0 }
        };
        this.errors = [];
    }

    async connect() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            throw error;
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('✅ Disconnected from MongoDB');
        } catch (error) {
            console.error('❌ MongoDB disconnection failed:', error.message);
        }
    }

    async createAuthOnlyModels() {
        console.log('\n📝 Creating authentication-only MongoDB models...');

        // Create simplified User model for authentication only
        const userAuthSchema = new mongoose.Schema({
            email: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                trim: true
            },
            passwordHash: {
                type: String,
                required: true
            },
            role: {
                type: String,
                enum: ['user', 'admin'],
                default: 'user'
            },
            isActive: {
                type: Boolean,
                default: true
            },
            lastLogin: Date,
            loginAttempts: {
                type: Number,
                default: 0
            },
            lockedUntil: Date,
            sessionTokens: [{
                token: String,
                createdAt: {
                    type: Date,
                    default: Date.now
                },
                expiresAt: Date,
                isActive: {
                    type: Boolean,
                    default: true
                }
            }]
        }, {
            timestamps: true
        });

        // Create the auth-only models
        const UserAuth = mongoose.model('UserAuth', userAuthSchema);

        console.log('✅ Authentication-only models created');
        return { UserAuth };
    }

    async migrateCustomers() {
        console.log('\n👥 Migrating customers to Google Sheets...');

        try {
            const customers = await Customer.find({});
            console.log(`Found ${customers.length} customers to migrate`);

            for (const customer of customers) {
                try {
                    // Prepare customer data for Google Sheets
                    const customerData = {
                        customerId: customer.customerId,
                        firstName: customer.firstName,
                        lastName: customer.lastName,
                        email: customer.email,
                        phone: customer.phone,
                        dateOfBirth: customer.dateOfBirth,
                        gender: customer.gender,
                        registrationDate: customer.registrationDate,
                        addresses: customer.addresses,
                        totalOrders: customer.totalOrders,
                        totalSpent: customer.totalSpent,
                        lastOrderDate: customer.lastOrderDate,
                        preferences: customer.preferences,
                        status: customer.status,
                        createdAt: customer.createdAt,
                        updatedAt: customer.updatedAt
                    };

                    await CustomerSheetsDAO.create(customerData);
                    this.stats.customers.migrated++;

                    if (this.stats.customers.migrated % 10 === 0) {
                        console.log(`  Migrated ${this.stats.customers.migrated} customers...`);
                    }
                } catch (error) {
                    this.stats.customers.errors++;
                    this.errors.push(`Customer ${customer.email}: ${error.message}`);
                    console.error(`  ❌ Error migrating customer ${customer.email}:`, error.message);
                }
            }

            console.log(`✅ Customers migration completed: ${this.stats.customers.migrated} migrated, ${this.stats.customers.errors} errors`);
        } catch (error) {
            console.error('❌ Customer migration failed:', error.message);
            throw error;
        }
    }

    async migrateOrders() {
        console.log('\n📦 Migrating orders to Google Sheets...');

        try {
            const orders = await Order.find({}).populate('customerId', 'firstName lastName email phone');
            console.log(`Found ${orders.length} orders to migrate`);

            for (const order of orders) {
                try {
                    // Prepare order data for Google Sheets
                    const orderData = {
                        orderId: order.orderId || order.orderNumber,
                        customerId: order.customerId?._id,
                        customer: {
                            customerId: order.customerId?._id,
                            name: order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'Unknown',
                            email: order.customerId?.email || 'unknown@example.com',
                            phone: order.customerId?.phone || ''
                        },
                        items: order.items || order.products?.map(p => ({
                            productId: p.productId,
                            name: p.name,
                            sku: p.sku,
                            quantity: p.quantity,
                            price: p.price,
                            category: p.category,
                            subtotal: p.price * p.quantity
                        })) || [],
                        pricing: order.pricing || {
                            subtotal: order.totalAmount || 0,
                            taxes: order.taxAmount || 0,
                            shippingCharges: 0,
                            codCharges: 0,
                            discount: 0,
                            total: order.finalAmount || order.totalAmount || 0
                        },
                        payment: order.payment || {
                            method: order.paymentMethod === 'cash_on_delivery' ? 'cod' : order.paymentMethod,
                            status: order.paymentStatus === 'paid' ? 'completed' : order.paymentStatus,
                            transactionId: order.transactionId,
                            razorpayOrderId: order.razorpayOrderId
                        },
                        shipping: order.shipping || {
                            address: order.shippingAddress || {},
                            method: 'standard'
                        },
                        status: order.status,
                        timeline: order.timeline || [],
                        delivery: order.delivery || {},
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt,
                        orderDate: order.orderDate
                    };

                    await OrderSheetsDAO.create(orderData);
                    this.stats.orders.migrated++;

                    if (this.stats.orders.migrated % 10 === 0) {
                        console.log(`  Migrated ${this.stats.orders.migrated} orders...`);
                    }
                } catch (error) {
                    this.stats.orders.errors++;
                    this.errors.push(`Order ${order.orderId || order._id}: ${error.message}`);
                    console.error(`  ❌ Error migrating order ${order.orderId || order._id}:`, error.message);
                }
            }

            console.log(`✅ Orders migration completed: ${this.stats.orders.migrated} migrated, ${this.stats.orders.errors} errors`);
        } catch (error) {
            console.error('❌ Order migration failed:', error.message);
            throw error;
        }
    }

    async migrateProducts() {
        console.log('\n🛍️ Migrating products to Google Sheets...');

        try {
            // Create Products sheet if it doesn't exist
            const productSheetName = 'Products';
            const productHeaders = [
                'id', 'name', 'category', 'subcategory', 'price', 'originalPrice', 'discountPercentage',
                'sku', 'description', 'shortDescription', 'craftsman', 'image', 'images', 'materials',
                'dimensions', 'weight', 'origin', 'rating', 'reviewCount', 'isNew', 'isFeatured',
                'isActive', 'stock', 'minQuantity', 'maxQuantity', 'tags', 'hsn', 'taxRate',
                'careInstructions', 'warranty', 'shippingWeight', 'shippingDimensions',
                'metaTitle', 'metaDescription', 'createdAt', 'updatedAt'
            ];

            try {
                await googleSheetsService.readSheet(productSheetName, 'A1:AK1');
            } catch (error) {
                if (error.code === 400) {
                    await googleSheetsService.createSheet(productSheetName);
                    await googleSheetsService.writeSheet(productSheetName, 'A1:AK1', [productHeaders]);
                }
            }

            const products = await Product.find({});
            console.log(`Found ${products.length} products to migrate`);

            for (const product of products) {
                try {
                    // Prepare product data for Google Sheets
                    const productData = {
                        id: product._id.toString(),
                        name: product.name,
                        category: product.category,
                        subcategory: product.subcategory,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        discountPercentage: product.discountPercentage,
                        sku: product.sku,
                        description: product.description,
                        shortDescription: product.shortDescription,
                        craftsman: product.craftsman,
                        image: product.image,
                        images: JSON.stringify(product.images || []),
                        materials: JSON.stringify(product.materials || []),
                        dimensions: product.dimensions,
                        weight: product.weight,
                        origin: product.origin,
                        rating: product.rating,
                        reviewCount: product.reviewCount,
                        isNew: product.isNew,
                        isFeatured: product.isFeatured,
                        isActive: product.isActive,
                        stock: product.stock,
                        minQuantity: product.minQuantity,
                        maxQuantity: product.maxQuantity,
                        tags: JSON.stringify(product.tags || []),
                        hsn: product.hsn,
                        taxRate: product.taxRate,
                        careInstructions: JSON.stringify(product.careInstructions || []),
                        warranty: product.warranty,
                        shippingWeight: product.shippingWeight,
                        shippingDimensions: JSON.stringify(product.shippingDimensions || {}),
                        metaTitle: product.metaTitle,
                        metaDescription: product.metaDescription,
                        createdAt: product.createdAt?.toISOString(),
                        updatedAt: product.updatedAt?.toISOString()
                    };

                    const rowData = productHeaders.map(header => {
                        const value = productData[header];
                        return value !== undefined && value !== null ? String(value) : '';
                    });

                    await googleSheetsService.appendToSheet(productSheetName, [rowData]);
                    this.stats.products.migrated++;

                    if (this.stats.products.migrated % 10 === 0) {
                        console.log(`  Migrated ${this.stats.products.migrated} products...`);
                    }
                } catch (error) {
                    this.stats.products.errors++;
                    this.errors.push(`Product ${product.sku}: ${error.message}`);
                    console.error(`  ❌ Error migrating product ${product.sku}:`, error.message);
                }
            }

            console.log(`✅ Products migration completed: ${this.stats.products.migrated} migrated, ${this.stats.products.errors} errors`);
        } catch (error) {
            console.error('❌ Product migration failed:', error.message);
            throw error;
        }
    }

    async createUserAuthRecords() {
        console.log('\n� Creaiting UserAuth records from existing users...');

        try {
            const UserAuth = mongoose.model('UserAuth');

            // Migrate customer authentication data
            const customers = await Customer.find({});
            console.log(`Found ${customers.length} customers to create auth records for`);

            for (const customer of customers) {
                try {
                    // Check if auth record already exists
                    const existingAuth = await UserAuth.findOne({ email: customer.email });
                    if (existingAuth) {
                        console.log(`  Auth record already exists for customer: ${customer.email}`);
                        continue;
                    }

                    await UserAuth.create({
                        email: customer.email,
                        passwordHash: 'temp_hash_needs_reset', // Customer will need to reset password
                        role: 'user',
                        isActive: customer.status === 'active'
                    });

                    this.stats.userAuth.created++;

                    if (this.stats.userAuth.created % 10 === 0) {
                        console.log(`  Created ${this.stats.userAuth.created} user auth records...`);
                    }
                } catch (error) {
                    this.stats.userAuth.errors++;
                    this.errors.push(`Customer auth ${customer.email}: ${error.message}`);
                    console.error(`  ❌ Error creating auth for customer ${customer.email}:`, error.message);
                }
            }

            // Migrate admin authentication data
            const adminUsers = await AdminUser.find({});
            console.log(`Found ${adminUsers.length} admin users to create auth records for`);

            for (const admin of adminUsers) {
                try {
                    // Check if auth record already exists
                    const existingAuth = await UserAuth.findOne({ email: admin.email });
                    if (existingAuth) {
                        console.log(`  Auth record already exists for admin: ${admin.email}`);
                        continue;
                    }

                    await UserAuth.create({
                        email: admin.email,
                        passwordHash: admin.passwordHash,
                        role: admin.role?.name === 'super_admin' ? 'super_admin' : 'admin',
                        isActive: admin.isActive,
                        lastLogin: admin.security?.lastLogin,
                        loginAttempts: admin.security?.loginAttempts || 0,
                        lockedUntil: admin.security?.lockedUntil,
                        sessionTokens: admin.security?.sessionTokens || []
                    });

                    this.stats.userAuth.created++;
                    console.log(`  Created auth record for admin: ${admin.email}`);
                } catch (error) {
                    this.stats.userAuth.errors++;
                    this.errors.push(`Admin auth ${admin.email}: ${error.message}`);
                    console.error(`  ❌ Error creating auth for admin ${admin.email}:`, error.message);
                }
            }

            console.log(`✅ UserAuth creation completed: ${this.stats.userAuth.created} created, ${this.stats.userAuth.errors} errors`);
        } catch (error) {
            console.error('❌ UserAuth creation failed:', error.message);
            throw error;
        }
    }

    async skipOtherData() {
        console.log('\n📊 Skipping migration of admin users, analytics, and audit logs...');
        console.log('  ℹ️  Admin users will remain in MongoDB for full functionality');
        console.log('  ℹ️  Analytics will remain in MongoDB for performance');
        console.log('  ℹ️  Audit logs will remain in MongoDB for security compliance');
        console.log('✅ Other data kept in MongoDB as requested');
    }

    async validateExistingData() {
        console.log('\n✅ Validating existing MongoDB data that will remain...');

        try {
            // Check admin users
            const adminUsers = await AdminUser.find({});
            console.log(`  📊 Admin users in MongoDB: ${adminUsers.length}`);

            // Check analytics
            const analytics = await Analytics.find({});
            console.log(`  📊 Analytics records in MongoDB: ${analytics.length}`);

            // Check audit logs
            const auditLogs = await AuditLog.find({});
            console.log(`  📊 Audit logs in MongoDB: ${auditLogs.length}`);

            console.log('✅ MongoDB data validation completed');
        } catch (error) {
            console.error('❌ Failed to validate existing data:', error.message);
            throw error;
        }
    }

    async generateMigrationReport() {
        console.log('\n📋 Migration Report');
        console.log('==================');

        Object.keys(this.stats).forEach(collection => {
            const stat = this.stats[collection];
            if (stat.migrated > 0 || stat.errors > 0) {
                console.log(`${collection}: ${stat.migrated} migrated, ${stat.errors} errors`);
            }
        });

        console.log('\n📊 Total Summary:');
        const totalMigrated = Object.values(this.stats).reduce((sum, stat) => sum + stat.migrated, 0);
        const totalErrors = Object.values(this.stats).reduce((sum, stat) => sum + stat.errors, 0);
        console.log(`Total migrated: ${totalMigrated}`);
        console.log(`Total errors: ${totalErrors}`);

        if (this.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
            if (this.errors.length > 10) {
                console.log(`  ... and ${this.errors.length - 10} more errors`);
            }
        }

        // Save report to file
        const fs = require('fs');
        const reportPath = path.join(__dirname, '../logs/migration-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            errors: this.errors,
            totalMigrated,
            totalErrors
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    async run() {
        console.log('🚀 Starting MongoDB to Google Sheets Migration');
        console.log('===============================================');

        try {
            await this.connect();

            // Create auth-only models first
            await this.createAuthOnlyModels();

            // Migrate data to Google Sheets
            await this.migrateCustomers();
            await this.migrateOrders();
            await this.migrateProducts();

            // Create UserAuth records for authentication
            await this.createUserAuthRecords();

            // Skip migration of admin users, analytics, and audit logs
            await this.skipOtherData();

            // Validate existing MongoDB data
            await this.validateExistingData();

            // Generate report
            await this.generateMigrationReport();

            console.log('\n✅ Migration completed successfully!');
            console.log('\n⚠️  IMPORTANT NEXT STEPS:');
            console.log('1. Update your application code to use Google Sheets for customer/order/product operations');
            console.log('2. Update authentication services to use the new UserAuth model');
            console.log('3. Admin users, analytics, and audit logs remain in MongoDB');
            console.log('4. Test all functionality thoroughly');
            console.log('5. Backup your MongoDB data before dropping migrated collections');
            console.log('6. Drop Customer, Order, and Product collections once everything is working');
            console.log('7. Keep AdminUser, Analytics, and AuditLog collections in MongoDB');

        } catch (error) {
            console.error('\n❌ Migration failed:', error.message);
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    const migration = new MigrationManager();
    migration.run().catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}

module.exports = MigrationManager;
const CustomerSheetsDAO = require('./sheets/CustomerSheetsDAO');
const AdminUserSheetsDAO = require('./sheets/AdminUserSheetsDAO');
const ProductSheetsDAO = require('./sheets/ProductSheetsDAO');
const OrderSheetsDAO = require('./sheets/OrderSheetsDAO');

// MongoDB models (if available)
let Customer, AdminUser, Product, Order;

try {
  Customer = require('../models/Customer');
  AdminUser = require('../models/AdminUser');
  Product = require('../models/Product');
  Order = require('../models/Order');
} catch (error) {
  console.log('MongoDB models not available, migration will be skipped');
}

class DataMigrationService {
  constructor() {
    this.batchSize = 100;
  }

  async migrateAllData() {
    console.log('Starting data migration from MongoDB to Google Sheets...');
    
    try {
      await this.migrateCustomers();
      await this.migrateAdminUsers();
      await this.migrateProducts();
      await this.migrateOrders();
      
      console.log('Data migration completed successfully!');
    } catch (error) {
      console.error('Data migration failed:', error);
      throw error;
    }
  }

  async migrateCustomers() {
    if (!Customer) {
      console.log('Customer model not available, skipping customer migration');
      return;
    }

    console.log('Migrating customers...');
    
    try {
      const totalCustomers = await Customer.countDocuments();
      console.log(`Found ${totalCustomers} customers to migrate`);
      
      let processed = 0;
      let skip = 0;
      
      while (processed < totalCustomers) {
        const customers = await Customer.find()
          .skip(skip)
          .limit(this.batchSize)
          .lean();
        
        for (const customer of customers) {
          try {
            // Convert MongoDB document to plain object
            const customerData = {
              customerId: customer.customerId,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              dateOfBirth: customer.dateOfBirth?.toISOString(),
              gender: customer.gender,
              registrationDate: customer.registrationDate?.toISOString(),
              addresses: customer.addresses || [],
              totalOrders: customer.totalOrders || 0,
              totalSpent: customer.totalSpent || 0,
              lastOrderDate: customer.lastOrderDate?.toISOString(),
              preferences: customer.preferences || {},
              status: customer.status || 'active',
              createdAt: customer.createdAt?.toISOString(),
              updatedAt: customer.updatedAt?.toISOString()
            };
            
            await CustomerSheetsDAO.create(customerData);
            processed++;
            
            if (processed % 10 === 0) {
              console.log(`Migrated ${processed}/${totalCustomers} customers`);
            }
          } catch (error) {
            console.error(`Error migrating customer ${customer.customerId}:`, error.message);
          }
        }
        
        skip += this.batchSize;
      }
      
      console.log(`Customer migration completed: ${processed} customers migrated`);
    } catch (error) {
      console.error('Customer migration failed:', error);
      throw error;
    }
  }

  async migrateAdminUsers() {
    if (!AdminUser) {
      console.log('AdminUser model not available, skipping admin user migration');
      return;
    }

    console.log('Migrating admin users...');
    
    try {
      const totalAdmins = await AdminUser.countDocuments();
      console.log(`Found ${totalAdmins} admin users to migrate`);
      
      let processed = 0;
      let skip = 0;
      
      while (processed < totalAdmins) {
        const admins = await AdminUser.find()
          .skip(skip)
          .limit(this.batchSize)
          .lean();
        
        for (const admin of admins) {
          try {
            const adminData = {
              id: admin._id.toString(),
              email: admin.email,
              passwordHash: admin.passwordHash,
              role: admin.role || {},
              profile: admin.profile || {},
              security: {
                ...admin.security,
                lastLogin: admin.security?.lastLogin?.toISOString(),
                passwordChangedAt: admin.security?.passwordChangedAt?.toISOString(),
                lockedUntil: admin.security?.lockedUntil?.toISOString()
              },
              audit: {
                ...admin.audit,
                createdAt: admin.audit?.createdAt?.toISOString(),
                updatedAt: admin.audit?.updatedAt?.toISOString(),
                lastActivity: admin.audit?.lastActivity?.toISOString()
              },
              isActive: admin.isActive,
              metadata: admin.metadata || {}
            };
            
            await AdminUserSheetsDAO.create(adminData);
            processed++;
            
            if (processed % 5 === 0) {
              console.log(`Migrated ${processed}/${totalAdmins} admin users`);
            }
          } catch (error) {
            console.error(`Error migrating admin user ${admin.email}:`, error.message);
          }
        }
        
        skip += this.batchSize;
      }
      
      console.log(`Admin user migration completed: ${processed} admin users migrated`);
    } catch (error) {
      console.error('Admin user migration failed:', error);
      throw error;
    }
  }

  async migrateProducts() {
    if (!Product) {
      console.log('Product model not available, skipping product migration');
      return;
    }

    console.log('Migrating products...');
    
    try {
      const totalProducts = await Product.countDocuments();
      console.log(`Found ${totalProducts} products to migrate`);
      
      let processed = 0;
      let skip = 0;
      
      while (processed < totalProducts) {
        const products = await Product.find()
          .skip(skip)
          .limit(this.batchSize)
          .lean();
        
        for (const product of products) {
          try {
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
              images: product.images || [],
              imagePublicIds: product.imagePublicIds || [],
              materials: product.materials || [],
              dimensions: product.dimensions,
              weight: product.weight,
              origin: product.origin,
              rating: product.rating || 0,
              reviewCount: product.reviewCount || 0,
              isNew: product.isNew || false,
              isFeatured: product.isFeatured || false,
              isActive: product.isActive !== undefined ? product.isActive : true,
              stock: product.stock || 0,
              minQuantity: product.minQuantity || 1,
              maxQuantity: product.maxQuantity || 10,
              tags: product.tags || [],
              hsn: product.hsn,
              taxRate: product.taxRate || 0.18,
              careInstructions: product.careInstructions || [],
              warranty: product.warranty,
              shippingWeight: product.shippingWeight,
              shippingDimensions: product.shippingDimensions || {},
              metaTitle: product.metaTitle,
              metaDescription: product.metaDescription,
              createdBy: product.createdBy?.toString(),
              updatedBy: product.updatedBy?.toString(),
              createdAt: product.createdAt?.toISOString(),
              updatedAt: product.updatedAt?.toISOString()
            };
            
            await ProductSheetsDAO.create(productData);
            processed++;
            
            if (processed % 10 === 0) {
              console.log(`Migrated ${processed}/${totalProducts} products`);
            }
          } catch (error) {
            console.error(`Error migrating product ${product.sku}:`, error.message);
          }
        }
        
        skip += this.batchSize;
      }
      
      console.log(`Product migration completed: ${processed} products migrated`);
    } catch (error) {
      console.error('Product migration failed:', error);
      throw error;
    }
  }

  async migrateOrders() {
    if (!Order) {
      console.log('Order model not available, skipping order migration');
      return;
    }

    console.log('Migrating orders...');
    
    try {
      const totalOrders = await Order.countDocuments();
      console.log(`Found ${totalOrders} orders to migrate`);
      
      let processed = 0;
      let skip = 0;
      
      while (processed < totalOrders) {
        const orders = await Order.find()
          .skip(skip)
          .limit(this.batchSize)
          .lean();
        
        for (const order of orders) {
          try {
            const orderData = {
              id: order._id.toString(),
              orderNumber: order.orderNumber,
              orderId: order.orderId,
              customerId: order.customerId?.toString() || order.customer?.customerId?.toString(),
              customer: {
                name: order.customer?.name,
                email: order.customer?.email,
                phone: order.customer?.phone
              },
              items: order.items || order.products || [],
              totalAmount: order.totalAmount,
              finalAmount: order.finalAmount,
              taxAmount: order.taxAmount || 0,
              pricing: order.pricing || {},
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
              razorpayOrderId: order.razorpayOrderId,
              transactionId: order.transactionId,
              paymentDate: order.paymentDate?.toISOString(),
              payment: order.payment || {},
              shippingAddress: order.shippingAddress || {},
              shipping: {
                ...order.shipping,
                estimatedDelivery: order.shipping?.estimatedDelivery?.toISOString(),
                actualDelivery: order.shipping?.actualDelivery?.toISOString()
              },
              status: order.status,
              orderDate: order.orderDate?.toISOString(),
              timeline: order.timeline || [],
              delivery: order.delivery || {},
              notes: order.notes,
              tags: order.tags || [],
              source: order.source || 'website',
              createdAt: order.createdAt?.toISOString(),
              updatedAt: order.updatedAt?.toISOString()
            };
            
            await OrderSheetsDAO.create(orderData);
            processed++;
            
            if (processed % 10 === 0) {
              console.log(`Migrated ${processed}/${totalOrders} orders`);
            }
          } catch (error) {
            console.error(`Error migrating order ${order.orderNumber}:`, error.message);
          }
        }
        
        skip += this.batchSize;
      }
      
      console.log(`Order migration completed: ${processed} orders migrated`);
    } catch (error) {
      console.error('Order migration failed:', error);
      throw error;
    }
  }

  async validateMigration() {
    console.log('Validating migration...');
    
    try {
      const sheetsCustomers = await CustomerSheetsDAO.findAll();
      const sheetsAdmins = await AdminUserSheetsDAO.findAll();
      const sheetsProducts = await ProductSheetsDAO.findAll();
      const sheetsOrders = await OrderSheetsDAO.findAll();
      
      console.log('Migration validation results:');
      console.log(`- Customers in sheets: ${sheetsCustomers.length}`);
      console.log(`- Admin users in sheets: ${sheetsAdmins.length}`);
      console.log(`- Products in sheets: ${sheetsProducts.length}`);
      console.log(`- Orders in sheets: ${sheetsOrders.length}`);
      
      if (Customer) {
        const mongoCustomers = await Customer.countDocuments();
        console.log(`- Customers in MongoDB: ${mongoCustomers}`);
      }
      
      if (AdminUser) {
        const mongoAdmins = await AdminUser.countDocuments();
        console.log(`- Admin users in MongoDB: ${mongoAdmins}`);
      }
      
      if (Product) {
        const mongoProducts = await Product.countDocuments();
        console.log(`- Products in MongoDB: ${mongoProducts}`);
      }
      
      if (Order) {
        const mongoOrders = await Order.countDocuments();
        console.log(`- Orders in MongoDB: ${mongoOrders}`);
      }
      
    } catch (error) {
      console.error('Migration validation failed:', error);
      throw error;
    }
  }

  async clearSheetsData() {
    console.log('Clearing all data from Google Sheets...');
    
    try {
      await CustomerSheetsDAO.initializeSheet();
      await AdminUserSheetsDAO.initializeSheet();
      await ProductSheetsDAO.initializeSheet();
      await OrderSheetsDAO.initializeSheet();
      
      // Clear data but keep headers
      const googleSheetsService = require('./googleSheetsService');
      await googleSheetsService.clearSheet('Customers', 'A2:Z');
      await googleSheetsService.clearSheet('AdminUsers', 'A2:Z');
      await googleSheetsService.clearSheet('Products', 'A2:Z');
      await googleSheetsService.clearSheet('Orders', 'A2:Z');
      
      console.log('Google Sheets data cleared successfully');
    } catch (error) {
      console.error('Failed to clear sheets data:', error);
      throw error;
    }
  }
}

module.exports = new DataMigrationService();
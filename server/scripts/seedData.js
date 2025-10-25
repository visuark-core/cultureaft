const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
// Import products data (converted from ES6 module)
const productsData = [
  {
    id: '1',
    name: 'Royal Carved Throne Chair',
    category: 'Furniture',
    price: 45000,
    originalPrice: 55000,
    image: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Intricately carved mahogany throne chair with traditional Rajasthani motifs and gold leaf detailing. Features royal peacock designs and comfortable velvet upholstery.',
    craftsman: 'Master Ravi Sharma',
    isNew: true,
    isFeatured: true,
    rating: 4.8,
    materials: ['Mahogany Wood', 'Gold Leaf', 'Velvet'],
    dimensions: '120cm H x 70cm W x 65cm D',
    weight: '35kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '2',
    name: 'Ornate Storage Cabinet',
    category: 'Furniture',
    price: 32000,
    originalPrice: 40000,
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Hand-painted storage cabinet with brass fittings and mirror work. Features multiple compartments and traditional Marwari patterns.',
    craftsman: 'Artisan Mukesh Joshi',
    isNew: false,
    isFeatured: true,
    rating: 4.6,
    materials: ['Sheesham Wood', 'Brass', 'Mirror Work'],
    dimensions: '180cm H x 90cm W x 40cm D',
    weight: '45kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '3',
    name: 'Decorative Mirror Frame',
    category: 'Decor',
    price: 8500,
    originalPrice: 12000,
    image: 'https://images.pexels.com/photos/6580226/pexels-photo-6580226.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Elaborate mirror frame with traditional peacock and floral designs. Hand-carved from mango wood with antique gold finish.',
    craftsman: 'Master Priya Devi',
    isNew: true,
    isFeatured: true,
    rating: 4.9,
    materials: ['Mango Wood', 'Antique Gold Finish'],
    dimensions: '90cm H x 60cm W x 5cm D',
    weight: '8kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '4',
    name: 'Wooden Coffee Table',
    category: 'Furniture',
    price: 18000,
    originalPrice: 22000,
    image: 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Round coffee table with intricate lattice work and brass inlays. Perfect centerpiece for traditional or contemporary settings.',
    craftsman: 'Craftsman Gopal Singh',
    isNew: false,
    isFeatured: true,
    rating: 4.5,
    materials: ['Teak Wood', 'Brass Inlays'],
    dimensions: '45cm H x 80cm Diameter',
    weight: '20kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '5',
    name: 'Traditional Bookshelf',
    category: 'Furniture',
    price: 28000,
    originalPrice: 35000,
    image: 'https://images.pexels.com/photos/2177482/pexels-photo-2177482.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Five-tier bookshelf with carved panels and adjustable shelves. Features traditional Rajasthani geometric patterns.',
    craftsman: 'Master Lakhan Singh',
    isNew: true,
    isFeatured: false,
    rating: 4.7,
    materials: ['Rosewood', 'Brass Hardware'],
    dimensions: '200cm H x 100cm W x 35cm D',
    weight: '40kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '6',
    name: 'Carved Wall Art Panel',
    category: 'Decor',
    price: 12000,
    originalPrice: 15000,
    image: 'https://images.pexels.com/photos/6492400/pexels-photo-6492400.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Hand-carved wooden wall art depicting scenes from Rajasthani folklore. Intricate details with natural wood finish.',
    craftsman: 'Artisan Devi Lal',
    isNew: false,
    isFeatured: false,
    rating: 4.4,
    materials: ['Mango Wood', 'Natural Finish'],
    dimensions: '100cm H x 150cm W x 8cm D',
    weight: '15kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '7',
    name: 'Vintage Trunk Storage',
    category: 'Furniture',
    price: 22000,
    originalPrice: 28000,
    image: 'https://images.pexels.com/photos/1571459/pexels-photo-1571459.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Antique-style storage trunk with brass corners and traditional lock. Perfect for storing linens or as a coffee table.',
    craftsman: 'Master Kailash Chand',
    isNew: true,
    isFeatured: false,
    rating: 4.6,
    materials: ['Aged Wood', 'Brass Fittings'],
    dimensions: '50cm H x 120cm W x 60cm D',
    weight: '30kg',
    origin: 'Jodhpur, Rajasthan'
  },
  {
    id: '8',
    name: 'Decorative Table Lamp',
    category: 'Decor',
    price: 6500,
    originalPrice: 8500,
    image: 'https://images.pexels.com/photos/1910236/pexels-photo-1910236.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Traditional table lamp with hand-painted ceramic base and handwoven fabric shade. Creates warm ambient lighting.',
    craftsman: 'Artisan Sunita Devi',
    isNew: false,
    isFeatured: false,
    rating: 4.3,
    materials: ['Ceramic', 'Handwoven Fabric'],
    dimensions: '45cm H x 25cm Diameter',
    weight: '3kg',
    origin: 'Jodhpur, Rajasthan'
  }
];

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate random date within a range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate random customer data
const generateCustomers = (count = 50) => {
  const firstNames = ['Arjun', 'Priya', 'Rahul', 'Anita', 'Vikram', 'Sunita', 'Amit', 'Kavya', 'Ravi', 'Meera', 'Suresh', 'Pooja', 'Kiran', 'Deepa', 'Manoj', 'Sita', 'Ajay', 'Nisha', 'Gopal', 'Rekha'];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Agarwal', 'Verma', 'Yadav', 'Mishra', 'Tiwari', 'Pandey', 'Srivastava', 'Chauhan', 'Jain', 'Bansal', 'Malhotra', 'Kapoor', 'Saxena', 'Arora'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Maharashtra', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];

  const customers = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const cityIndex = Math.floor(Math.random() * cities.length);
    
    customers.push({
      customerId: `CUST-2024-${String(i + 1).padStart(3, '0')}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      registrationDate: randomDate(startDate, endDate),
      addresses: [{
        type: 'home',
        street: `${Math.floor(Math.random() * 999) + 1} ${lastName} Street`,
        city: cities[cityIndex],
        state: states[cityIndex],
        pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
        country: 'India',
        isDefault: true
      }],
      totalOrders: 0,
      totalSpent: 0,
      preferences: {
        newsletter: Math.random() > 0.3,
        orderUpdates: Math.random() > 0.1,
        promotions: Math.random() > 0.4
      },
      status: 'active'
    });
  }

  return customers;
};

// Convert products data to match our schema
const convertProductsData = () => {
  return productsData.map(product => ({
    name: product.name,
    category: product.category,
    price: product.price,
    originalPrice: product.originalPrice,
    sku: `SKU-${product.id.padStart(3, '0')}`,
    description: product.description,
    craftsman: product.craftsman,
    image: product.image,
    materials: product.materials,
    dimensions: product.dimensions,
    weight: product.weight,
    origin: product.origin,
    rating: product.rating,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    stock: Math.floor(Math.random() * 100) + 10 // Random stock between 10-110
  }));
};

// Generate random orders
const generateOrders = (customers, products, count = 200) => {
  const orders = [];
  const statuses = ['completed', 'delivered', 'completed', 'delivered', 'completed', 'delivered', 'processing', 'shipped', 'cancelled'];
  const paymentMethods = ['credit_card', 'debit_card', 'upi', 'net_banking', 'cash_on_delivery'];
  const paymentStatuses = ['paid', 'paid', 'paid', 'paid', 'pending', 'failed'];
  
  const startDate = new Date('2024-01-01');
  const endDate = new Date();

  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const orderDate = randomDate(startDate, endDate);
    
    // Generate 1-4 products per order
    const numProducts = Math.floor(Math.random() * 4) + 1;
    const orderProducts = [];
    let totalAmount = 0;

    for (let j = 0; j < numProducts; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
      const price = product.price;
      
      orderProducts.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity,
        price,
        category: product.category
      });
      
      totalAmount += price * quantity;
    }

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    orders.push({
      orderId: `ORD-2024-${String(i + 1).padStart(4, '0')}`,
      customerId: customer._id,
      products: orderProducts,
      totalAmount,
      status,
      orderDate,
      shippingAddress: customer.addresses[0],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus: status === 'cancelled' ? 'failed' : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]
    });

    // Update customer stats for completed orders
    if (status === 'completed' || status === 'delivered') {
      customer.totalOrders += 1;
      customer.totalSpent += totalAmount;
      customer.lastOrderDate = orderDate;
    }
  }

  return orders;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Order.deleteMany({});

    // Seed products
    console.log('Seeding products...');
    const productsToSeed = convertProductsData();
    const seededProducts = await Product.insertMany(productsToSeed);
    console.log(`✅ Seeded ${seededProducts.length} products`);

    // Seed customers
    console.log('Seeding customers...');
    const customersToSeed = generateCustomers(50);
    const seededCustomers = await Customer.insertMany(customersToSeed);
    console.log(`✅ Seeded ${seededCustomers.length} customers`);

    // Seed orders
    console.log('Seeding orders...');
    const ordersToSeed = generateOrders(seededCustomers, seededProducts, 200);
    const seededOrders = await Order.insertMany(ordersToSeed);
    console.log(`✅ Seeded ${seededOrders.length} orders`);

    // Update customer statistics
    console.log('Updating customer statistics...');
    for (const customer of seededCustomers) {
      if (customer.totalOrders > 0) {
        await Customer.findByIdAndUpdate(customer._id, {
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          lastOrderDate: customer.lastOrderDate
        });
      }
    }

    console.log('✅ Database seeding completed successfully!');
    
    // Print summary statistics
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['completed', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const completedOrders = await Order.countDocuments({ status: { $in: ['completed', 'delivered'] } });
    const activeCustomers = await Customer.countDocuments({ status: 'active' });
    
    console.log('\n📊 Seeding Summary:');
    console.log(`Products: ${seededProducts.length}`);
    console.log(`Customers: ${activeCustomers}`);
    console.log(`Total Orders: ${seededOrders.length}`);
    console.log(`Completed Orders: ${completedOrders}`);
    console.log(`Total Revenue: ₹${totalRevenue[0]?.total?.toLocaleString('en-IN') || 0}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase();
  });
}

module.exports = { seedDatabase, generateCustomers, convertProductsData, generateOrders };
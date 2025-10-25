const googleSheetsService = require('../googleSheetsService');

class CustomerSheetsDAO {
  constructor() {
    this.sheetName = 'Customers';
    this.headers = [
      'customerId',
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'registrationDate',
      'addresses',
      'totalOrders',
      'totalSpent',
      'lastOrderDate',
      'preferences.newsletter',
      'preferences.orderUpdates',
      'preferences.promotions',
      'status',
      'createdAt',
      'updatedAt'
    ];
  }

  async initializeSheet() {
    try {
      // Try to read the sheet to see if it exists
      await googleSheetsService.readSheet(this.sheetName, 'A1:R1');
    } catch (error) {
      // If sheet doesn't exist, create it with headers
      if (error.code === 400) {
        await googleSheetsService.createSheet(this.sheetName);
        await googleSheetsService.writeSheet(this.sheetName, 'A1:R1', [this.headers]);
      } else {
        throw error;
      }
    }
  }

  async findAll() {
    await this.initializeSheet();
    const data = await googleSheetsService.readSheet(this.sheetName);
    return googleSheetsService.sheetDataToObjects(data);
  }

  async findById(customerId) {
    const customers = await this.findAll();
    return customers.find(customer => customer.customerId === customerId);
  }

  async findByEmail(email) {
    const customers = await this.findAll();
    return customers.find(customer => customer.email === email);
  }

  async create(customerData) {
    await this.initializeSheet();
    
    // Generate customerId if not provided
    if (!customerData.customerId) {
      customerData.customerId = `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // Set timestamps
    customerData.registrationDate = customerData.registrationDate || new Date().toISOString();
    customerData.createdAt = new Date().toISOString();
    customerData.updatedAt = new Date().toISOString();

    // Convert addresses array to readable string for storage
    if (customerData.addresses && Array.isArray(customerData.addresses)) {
      customerData.addresses = customerData.addresses.map(addr => 
        `${addr.street}, ${addr.city}, ${addr.state} ${addr.pincode}`
      ).join('; ');
    }

    const rowData = this.headers.map(header => {
      const value = googleSheetsService.getNestedValue(customerData, header);
      return value !== undefined && value !== null ? String(value) : '';
    });

    await googleSheetsService.appendToSheet(this.sheetName, [rowData]);
    return customerData;
  }

  async update(customerId, updateData) {
    await this.initializeSheet();
    
    const data = await googleSheetsService.readSheet(this.sheetName);
    const customers = googleSheetsService.sheetDataToObjects(data);
    
    const customerIndex = customers.findIndex(customer => customer.customerId === customerId);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }

    // Update the customer data
    const updatedCustomer = { ...customers[customerIndex], ...updateData };
    updatedCustomer.updatedAt = new Date().toISOString();

    // Convert addresses array to JSON string for storage
    if (updatedCustomer.addresses && Array.isArray(updatedCustomer.addresses)) {
      updatedCustomer.addresses = JSON.stringify(updatedCustomer.addresses);
    }

    // Update the row in the sheet (add 2 to account for header row and 0-based indexing)
    const rowNumber = customerIndex + 2;
    const rowData = this.headers.map(header => {
      const value = googleSheetsService.getNestedValue(updatedCustomer, header);
      return value !== undefined && value !== null ? String(value) : '';
    });

    await googleSheetsService.writeSheet(this.sheetName, `A${rowNumber}:R${rowNumber}`, [rowData]);
    return updatedCustomer;
  }

  async delete(customerId) {
    // For Google Sheets, we'll mark as inactive instead of deleting
    return await this.update(customerId, { status: 'inactive' });
  }

  async findByStatus(status) {
    const customers = await this.findAll();
    return customers.filter(customer => customer.status === status);
  }

  async getCustomerStats() {
    const customers = await this.findAll();
    
    const stats = {
      total: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      inactive: customers.filter(c => c.status === 'inactive').length,
      blocked: customers.filter(c => c.status === 'blocked').length,
      totalSpent: customers.reduce((sum, c) => sum + (parseFloat(c.totalSpent) || 0), 0),
      averageOrderValue: 0
    };

    const totalOrders = customers.reduce((sum, c) => sum + (parseInt(c.totalOrders) || 0), 0);
    if (totalOrders > 0) {
      stats.averageOrderValue = stats.totalSpent / totalOrders;
    }

    return stats;
  }

  // Helper method to parse addresses from JSON string
  parseAddresses(addressesString) {
    try {
      return JSON.parse(addressesString || '[]');
    } catch (error) {
      return [];
    }
  }

  // Method to update customer stats (called from order processing)
  async updateStats(customerId, orderAmount) {
    const customer = await this.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const updateData = {
      totalOrders: (parseInt(customer.totalOrders) || 0) + 1,
      totalSpent: (parseFloat(customer.totalSpent) || 0) + orderAmount,
      lastOrderDate: new Date().toISOString()
    };

    return await this.update(customerId, updateData);
  }
}

module.exports = new CustomerSheetsDAO();
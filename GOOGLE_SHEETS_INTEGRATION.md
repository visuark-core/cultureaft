# Google Sheets Integration Guide

This guide explains how to set up and use Google Sheets as a data storage solution for your application, reducing dependency on MongoDB.

## Overview

The Google Sheets integration provides:
- **Complete data storage** for customers, products, orders, and admin users
- **Real-time synchronization** with Google Sheets
- **Fallback support** to MongoDB when needed
- **Data migration tools** to move from MongoDB to Google Sheets
- **Admin dashboard** to monitor data source status

## Features

### ✅ Supported Data Types
- **Customers**: Complete customer profiles with addresses and preferences
- **Products**: Full product catalog with images, pricing, and inventory
- **Orders**: Order management with payment and shipping details
- **Admin Users**: Admin user management with roles and permissions

### ✅ Key Capabilities
- **CRUD Operations**: Create, Read, Update, Delete operations
- **Search & Filtering**: Advanced search and filtering capabilities
- **Analytics**: Revenue, order, and customer analytics
- **Data Validation**: Input validation and error handling
- **Pagination**: Efficient data pagination for large datasets

## Setup Instructions

### Step 1: Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Sheets API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details
   - Click "Create and Continue"

4. **Generate Service Account Key**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create New Key"
   - Select "JSON" format
   - Download the key file

### Step 2: Project Setup

1. **Install Dependencies**
   ```bash
   # Dependencies are already included in package.json
   npm install
   ```

2. **Create Credentials File**
   ```bash
   # Generate template
   npm run setup-sheets template
   
   # Copy your downloaded JSON key to:
   cp /path/to/your/service-account-key.json server/config/google-credentials.json
   ```

3. **Create Google Spreadsheet**
   ```bash
   # This will create a new spreadsheet with proper structure
   npm run setup-sheets create
   ```

4. **Update Environment Variables**
   ```bash
   # Add to server/.env
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_from_step_3
   GOOGLE_SHEETS_CREDENTIALS_PATH=./server/config/google-credentials.json
   USE_GOOGLE_SHEETS=true
   FALLBACK_TO_MONGO=false
   ```

### Step 3: Data Migration

1. **Validate Setup**
   ```bash
   npm run validate-sheets
   ```

2. **Migrate Existing Data**
   ```bash
   npm run migrate-to-sheets
   ```

3. **Verify Migration**
   - Check your Google Spreadsheet
   - Use the admin dashboard to verify data

## Usage

### Backend API

The application automatically uses Google Sheets when configured. All existing API endpoints work the same way:

```javascript
// Example: Fetch all customers
GET /api/data/customers

// Example: Create a new product
POST /api/data/products
{
  "name": "Handcrafted Vase",
  "category": "Home Decor",
  "price": 2500,
  "sku": "HV001",
  "description": "Beautiful handcrafted ceramic vase"
}
```

### Frontend Integration

Use the provided data service in your React components:

```typescript
import dataService from '../services/dataService';

// Fetch customers
const customers = await dataService.getAllCustomers();

// Create a new order
const order = await dataService.createOrder({
  customerId: 'CUST_123',
  items: [{ productId: 'PROD_456', quantity: 2, price: 1000 }],
  totalAmount: 2000
});

// Get analytics
const analytics = await dataService.getAnalytics({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

### Data Source Status Component

Monitor your data sources using the status component:

```typescript
import DataSourceStatus from '../components/DataSourceStatus';

function AdminDashboard() {
  return (
    <div>
      <DataSourceStatus />
      {/* Other dashboard components */}
    </div>
  );
}
```

## Data Structure

### Google Sheets Structure

The integration creates 4 main sheets:

1. **Customers Sheet**
   - Customer profiles, addresses, preferences
   - Order history and statistics

2. **Products Sheet**
   - Product catalog with full details
   - Inventory management
   - SEO and metadata

3. **Orders Sheet**
   - Complete order information
   - Payment and shipping details
   - Order timeline and status

4. **AdminUsers Sheet**
   - Admin user accounts
   - Roles and permissions
   - Security and audit information

### Data Serialization

Complex data types are automatically serialized:
- **Arrays**: JSON stringified (e.g., product images, customer addresses)
- **Objects**: Flattened with dot notation (e.g., `customer.preferences.newsletter`)
- **Dates**: ISO string format
- **Numbers**: String representation for sheets compatibility

## Advanced Configuration

### Environment Variables

```bash
# Required
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_CREDENTIALS_PATH=./server/config/google-credentials.json

# Optional
USE_GOOGLE_SHEETS=true                    # Use Google Sheets as primary data source
FALLBACK_TO_MONGO=false                   # Enable MongoDB fallback
```

### Custom Sheet Configuration

You can customize sheet names and headers by modifying the DAO classes:

```javascript
// server/services/sheets/CustomerSheetsDAO.js
constructor() {
  this.sheetName = 'CustomCustomers';  // Custom sheet name
  this.headers = [...];                 // Custom headers
}
```

### Performance Optimization

1. **Batch Operations**: Use batch updates for multiple records
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Pagination**: Use built-in pagination for large datasets
4. **Indexing**: Leverage Google Sheets built-in search capabilities

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```
   Error: Google Sheets credentials file not found
   ```
   - Ensure credentials file exists at the specified path
   - Verify service account has proper permissions

2. **Permission Errors**
   ```
   Error: The caller does not have permission
   ```
   - Share the spreadsheet with your service account email
   - Grant "Editor" permissions to the service account

3. **API Quota Exceeded**
   ```
   Error: Quota exceeded for quota metric 'Read requests'
   ```
   - Implement caching to reduce API calls
   - Consider upgrading your Google Cloud plan

4. **Data Validation Errors**
   ```
   Error: Invalid data format
   ```
   - Check data types match expected formats
   - Verify required fields are provided

### Debug Commands

```bash
# Validate Google Sheets setup
npm run validate-sheets

# Check data source status
curl http://localhost:5000/api/data/status

# Clear sheets data (keeps headers)
npm run setup-sheets clear

# Re-migrate data
npm run migrate-to-sheets
```

### Logging

Enable detailed logging by setting:

```bash
LOG_LEVEL=debug
```

## Migration from MongoDB

### Pre-Migration Checklist

- [ ] Google Sheets setup completed
- [ ] Service account configured
- [ ] Spreadsheet created and accessible
- [ ] Environment variables set
- [ ] Backup existing MongoDB data

### Migration Process

1. **Backup Current Data**
   ```bash
   mongodump --db your_database_name --out ./backup
   ```

2. **Run Migration**
   ```bash
   npm run migrate-to-sheets
   ```

3. **Validate Migration**
   ```bash
   npm run validate-sheets
   ```

4. **Switch Data Source**
   ```bash
   # Update .env
   USE_GOOGLE_SHEETS=true
   FALLBACK_TO_MONGO=false
   ```

5. **Test Application**
   - Verify all CRUD operations work
   - Check analytics and reporting
   - Test admin dashboard functionality

### Rollback Plan

If you need to rollback to MongoDB:

1. **Update Environment**
   ```bash
   USE_GOOGLE_SHEETS=false
   FALLBACK_TO_MONGO=true
   ```

2. **Restore MongoDB Data**
   ```bash
   mongorestore --db your_database_name ./backup/your_database_name
   ```

## Performance Considerations

### Google Sheets Limits

- **API Quotas**: 300 requests per minute per project
- **Cell Limits**: 10 million cells per spreadsheet
- **Sheet Limits**: 200 sheets per spreadsheet
- **Row Limits**: 1,000,000 rows per sheet

### Optimization Strategies

1. **Batch Operations**: Group multiple operations together
2. **Caching**: Cache frequently accessed data
3. **Pagination**: Implement proper pagination
4. **Async Processing**: Use background jobs for heavy operations

## Security

### Best Practices

1. **Service Account Security**
   - Use dedicated service accounts
   - Rotate keys regularly
   - Limit permissions to minimum required

2. **Data Protection**
   - Enable encryption in transit
   - Implement proper access controls
   - Regular security audits

3. **Environment Security**
   - Keep credentials out of version control
   - Use environment variables
   - Secure server access

## Support

### Getting Help

1. **Documentation**: Check this guide and inline code comments
2. **Logs**: Enable debug logging for detailed information
3. **Status Dashboard**: Use the admin dashboard to monitor data sources
4. **Google Sheets API**: Refer to [Google Sheets API documentation](https://developers.google.com/sheets/api)

### Contributing

To contribute improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Conclusion

The Google Sheets integration provides a robust, scalable alternative to traditional databases while maintaining all the functionality of your application. With proper setup and configuration, you can reduce infrastructure complexity while gaining the benefits of Google's reliable cloud platform.

For additional support or questions, please refer to the project documentation or create an issue in the repository.
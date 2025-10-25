# Migration Guide: MongoDB to Google Sheets (Hybrid Approach)

This guide explains how to migrate your Culturaft application from MongoDB-only to a hybrid approach using both MongoDB and Google Sheets.

## Overview

After migration, your data will be stored as follows:

### Google Sheets (Primary Data)
- **Customer Data**: All customer profiles, addresses, preferences
- **Order Data**: All order information, items, shipping, payment status
- **Product Data**: All product catalog, inventory, pricing

### MongoDB (Authentication & Admin)
- **User Authentication**: Login credentials, session tokens, security data
- **Admin Users**: Complete admin profiles, roles, permissions
- **Analytics**: Event tracking, user behavior data
- **Audit Logs**: Security logs, admin actions, compliance data

## Prerequisites

1. **Google Sheets Setup**: Ensure you have a Google Sheets spreadsheet configured with proper service account access
2. **MongoDB Backup**: Create a full backup of your MongoDB database before migration
3. **Environment Variables**: Update your `.env` file with Google Sheets credentials

## Migration Steps

### Step 1: Backup Your Data

```bash
# Create MongoDB backup
mongodump --uri="your_mongodb_connection_string" --out=./backup

# Or using MongoDB Compass/Atlas backup features
```

### Step 2: Configure Google Sheets

1. Create a new Google Spreadsheet
2. Set up a Google Service Account with Sheets API access
3. Share the spreadsheet with your service account email
4. Update your `server/.env` file:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
```

### Step 3: Run the Migration

```bash
cd server
npm run migrate-to-sheets-only
```

The migration script will:
1. Create Google Sheets for Customers, Orders, and Products
2. Migrate all customer data to Google Sheets
3. Migrate all order data to Google Sheets  
4. Migrate all product data to Google Sheets
5. Create UserAuth records for authentication
6. Keep admin users, analytics, and audit logs in MongoDB

### Step 4: Verify Migration

```bash
# Check migration report
cat server/logs/migration-report.json

# Test the application
npm run dev
```

### Step 5: Update Application Code

The migration automatically updates your services to use the hybrid approach. No additional code changes are needed.

## What Changes After Migration

### Data Access Patterns

**Before Migration:**
```javascript
// All data from MongoDB
const customers = await Customer.find({});
const orders = await Order.find({});
const products = await Product.find({});
```

**After Migration:**
```javascript
// Data from Google Sheets via DataService
const customers = await dataService.findAllCustomers();
const orders = await dataService.findAllOrders();
const products = await dataService.findAllProducts();

// Admin data still from MongoDB
const adminUsers = await dataService.findAllAdminUsers();
```

### Authentication Flow

**Before Migration:**
- User credentials stored in Customer/AdminUser models
- Profile data in same models

**After Migration:**
- User credentials stored in UserAuth model (MongoDB)
- Customer profiles stored in Google Sheets
- Admin profiles stored in AdminUser model (MongoDB)

## Benefits of Hybrid Approach

### Google Sheets Benefits
- **Easy Data Management**: Non-technical users can view/edit customer and order data
- **Real-time Collaboration**: Multiple team members can work with data simultaneously
- **Built-in Analytics**: Use Google Sheets functions for quick analysis
- **Cost Effective**: No database hosting costs for primary data

### MongoDB Benefits (Retained)
- **Security**: Authentication data remains in secure database
- **Performance**: Fast queries for admin operations and analytics
- **Compliance**: Audit logs maintained in secure, immutable format
- **Complex Operations**: Admin permissions and role management

## Troubleshooting

### Common Issues

1. **Google Sheets API Limits**
   - Solution: Implement rate limiting and batch operations
   - Monitor API usage in Google Cloud Console

2. **Data Sync Issues**
   - Solution: Use the data validation script
   ```bash
   npm run validate-sheets
   ```

3. **Authentication Problems**
   - Ensure service account has proper permissions
   - Check that spreadsheet is shared with service account email

4. **Migration Failures**
   - Check the migration report in `server/logs/migration-report.json`
   - Review error logs for specific issues
   - Restore from backup if needed

### Data Validation

Run the data integrity check:

```javascript
const dataService = require('./services/dataService');
const report = await dataService.validateDataIntegrity();
console.log(report);
```

## Rollback Plan

If you need to rollback to MongoDB-only:

1. **Restore MongoDB Backup**
   ```bash
   mongorestore --uri="your_mongodb_connection_string" ./backup
   ```

2. **Update Environment Variables**
   ```env
   USE_GOOGLE_SHEETS=false
   ```

3. **Restart Application**
   ```bash
   npm restart
   ```

## Performance Considerations

### Google Sheets Limitations
- **Rate Limits**: 300 requests per minute per project
- **Cell Limits**: 10 million cells per spreadsheet
- **Concurrent Users**: 100 simultaneous connections

### Optimization Strategies
- **Batch Operations**: Group multiple updates into single API calls
- **Caching**: Implement Redis caching for frequently accessed data
- **Pagination**: Use pagination for large datasets
- **Indexing**: Maintain proper indexes in remaining MongoDB collections

## Monitoring

### Health Checks
The application includes health check endpoints:

```bash
# Check overall system health
curl http://localhost:5000/api/health

# Check data service health
curl http://localhost:5000/api/data/health
```

### Metrics to Monitor
- Google Sheets API usage
- Response times for data operations
- Error rates for sheet operations
- MongoDB performance for auth/admin operations

## Security Considerations

### Google Sheets Security
- Service account credentials are sensitive - store securely
- Regularly rotate service account keys
- Monitor access logs in Google Cloud Console
- Implement proper error handling to avoid data leaks

### MongoDB Security (Retained)
- Authentication data remains encrypted
- Session tokens properly managed
- Audit logs maintained for compliance
- Admin permissions preserved

## Support

If you encounter issues during migration:

1. Check the migration logs in `server/logs/`
2. Review the troubleshooting section above
3. Ensure all prerequisites are met
4. Test with a small dataset first

## Next Steps

After successful migration:

1. **Monitor Performance**: Watch for any performance issues
2. **Train Team**: Educate team members on new data access patterns
3. **Backup Strategy**: Implement regular backups for both MongoDB and Google Sheets
4. **Documentation**: Update your team documentation with new processes

The hybrid approach gives you the best of both worlds - easy data management with Google Sheets while maintaining security and performance for critical operations with MongoDB.
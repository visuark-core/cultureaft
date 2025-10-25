# Admin Panel Setup and Usage

## Accessing the Admin Panel (No Authentication Required)

1. Start both the frontend and backend servers:
   ```bash
   # Backend (from server directory)
   cd server
   node server.js

   # Frontend (from root directory)
   npm run dev
   ```

2. Navigate to the admin orders page:
   ```
   http://localhost:5173/admin/orders
   ```

3. You can now directly access and manage orders without any login required.

## Features Available

- **Order Management**: View, filter, and manage customer orders
- **Real-time Updates**: Orders are updated in real-time
- **Export Functionality**: Export orders to CSV
- **Bulk Operations**: Update multiple orders at once
- **Order Details**: View detailed information for each order

## Troubleshooting

### Cannot See Orders
- Ensure both frontend and backend servers are running
- Check that you're logged in with the correct admin credentials
- Verify that orders exist in the Google Sheets database

### Access Issues
- Make sure the backend server is running on port 5000
- Ensure authentication bypass is enabled (`BYPASS_ADMIN_AUTH=true` in server/.env)

### API Errors
- Check the browser console for detailed error messages
- Verify the backend logs for any server-side errors
- Ensure the Google Sheets integration is properly configured

## Technical Details

- **Backend**: Node.js with Express, MongoDB, Google Sheets integration
- **Frontend**: React with TypeScript, Vite
- **Authentication**: Disabled for development (bypass enabled)
- **Data Storage**: Google Sheets with MongoDB fallback
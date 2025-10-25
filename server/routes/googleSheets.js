const express = require('express');
const googleSheetsService = require('../services/googleSheetsService');
const customerDAO = require('../services/sheets/CustomerSheetsDAO');
const productDAO = require('../services/sheets/ProductSheetsDAO');
const { verifyToken } = require('../middleware/auth');
const { validateRequest } = require('../utils/validation');

const router = express.Router();

// Middleware to check if Google Sheets is configured
const checkGoogleSheetsConfig = async (req, res, next) => {
  try {
    // Check if we can access the spreadsheet
    await googleSheetsService.getSheetMetadata();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Google Sheets service is unavailable',
      error: error.message
    });
  }
};

// Add customer to Google Sheets
router.post('/customers', verifyToken, checkGoogleSheetsConfig, async (req, res) => {
  try {
    const customerData = req.body;
    
    // Validate required fields
    if (!customerData.email || !customerData.firstName || !customerData.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required customer data fields'
      });
    }

    const customer = await customerDAO.create(customerData);
    
    res.json({
      success: true,
      message: 'Customer added to Google Sheets successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error adding customer to Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update customer in Google Sheets
router.put('/customers/:id', verifyToken, checkGoogleSheetsConfig, async (req, res) => {
  try {
    const { id } = req.params;
    const customerData = req.body;
    
    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required for update'
      });
    }

    const customer = await customerDAO.update(id, customerData);
    
    res.json({
      success: true,
      message: 'Customer updated in Google Sheets successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer in Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all customers from Google Sheets
router.get('/customers', verifyToken, checkGoogleSheetsConfig, async (req, res) => {
  try {
    const customers = await customerDAO.findAll();
    
    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Error getting customers from Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers from Google Sheets',
      error: error.message
    });
  }
});

// Delete customer from Google Sheets
router.delete('/customers/:id', verifyToken, checkGoogleSheetsConfig, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID parameter is required'
      });
    }

    await customerDAO.delete(id);
    
    res.json({
      success: true,
      message: 'Customer deleted from Google Sheets successfully'
    });
  } catch (error) {
    console.error('Error deleting customer from Google Sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Health check endpoint for Google Sheets
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    await googleSheetsService.getSheetMetadata();
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Google Sheets service is healthy',
      responseTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Google Sheets health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Check Google Sheets connection status
router.get('/status', verifyToken, async (req, res) => {
  try {
    await googleSheetsService.getSheetMetadata();
    
    res.json({
      success: true,
      data: {
        isConnected: true,
        service: 'Google Sheets',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        isConnected: false,
        service: 'Google Sheets',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
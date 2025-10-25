const express = require('express');
const router = express.Router();
const healthMonitor = require('../services/healthMonitorService');
const ConfigValidator = require('../services/ConfigValidator');

/**
 * @route   GET /api/health
 * @desc    Get a detailed health report of all monitored services
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const report = await healthMonitor.getHealthReport();
    if (report.overallStatus !== 'healthy') {
      return res.status(503).json(report);
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({
      overallStatus: 'unhealthy',
      error: 'An unexpected error occurred while generating the health report.',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/health/config
 * @desc    Get configuration validation status and report
 * @access  Public
 */
router.get('/config', (req, res) => {
  try {
    const configStatus = ConfigValidator.getConfigurationStatus();
    
    // Return appropriate HTTP status based on configuration status
    const statusCode = configStatus.status === 'failed' ? 503 : 
                      configStatus.status === 'error' ? 500 : 200;
    
    res.status(statusCode).json({
      timestamp: new Date().toISOString(),
      service: 'configuration-validator',
      ...configStatus,
      message: configStatus.status === 'passed' ? 
        'All configuration validations passed' :
        configStatus.status === 'failed' ?
        'Configuration validation failed - check errors' :
        'Configuration validation encountered an error'
    });
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      service: 'configuration-validator',
      status: 'error',
      errors: [error.message],
      warnings: [],
      configuredServices: 0,
      message: 'Failed to retrieve configuration status'
    });
  }
});

module.exports = router;
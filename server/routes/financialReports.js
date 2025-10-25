const express = require('express');
const financialReportingService = require('../services/financialReportingService');
const router = express.Router();

/**
 * GET /api/financial-reports/summary
 * Generates a financial summary report for a given period.
 */
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
        error: 'MISSING_DATE_RANGE'
      });
    }

    const report = await financialReportingService.generateFinancialReport(new Date(startDate), new Date(endDate));

    if (!report.success) {
      return res.status(500).json({
        success: false,
        message: report.message,
        error: report.error
      });
    }

    res.json(report);

  } catch (error) {
    console.error('Error in financial reports summary endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/financial-reports/reconciliation
 * Performs payment reconciliation for a given period.
 */
router.get('/reconciliation', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
        error: 'MISSING_DATE_RANGE'
      });
    }

    const reconciliation = await financialReportingService.reconcilePayments(new Date(startDate), new Date(endDate));

    if (!reconciliation.success) {
      return res.status(500).json({
        success: false,
        message: reconciliation.message,
        error: reconciliation.error
      });
    }

    res.json(reconciliation);

  } catch (error) {
    console.error('Error in financial reports reconciliation endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;
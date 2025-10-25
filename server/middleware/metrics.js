const { logManager, performanceMonitor } = require('../utils/logger');

const metricsMiddleware = (req, res, next) => {
  const correlationId = logManager.generateCorrelationId();
  logManager.setCorrelationId(correlationId);
  res.setHeader('X-Correlation-ID', correlationId);

  const timerName = `${req.method} ${req.originalUrl}`;
  performanceMonitor.start(timerName);

  res.on('finish', () => {
    performanceMonitor.end(timerName);
    logManager.info('Request processed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      correlationId,
    });
  });

  next();
};

module.exports = metricsMiddleware;
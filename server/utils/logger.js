const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const crypto = require('crypto');

// Sanitize sensitive keys from logs
const sensitiveKeys = ['password', 'token', 'creditCard', 'cvv', 'authorization'];

const sanitize = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitizedData = { ...data };
  for (const key in sanitizedData) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitizedData[key] = 'REDACTED';
    } else if (typeof sanitizedData[key] === 'object') {
      sanitizedData[key] = sanitize(sanitizedData[key]);
    }
  }
  return sanitizedData;
};

const logFormat = printf(({ level, message, timestamp, correlationId, ...metadata }) => {
  let log = `${timestamp} [${level}]`;
  if (correlationId) {
    log += ` [${correlationId}]`;
  }
  log += `: ${message}`;
  if (Object.keys(metadata).length) {
    log += ` ${JSON.stringify(sanitize(metadata))}`;
  }
  return log;
});

class LogManager {
  constructor() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        colorize(),
        timestamp(),
        logFormat
      ),
      transports: [new transports.Console()],
      exitOnError: false,
    });
  }

  generateCorrelationId() {
    return crypto.randomBytes(16).toString('hex');
  }

  info(message, metadata = {}) {
    this.logger.info(message, sanitize(metadata));
  }

  warn(message, metadata = {}) {
    this.logger.warn(message, sanitize(metadata));
  }

  error(message, error, metadata = {}) {
    const sanitizedMeta = sanitize(metadata);
    if (error instanceof Error) {
      this.logger.error(message, { ...sanitizedMeta, error: { message: error.message, stack: error.stack } });
    } else {
      this.logger.error(message, { ...sanitizedMeta, error });
    }
  }

  setCorrelationId(id) {
    // This is a simple way to handle correlation ID for a single instance.
    // In a real-world scenario, you'd use something like AsyncLocalStorage to handle this per-request.
    this.correlationId = id;
    this.logger.defaultMeta = { ...this.logger.defaultMeta, correlationId: id };
  }
}

// Performance monitoring utility
class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.timers = new Map();
    }

    start(timerName) {
        this.timers.set(timerName, process.hrtime());
        this.logger.info(`Performance timer started for: ${timerName}`);
    }

    end(timerName) {
        const startTime = this.timers.get(timerName);
        if (startTime) {
            const endTime = process.hrtime(startTime);
            const duration = (endTime[0] * 1e9 + endTime[1]) / 1e6; // in milliseconds
            this.logger.info(`Performance timer ended for: ${timerName}. Duration: ${duration.toFixed(2)}ms`);
            this.timers.delete(timerName);
            return duration;
        }
        this.logger.warn(`Performance timer '${timerName}' was not started.`);
        return null;
    }
}


const logManager = new LogManager();
const performanceMonitor = new PerformanceMonitor(logManager);


module.exports = {
    logManager,
    performanceMonitor
};
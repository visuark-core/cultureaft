/**
 * Logging utility with 4 log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  orderId?: string;
  paymentId?: string;
  error?: Error;
  stack?: string;
}

export interface SecurityLogEntry extends LogEntry {
  ipAddress?: string;
  userAgent?: string;
  action: string;
  result: 'success' | 'failure' | 'suspicious';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.logLevel = LogLevel.DEBUG; // Use DEBUG in development
    } else if (import.meta.env.MODE === 'staging') {
      this.logLevel = LogLevel.INFO; // Use INFO in staging
    } else {
      this.logLevel = LogLevel.WARN; // Use WARN in production
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error,
    metadata?: Partial<LogEntry>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      error,
      stack: error?.stack,
      sessionId: this.sessionId,
      ...metadata
    };
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = [
      'password', 'secret', 'key', 'token', 'signature', 'cvv', 'cardNumber',
      'signature'
    ];

    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 4) {
          sanitized[key] = sanitized[key].substring(0, 4) + '*'.repeat(sanitized[key].length - 4);
        } else {
          sanitized[key] = '***REDACTED***';
        }
      }
    });

    return sanitized;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (import.meta.env.DEV) {
      this.outputToConsole(entry);
    }

    // Send to external logging service in production
    if (import.meta.env.PROD && entry.level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.category}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.error || entry.data);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // This would typically send to a logging service like Sentry, LogRocket, etc.
      // For now, we'll just store it locally or send to our backend
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        console.error('Failed to send log to external service:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending log to external service:', error);
    }
  }

  // Public logging methods
  debug(category: string, message: string, data?: any, metadata?: Partial<LogEntry>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, category, message, data, undefined, metadata);
      this.addLog(entry);
    }
  }

  info(category: string, message: string, data?: any, metadata?: Partial<LogEntry>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, category, message, data, undefined, metadata);
      this.addLog(entry);
    }
  }

  warn(category: string, message: string, data?: any, metadata?: Partial<LogEntry>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, category, message, data, undefined, metadata);
      this.addLog(entry);
    }
  }

  error(category: string, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, category, message, data, error, metadata);
      this.addLog(entry);
    }
  }

  // Security-specific logging
  security(
    action: string,
    result: 'success' | 'failure' | 'suspicious',
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    data?: any,
    metadata?: Partial<SecurityLogEntry>
  ): void {
    const securityEntry: SecurityLogEntry = {
      ...this.createLogEntry(LogLevel.WARN, 'SECURITY', message, data, undefined, metadata),
      action,
      result,
      riskLevel,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.addLog(securityEntry);

    // Always send security logs to external service
    if (import.meta.env.PROD) {
      this.sendToExternalService(securityEntry);
    }
  }

  // Payment-specific logging methods
  paymentStarted(orderId: string, amount: number, data?: any): void {
    this.info('PAYMENT', 'Payment process initiated', {
      orderId,
      amount,
      ...data
    }, { orderId });
  }

  paymentSuccess(orderId: string, paymentId: string, amount: number, data?: any): void {
    this.info('PAYMENT', 'Payment completed successfully', {
      orderId,
      paymentId,
      amount,
      ...data
    }, { orderId, paymentId });
  }

  paymentFailed(orderId: string, error: Error, data?: any): void {
    this.error('PAYMENT', 'Payment failed', error, {
      orderId,
      ...data
    }, { orderId });
  }

  paymentVerificationStarted(orderId: string, paymentId: string): void {
    this.info('PAYMENT_VERIFICATION', 'Payment verification started', {
      orderId,
      paymentId
    }, { orderId, paymentId });
  }

  paymentVerificationSuccess(orderId: string, paymentId: string): void {
    this.info('PAYMENT_VERIFICATION', 'Payment verification successful', {
      orderId,
      paymentId
    }, { orderId, paymentId });
  }

  paymentVerificationFailed(orderId: string, paymentId: string, error: Error): void {
    this.error('PAYMENT_VERIFICATION', 'Payment verification failed', error, {
      orderId,
      paymentId
    }, { orderId, paymentId });

    // Log as security event for signature verification failures
    this.security(
      'payment_verification',
      'failure',
      'high',
      'Payment signature verification failed',
      { orderId, paymentId }
    );
  }

  // Utility methods
  private getClientIP(): string {
    // This would typically be handled by the backend
    // For frontend, we can't reliably get the real IP
    return 'client-side';
  }

  getLogs(category?: string, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs;

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    return filteredLogs.slice(); // Return a copy
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions for all log levels
export const logTrace = (category: string, message: string, data?: any, metadata?: Partial<LogEntry>) => 
  logger.trace(category, message, data, metadata);

export const logDebug = (category: string, message: string, data?: any, metadata?: Partial<LogEntry>) => 
  logger.debug(category, message, data, metadata);

export const logInfo = (category: string, message: string, data?: any, metadata?: Partial<LogEntry>) => 
  logger.info(category, message, data, metadata);

export const logNotice = (category: string, message: string, data?: any, metadata?: Partial<LogEntry>) => 
  logger.notice(category, message, data, metadata);

export const logWarn = (category: string, message: string, data?: any, metadata?: Partial<LogEntry>) => 
  logger.warn(category, message, data, metadata);

export const logWarning = (category: string, message: string, data?: any, metadata?: Partial<LogEntry>) => 
  logger.warning(category, message, data, metadata);

export const logError = (category: string, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>) => 
  logger.error(category, message, error, data, metadata);

export const logSevere = (category: string, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>) => 
  logger.severe(category, message, error, data, metadata);

export const logCritical = (category: string, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>) => 
  logger.critical(category, message, error, data, metadata);

export const logAlert = (category: string, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>) => 
  logger.alert(category, message, error, data, metadata);

export const logEmergency = (category: string, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>) => 
  logger.emergency(category, message, error, data, metadata);

export const logFatal = (category: string, message: string, error?: Error, data?: any, metadata?: Partial<LogEntry>) => 
  logger.fatal(category, message, error, data, metadata);

export const logVerbose = (category: string, message: string, data?: any, metadata?: Partial<LogEntry>) => 
  logger.verbose(category, message, data, metadata);

export const logSilly = (category: string, message: string, data?: any, metadata?: Partial<LogEntry>) => 
  logger.silly(category, message, data, metadata);

// Payment-specific convenience functions
export const logPaymentStarted = (orderId: string, amount: number, data?: any) => 
  logger.paymentStarted(orderId, amount, data);

export const logPaymentSuccess = (orderId: string, paymentId: string, amount: number, data?: any) => 
  logger.paymentSuccess(orderId, paymentId, amount, data);

export const logPaymentFailed = (orderId: string, error: Error, data?: any) => 
  logger.paymentFailed(orderId, error, data);

export const logPaymentVerificationStarted = (orderId: string, paymentId: string) => 
  logger.paymentVerificationStarted(orderId, paymentId);

export const logPaymentVerificationSuccess = (orderId: string, paymentId: string) => 
  logger.paymentVerificationSuccess(orderId, paymentId);

export const logPaymentVerificationFailed = (orderId: string, paymentId: string, error: Error) => 
  logger.paymentVerificationFailed(orderId, paymentId, error);

export const logSecurityEvent = (
  action: string,
  result: 'success' | 'failure' | 'suspicious',
  riskLevel: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  data?: any
) => logger.security(action, result, riskLevel, message, data);

export default logger;
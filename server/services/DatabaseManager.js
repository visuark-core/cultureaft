const mongoose = require('mongoose');
const { logManager: logger } = require('../utils/logger');

class DatabaseManager {
  constructor(dbUri) {
    this.dbUri = dbUri;
    this.connection = null;
    this.retryAttempts = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect() {
    if (this.connection) {
      return;
    }

    try {
      await this.attemptConnection(0);
    } catch (error) {
      logger.error('Failed to connect to MongoDB after multiple retries.', { error: error.message });
      process.exit(1); // Exit the process if DB connection fails
    }
  }

  async attemptConnection(attempt) {
    try {
      this.connection = await mongoose.connect(this.dbUri);

      this.setupEventListeners();
      logger.info('MongoDB connected successfully.');
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt + 1} failed.`, { error: error.message });
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        logger.info(`Retrying connection in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.attemptConnection(attempt + 1);
      }
      throw error;
    }
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to DB.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from DB.');
    });
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected.');
    }
  }
}

module.exports = DatabaseManager;
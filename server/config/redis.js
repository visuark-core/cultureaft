const Redis = require('ioredis');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 0, // Don't retry if Redis is disabled
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  retryDelayOnFailover: 100,
};

// Create Redis clients
let redisClient = null;
let redisPubSub = null;
let redisSubscriber = null;

/**
 * Initialize Redis connections
 */
function initializeRedis() {
  // Check if Redis should be disabled for development
  if (process.env.DISABLE_REDIS === 'true') {
    console.log('Redis disabled via DISABLE_REDIS=true, pub/sub functionality disabled');
    redisClient = null;
    redisPubSub = null;
    redisSubscriber = null;
    return { redisClient: null, redisPubSub: null, redisSubscriber: null };
  }

  try {
    // Main Redis client for caching
    redisClient = new Redis(redisConfig);
    
    // Redis client for pub/sub publishing
    redisPubSub = new Redis(redisConfig);
    
    // Redis client for pub/sub subscribing
    redisSubscriber = new Redis(redisConfig);

    // Event handlers for main client
    redisClient.on('connect', () => {
      console.log('✅ Redis client connected');
    });

    redisClient.on('error', (error) => {
      console.error('❌ Redis client error:', error.message);
      console.log('⚠️ Redis functionality will be limited');
    });

    redisClient.on('close', () => {
      console.log('⚠️ Redis client connection closed');
    });

    // Event handlers for pub/sub client
    redisPubSub.on('connect', () => {
      console.log('✅ Redis pub/sub client connected');
    });

    redisPubSub.on('error', (error) => {
      console.error('❌ Redis pub/sub client error:', error.message);
    });

    // Event handlers for subscriber client
    redisSubscriber.on('connect', () => {
      console.log('✅ Redis subscriber client connected');
    });

    redisSubscriber.on('error', (error) => {
      console.error('❌ Redis subscriber client error:', error.message);
    });

    console.log('Redis clients initialized');
    
    return { redisClient, redisPubSub, redisSubscriber };
  } catch (error) {
    console.error('Failed to initialize Redis clients:', error);
    console.log('Redis not available, pub/sub functionality disabled');
    redisClient = null;
    redisPubSub = null;
    redisSubscriber = null;
    return { redisClient: null, redisPubSub: null, redisSubscriber: null };
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  // Return null if Redis is disabled
  if (process.env.DISABLE_REDIS === 'true') {
    return null;
  }
  
  if (!redisClient) {
    const clients = initializeRedis();
    return clients.redisClient;
  }
  return redisClient;
}

/**
 * Get Redis pub/sub client instance
 */
function getRedisPubSub() {
  // Return null if Redis is disabled
  if (process.env.DISABLE_REDIS === 'true') {
    return null;
  }
  
  if (!redisPubSub) {
    const clients = initializeRedis();
    return clients.redisPubSub;
  }
  return redisPubSub;
}

/**
 * Get Redis subscriber client instance
 */
function getRedisSubscriber() {
  // Return null if Redis is disabled
  if (process.env.DISABLE_REDIS === 'true') {
    return null;
  }
  
  if (!redisSubscriber) {
    const clients = initializeRedis();
    return clients.redisSubscriber;
  }
  return redisSubscriber;
}

/**
 * Test Redis connection
 */
async function testRedisConnection() {
  try {
    const client = getRedisClient();
    if (!client) {
      throw new Error('Redis client not initialized');
    }
    
    await client.ping();
    console.log('✅ Redis connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    return false;
  }
}

/**
 * Gracefully close Redis connections
 */
async function closeRedisConnections() {
  try {
    const promises = [];
    
    if (redisClient) {
      promises.push(redisClient.quit());
    }
    
    if (redisPubSub) {
      promises.push(redisPubSub.quit());
    }
    
    if (redisSubscriber) {
      promises.push(redisSubscriber.quit());
    }
    
    await Promise.all(promises);
    console.log('✅ All Redis connections closed gracefully');
  } catch (error) {
    console.error('❌ Error closing Redis connections:', error);
  }
}

/**
 * Check if Redis is available
 */
function isRedisAvailable() {
  try {
    // Return false if Redis is disabled
    if (process.env.DISABLE_REDIS === 'true') {
      return false;
    }
    return redisClient && (redisClient.status === 'ready' || redisClient.status === 'connecting');
  } catch (error) {
    return false;
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  getRedisPubSub,
  getRedisSubscriber,
  testRedisConnection,
  closeRedisConnections,
  isRedisAvailable,
  redisConfig
};
const redis = require('redis');

class SessionManager {
  constructor() {
    this.client = null;
    this.isRedisAvailable = false;
    this.initializeRedis();
  }

  /**
   * Initialize Redis client (optional for session management)
   */
  async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL
        });

        this.client.on('error', (err) => {
          console.warn('Redis Client Error:', err);
          this.isRedisAvailable = false;
        });

        this.client.on('connect', () => {
          console.log('Redis Client Connected');
          this.isRedisAvailable = true;
        });

        await this.client.connect();
      } else {
        console.log('Redis URL not provided, using in-memory session management');
      }
    } catch (error) {
      console.warn('Redis initialization failed, falling back to in-memory storage:', error.message);
      this.isRedisAvailable = false;
    }
  }

  /**
   * Store session data
   * @param {String} key - Session key
   * @param {Object} data - Session data
   * @param {Number} ttl - Time to live in seconds
   */
  async setSession(key, data, ttl = 3600) {
    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.setEx(key, ttl, JSON.stringify(data));
        return true;
      }
      
      // Fallback to in-memory storage (not recommended for production)
      if (!this.memoryStore) {
        this.memoryStore = new Map();
      }
      
      this.memoryStore.set(key, {
        data,
        expires: Date.now() + (ttl * 1000)
      });
      
      return true;
    } catch (error) {
      console.error('Session storage error:', error);
      return false;
    }
  }

  /**
   * Get session data
   * @param {String} key - Session key
   * @returns {Object|null} Session data
   */
  async getSession(key) {
    try {
      if (this.isRedisAvailable && this.client) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      }
      
      // Fallback to in-memory storage
      if (this.memoryStore && this.memoryStore.has(key)) {
        const session = this.memoryStore.get(key);
        
        if (session.expires > Date.now()) {
          return session.data;
        } else {
          this.memoryStore.delete(key);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Session retrieval error:', error);
      return null;
    }
  }

  /**
   * Delete session data
   * @param {String} key - Session key
   */
  async deleteSession(key) {
    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.del(key);
        return true;
      }
      
      // Fallback to in-memory storage
      if (this.memoryStore) {
        this.memoryStore.delete(key);
      }
      
      return true;
    } catch (error) {
      console.error('Session deletion error:', error);
      return false;
    }
  }

  /**
   * Store blacklisted token
   * @param {String} token - JWT token to blacklist
   * @param {Number} ttl - Time to live in seconds
   */
  async blacklistToken(token, ttl = 3600) {
    const key = `blacklist:${token}`;
    return await this.setSession(key, { blacklisted: true }, ttl);
  }

  /**
   * Check if token is blacklisted
   * @param {String} token - JWT token to check
   * @returns {Boolean} True if blacklisted
   */
  async isTokenBlacklisted(token) {
    const key = `blacklist:${token}`;
    const result = await this.getSession(key);
    return result && result.blacklisted === true;
  }

  /**
   * Store failed login attempts
   * @param {String} identifier - IP or email identifier
   * @param {Number} attempts - Number of attempts
   * @param {Number} ttl - Time to live in seconds
   */
  async setFailedAttempts(identifier, attempts, ttl = 3600) {
    const key = `failed_attempts:${identifier}`;
    return await this.setSession(key, { attempts, timestamp: Date.now() }, ttl);
  }

  /**
   * Get failed login attempts
   * @param {String} identifier - IP or email identifier
   * @returns {Object|null} Attempts data
   */
  async getFailedAttempts(identifier) {
    const key = `failed_attempts:${identifier}`;
    return await this.getSession(key);
  }

  /**
   * Clear failed login attempts
   * @param {String} identifier - IP or email identifier
   */
  async clearFailedAttempts(identifier) {
    const key = `failed_attempts:${identifier}`;
    return await this.deleteSession(key);
  }

  /**
   * Store active session info
   * @param {String} adminId - Admin user ID
   * @param {String} sessionId - Session identifier
   * @param {Object} sessionData - Session information
   * @param {Number} ttl - Time to live in seconds
   */
  async setActiveSession(adminId, sessionId, sessionData, ttl = 86400) {
    const key = `session:${adminId}:${sessionId}`;
    return await this.setSession(key, sessionData, ttl);
  }

  /**
   * Get active session info
   * @param {String} adminId - Admin user ID
   * @param {String} sessionId - Session identifier
   * @returns {Object|null} Session information
   */
  async getActiveSession(adminId, sessionId) {
    const key = `session:${adminId}:${sessionId}`;
    return await this.getSession(key);
  }

  /**
   * Delete active session
   * @param {String} adminId - Admin user ID
   * @param {String} sessionId - Session identifier
   */
  async deleteActiveSession(adminId, sessionId) {
    const key = `session:${adminId}:${sessionId}`;
    return await this.deleteSession(key);
  }

  /**
   * Get all active sessions for an admin
   * @param {String} adminId - Admin user ID
   * @returns {Array} Array of active sessions
   */
  async getAdminSessions(adminId) {
    try {
      if (this.isRedisAvailable && this.client) {
        const keys = await this.client.keys(`session:${adminId}:*`);
        const sessions = [];
        
        for (const key of keys) {
          const sessionData = await this.getSession(key);
          if (sessionData) {
            sessions.push({
              sessionId: key.split(':')[2],
              ...sessionData
            });
          }
        }
        
        return sessions;
      }
      
      // Fallback to in-memory storage
      const sessions = [];
      if (this.memoryStore) {
        for (const [key, session] of this.memoryStore.entries()) {
          if (key.startsWith(`session:${adminId}:`) && session.expires > Date.now()) {
            sessions.push({
              sessionId: key.split(':')[2],
              ...session.data
            });
          }
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('Get admin sessions error:', error);
      return [];
    }
  }

  /**
   * Clear all sessions for an admin
   * @param {String} adminId - Admin user ID
   */
  async clearAdminSessions(adminId) {
    try {
      if (this.isRedisAvailable && this.client) {
        const keys = await this.client.keys(`session:${adminId}:*`);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
        return true;
      }
      
      // Fallback to in-memory storage
      if (this.memoryStore) {
        const keysToDelete = [];
        for (const key of this.memoryStore.keys()) {
          if (key.startsWith(`session:${adminId}:`)) {
            keysToDelete.push(key);
          }
        }
        
        keysToDelete.forEach(key => this.memoryStore.delete(key));
      }
      
      return true;
    } catch (error) {
      console.error('Clear admin sessions error:', error);
      return false;
    }
  }

  /**
   * Cleanup expired sessions (for in-memory storage)
   */
  cleanupExpiredSessions() {
    if (!this.memoryStore) return;
    
    const now = Date.now();
    for (const [key, session] of this.memoryStore.entries()) {
      if (session.expires <= now) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client && this.isRedisAvailable) {
      await this.client.quit();
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Cleanup expired sessions every 5 minutes (for in-memory storage)
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);

module.exports = sessionManager;
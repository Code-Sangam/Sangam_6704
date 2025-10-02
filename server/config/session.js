const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./database');

// Session configuration factory
const createSessionConfig = () => {
  // Create session store
  const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Check every 15 minutes
    expiration: 24 * 60 * 60 * 1000, // 24 hours
    extendDefaultFields: (defaults, session) => {
      return {
        ...defaults,
        user_id: session.user ? session.user.id : null,
        ip_address: session.ipAddress || null,
        user_agent: session.userAgent || null,
        last_activity: new Date()
      };
    }
  });

  // Session configuration
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'sangam-alumni-network-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' // CSRF protection
    },
    name: 'sangam.sid', // Custom session name
    
    // Custom session ID generator
    genid: () => {
      const crypto = require('crypto');
      return crypto.randomBytes(32).toString('hex');
    }
  };

  // Additional security in production
  if (process.env.NODE_ENV === 'production') {
    sessionConfig.cookie.secure = true;
    sessionConfig.cookie.sameSite = 'strict';
    
    // Add domain if specified
    if (process.env.SESSION_DOMAIN) {
      sessionConfig.cookie.domain = process.env.SESSION_DOMAIN;
    }
  }

  return { sessionConfig, sessionStore };
};

// Session cleanup utility
const cleanupExpiredSessions = async () => {
  try {
    const { Session } = require('../models');
    const deletedCount = await Session.cleanupExpiredSessions();
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired sessions`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Session cleanup error:', error);
    return 0;
  }
};

// Schedule periodic session cleanup
const scheduleSessionCleanup = () => {
  // Clean up expired sessions every hour
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
  
  // Initial cleanup on startup
  setTimeout(cleanupExpiredSessions, 5000);
};

// Session security utilities
const sessionSecurity = {
  // Regenerate session ID on login
  regenerateOnLogin: (req) => {
    return new Promise((resolve, reject) => {
      const oldSessionData = { ...req.session };
      
      req.session.regenerate((err) => {
        if (err) {
          return reject(err);
        }
        
        // Restore session data
        Object.assign(req.session, oldSessionData);
        resolve();
      });
    });
  },

  // Destroy session securely
  destroySession: (req) => {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(err);
        }
        
        // Clear session cookie
        req.res.clearCookie('sangam.sid');
        resolve();
      });
    });
  },

  // Check for session hijacking
  validateSessionSecurity: (req) => {
    const session = req.session;
    const currentIP = req.ip;
    const currentUserAgent = req.get('User-Agent');

    // Check IP address consistency (allow some flexibility for mobile networks)
    if (session.ipAddress && session.ipAddress !== currentIP) {
      // Log potential session hijacking attempt
      console.warn(`Session IP mismatch for user ${session.user?.id}: ${session.ipAddress} vs ${currentIP}`);
      
      // In production, you might want to invalidate the session
      if (process.env.NODE_ENV === 'production' && process.env.STRICT_SESSION_SECURITY === 'true') {
        return false;
      }
    }

    // Check User-Agent consistency
    if (session.userAgent && session.userAgent !== currentUserAgent) {
      console.warn(`Session User-Agent mismatch for user ${session.user?.id}`);
      
      // Less strict than IP checking
      if (process.env.NODE_ENV === 'production' && process.env.VERY_STRICT_SESSION_SECURITY === 'true') {
        return false;
      }
    }

    return true;
  },

  // Update session activity
  updateActivity: (req) => {
    if (req.session) {
      req.session.lastActivity = new Date();
      req.session.ipAddress = req.ip;
      req.session.userAgent = req.get('User-Agent');
    }
  }
};

// Session middleware factory
const createSessionMiddleware = () => {
  const { sessionConfig, sessionStore } = createSessionConfig();
  
  return {
    middleware: session(sessionConfig),
    store: sessionStore,
    config: sessionConfig
  };
};

module.exports = {
  createSessionConfig,
  createSessionMiddleware,
  cleanupExpiredSessions,
  scheduleSessionCleanup,
  sessionSecurity
};
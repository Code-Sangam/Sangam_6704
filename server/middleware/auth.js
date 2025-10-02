// Authentication middleware for protecting routes
const { User } = require('../models');
const { logger } = require('./errorHandler');
const { sessionSecurity } = require('../config/session');

const requireAuth = async (req, res, next) => {
  try {
    if (!req.session.user) {
      // For API requests, return JSON error
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
      }
      
      // For page requests, redirect to login
      req.session.returnTo = req.originalUrl;
      return res.redirect('/auth/login');
    }
    
    // Verify user still exists and is active
    const user = await User.findByPk(req.session.user.id);
    
    if (!user || !user.is_active) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) logger.error('Session destruction error:', err);
      });
      
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          error: 'Session invalid',
          message: 'Please log in again'
        });
      }
      
      return res.redirect('/auth/login?message=session-expired');
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      if (req.path.startsWith('/api/')) {
        return res.status(423).json({
          error: 'Account locked',
          message: 'Your account is temporarily locked'
        });
      }
      
      req.session.destroy((err) => {
        if (err) logger.error('Session destruction error:', err);
      });
      
      return res.redirect('/auth/login?message=account-locked');
    }
    
    // Update session with fresh user data if needed
    if (req.session.user.email !== user.email || req.session.user.role !== user.role) {
      req.session.user.email = user.email;
      req.session.user.role = user.role;
      req.session.user.emailVerified = user.email_verified;
    }
    
    // Attach user to request for controllers
    req.user = user;
    
    next();
    
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    
    if (req.path.startsWith('/api/')) {
      return res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication'
      });
    }
    
    return res.redirect('/auth/login?message=auth-error');
  }
};

const requireRole = (roles) => {
  // Ensure roles is an array
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }
      
      if (!allowedRoles.includes(req.session.user.role)) {
        logger.warn(`Access denied for user ${req.session.user.email} with role ${req.session.user.role} to ${req.path}`);
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'You do not have permission to access this resource',
          requiredRoles: allowedRoles,
          userRole: req.session.user.role
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('Role authorization error:', error);
      return res.status(500).json({
        error: 'Authorization error'
      });
    }
  };
};

const requireEmailVerification = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }
  
  if (!req.session.user.emailVerified) {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({
        error: 'Email verification required',
        message: 'Please verify your email address to access this resource'
      });
    }
    
    return res.redirect('/auth/verify-email');
  }
  
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    // This middleware doesn't block access but makes user available if logged in
    if (req.session.user) {
      // Verify user still exists
      const user = await User.findByPk(req.session.user.id);
      if (user && user.is_active && !user.isLocked()) {
        req.user = user;
      } else {
        // Clear invalid session silently
        delete req.session.user;
      }
    }
    
    next();
    
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    // Don't block request on error, just continue without user
    next();
  }
};

const requireOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    // Admin can access everything
    if (req.session.user.role === 'admin') {
      return next();
    }
    
    // Check if user owns the resource
    const resourceUserId = req.params.userId || req.body[resourceUserIdField] || req.query[resourceUserIdField];
    
    if (!resourceUserId || parseInt(resourceUserId) !== req.session.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }
    
    next();
  };
};

const sessionActivity = (req, res, next) => {
  // Update session activity using session security utilities
  if (req.session) {
    // Validate session security
    if (!sessionSecurity.validateSessionSecurity(req)) {
      logger.warn('Session security validation failed', {
        userId: req.session.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Destroy potentially compromised session
      return sessionSecurity.destroySession(req)
        .then(() => {
          if (req.path.startsWith('/api/')) {
            return res.status(401).json({
              error: 'Session Security Violation',
              message: 'Session has been terminated for security reasons'
            });
          }
          return res.redirect('/auth/login?message=security-violation');
        })
        .catch(next);
    }
    
    // Update session activity
    sessionSecurity.updateActivity(req);
  }
  
  next();
};

module.exports = {
  requireAuth,
  requireRole,
  requireEmailVerification,
  optionalAuth,
  requireOwnership,
  sessionActivity
};
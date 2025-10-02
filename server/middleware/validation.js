const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { logger } = require('./errorHandler');

// Common validation schemas
const schemas = {
  // User registration validation
  userRegistration: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .max(255)
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
        'string.max': 'Email must be less than 255 characters'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must be less than 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      }),
    
    role: Joi.string()
      .valid('student', 'alumni', 'faculty')
      .required()
      .messages({
        'any.only': 'Role must be one of: student, alumni, faculty',
        'any.required': 'Role is required'
      }),
    
    firstName: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'First name is required',
        'string.max': 'First name must be less than 100 characters',
        'any.required': 'First name is required'
      }),
    
    lastName: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Last name is required',
        'string.max': 'Last name must be less than 100 characters',
        'any.required': 'Last name is required'
      })
  }),

  // User login validation
  userLogin: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      }),
    
    rememberMe: Joi.boolean().optional()
  }),

  // Profile update validation
  profileUpdate: Joi.object({
    firstName: Joi.string().min(1).max(100).optional(),
    lastName: Joi.string().min(1).max(100).optional(),
    bio: Joi.string().max(1000).allow('').optional(),
    company: Joi.string().max(255).allow('').optional(),
    position: Joi.string().max(255).allow('').optional(),
    industry: Joi.string().max(100).allow('').optional(),
    experienceYears: Joi.number().min(0).max(50).optional(),
    university: Joi.string().max(255).allow('').optional(),
    major: Joi.string().max(255).allow('').optional(),
    degree: Joi.string().valid('bachelor', 'master', 'phd', 'diploma', 'certificate', 'other').optional(),
    graduationYear: Joi.number().min(1950).max(new Date().getFullYear() + 10).optional(),
    gpa: Joi.number().min(0).max(4).optional(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('').optional(),
    location: Joi.string().max(255).allow('').optional(),
    timezone: Joi.string().max(50).optional(),
    linkedinUrl: Joi.string().uri().allow('').optional(),
    githubUrl: Joi.string().uri().allow('').optional(),
    twitterUrl: Joi.string().uri().allow('').optional(),
    websiteUrl: Joi.string().uri().allow('').optional(),
    isMentor: Joi.boolean().optional(),
    isSeekingMentor: Joi.boolean().optional(),
    isOpenToOpportunities: Joi.boolean().optional(),
    preferredContactMethod: Joi.string().valid('email', 'phone', 'linkedin', 'platform').optional(),
    skills: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    interests: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    profileVisibility: Joi.string().valid('public', 'alumni_only', 'private').optional(),
    showEmail: Joi.boolean().optional(),
    showPhone: Joi.boolean().optional()
  }),

  // Message validation
  message: Joi.object({
    content: Joi.string()
      .min(1)
      .max(5000)
      .required()
      .messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message must be less than 5000 characters',
        'any.required': 'Message content is required'
      }),
    
    receiverId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Receiver ID must be a number',
        'number.positive': 'Invalid receiver ID',
        'any.required': 'Receiver ID is required'
      }),
    
    messageType: Joi.string()
      .valid('text', 'image', 'file')
      .default('text')
      .optional(),
    
    replyToId: Joi.number().integer().positive().optional()
  }),

  // Password reset validation
  passwordReset: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  }),

  // Password change validation
  passwordChange: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password must be less than 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      }),
    
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'New passwords do not match',
        'any.required': 'New password confirmation is required'
      })
  })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error:', {
        url: req.url,
        method: req.method,
        errors: errors,
        ip: req.ip
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please check your input and try again',
        details: errors
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Rate limiting configurations
const rateLimiters = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Too many requests from this IP, please try again later'
      });
    }
  }),

  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    skipSuccessfulRequests: true,
    message: {
      error: 'Too Many Login Attempts',
      message: 'Too many login attempts, please try again later'
    },
    handler: (req, res) => {
      logger.warn('Auth rate limit exceeded:', {
        ip: req.ip,
        email: req.body.email,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        error: 'Too Many Login Attempts',
        message: 'Too many login attempts from this IP, please try again in 15 minutes'
      });
    }
  }),

  // Message sending rate limiting
  messages: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 messages per minute
    message: {
      error: 'Message Rate Limit',
      message: 'Too many messages sent, please slow down'
    }
  }),

  // File upload rate limiting
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
      error: 'Upload Rate Limit',
      message: 'Too many file uploads, please try again later'
    }
  })
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potential XSS patterns
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and API endpoints with proper authentication
  if (req.method === 'GET' || req.path.startsWith('/api/')) {
    return next();
  }

  const token = req.body._csrf || req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn('CSRF token mismatch:', {
      ip: req.ip,
      url: req.url,
      hasToken: !!token,
      hasSessionToken: !!sessionToken
    });

    return res.status(403).json({
      error: 'CSRF Token Mismatch',
      message: 'Invalid or missing CSRF token'
    });
  }

  next();
};

// Generate CSRF token
const generateCSRFToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    const crypto = require('crypto');
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

module.exports = {
  schemas,
  validate,
  rateLimiters,
  sanitizeInput,
  csrfProtection,
  generateCSRFToken
};
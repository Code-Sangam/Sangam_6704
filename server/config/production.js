// Production Configuration
require('dotenv').config();

const productionConfig = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: true, // Enable if behind reverse proxy
    compression: true,
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", process.env.CDN_URL].filter(Boolean),
          connectSrc: ["'self'", "wss:", "ws:"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // Database Configuration
  database: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false, // Disable SQL logging in production
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET,
    name: 'sangam.sid',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: true, // Require HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    },
    store: {
      checkExpirationInterval: 15 * 60 * 1000, // 15 minutes
      expiration: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  // Redis Configuration (if using Redis for sessions/caching)
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3
  },

  // File Upload Configuration
  upload: {
    destination: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx').split(','),
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
      files: 5,
      fields: 10
    }
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: {
      email: process.env.FROM_EMAIL,
      name: process.env.FROM_NAME || 'Sangam Alumni Network'
    }
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    jwtSecret: process.env.JWT_SECRET,
    rateLimiting: {
      windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    },
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
      optionsSuccessStatus: 200
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'warn',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: '20m',
    maxFiles: '14d',
    format: 'combined'
  },

  // SSL Configuration
  ssl: {
    enabled: process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH,
    cert: process.env.SSL_CERT_PATH,
    key: process.env.SSL_KEY_PATH
  },

  // CDN Configuration
  cdn: {
    enabled: !!process.env.CDN_URL,
    url: process.env.CDN_URL,
    staticUrl: process.env.STATIC_URL || process.env.CDN_URL
  },

  // Monitoring Configuration
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1
    },
    analytics: {
      googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID
    }
  }
};

module.exports = productionConfig;
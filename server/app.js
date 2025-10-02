const express = require('express');
const path = require('path');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');

// Import database configuration
const { sequelize, initializeDatabase } = require('./config/database');

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const chatRoutes = require('./routes/chat');
const profileRoutes = require('./routes/profile');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const { sanitizeInput, generateCSRFToken, rateLimiters } = require('./middleware/validation');

// Import socket handlers
const chatSocket = require('./sockets/chatSocket');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Layout engine setup
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Logging middleware
app.use(morgan('combined'));

// Session configuration with enhanced security
const { createSessionMiddleware, scheduleSessionCleanup } = require('./config/session');
const { middleware: sessionMiddleware, store: sessionStore } = createSessionMiddleware();

app.use(sessionMiddleware);

// Schedule periodic session cleanup
scheduleSessionCleanup();

// Apply global middleware
app.use(rateLimiters.general); // General rate limiting
app.use(sanitizeInput); // Input sanitization
app.use(authMiddleware.sessionActivity); // Session activity tracking
app.use(generateCSRFToken); // CSRF token generation

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/chat', authMiddleware.requireAuth, chatRoutes);
app.use('/profile', authMiddleware.requireAuth, profileRoutes);

// Socket.io setup
chatSocket(io);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Sangam Alumni Network server...');
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Port: ${PORT}`);
    
    // Initialize database connection
    console.log('📊 Initializing database connection...');
    await initializeDatabase();
    console.log('✅ Database connection established');
    
    // Sync session store
    console.log('🔄 Synchronizing session store...');
    await sessionStore.sync();
    console.log('✅ Session store synchronized');
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Sangam Alumni Network server running on port ${PORT}`);
      console.log(`🔗 Server URL: http://0.0.0.0:${PORT}`);
      console.log('✅ Server started successfully');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Give some time for logs to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

// Start the server
startServer();

module.exports = { app, server, io };
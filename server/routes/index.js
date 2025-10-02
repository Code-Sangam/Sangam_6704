const express = require('express');
const router = express.Router();

// Health check route (for debugging)
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cwd: process.cwd(),
    dirname: __dirname
  });
});

// Debug route to check paths
router.get('/debug', (req, res) => {
  const fs = require('fs');
  const path = require('path');

  const viewsPath = path.join(__dirname, '../views');
  const publicPath = path.join(__dirname, '../../public');

  res.json({
    paths: {
      cwd: process.cwd(),
      dirname: __dirname,
      viewsPath: viewsPath,
      publicPath: publicPath,
      viewsExists: fs.existsSync(viewsPath),
      publicExists: fs.existsSync(publicPath)
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  });
});

// Simple test route
router.get('/test', (req, res) => {
  res.send(`
    <h1>🚀 Server is Running!</h1>
    <p>Timestamp: ${new Date().toISOString()}</p>
    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    <p>Working Directory: ${process.cwd()}</p>
    <p><a href="/health">Health Check</a> | <a href="/debug">Debug Info</a></p>
  `);
});

// Homepage route
router.get('/', (req, res) => {
  try {
    res.render('pages/home', {
      title: 'Sangam Alumni Network',
      description: 'Connect with alumni and students from your institution',
      currentPage: 'home'
    });
  } catch (error) {
    console.error('Homepage render error:', error);
    res.status(500).send(`
      <h1>Server Error</h1>
      <p>Error rendering homepage: ${error.message}</p>
      <p>Please check server logs for details.</p>
      <p><a href="/test">Test Page</a> | <a href="/health">Health Check</a></p>
    `);
  }
});

// About page
router.get('/about', (req, res) => {
  res.render('pages/about', {
    title: 'About - Sangam Alumni Network',
    description: 'Learn more about our alumni networking platform',
    currentPage: 'about'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Contact - Sangam Alumni Network',
    description: 'Get in touch with us',
    currentPage: 'contact'
  });
});

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message, newsletter } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !subject || !message) {
      req.session.error = 'All required fields must be filled';
      return res.redirect('/contact');
    }

    // TODO: Send email notification to admin
    // TODO: Save contact form submission to database
    // TODO: Send confirmation email to user

    console.log('Contact form submission:', {
      firstName,
      lastName,
      email,
      subject,
      message: message.substring(0, 100) + '...',
      newsletter: !!newsletter,
      timestamp: new Date()
    });

    req.session.success = 'Thank you for your message! We\'ll get back to you within 24 hours.';
    res.redirect('/contact');

  } catch (error) {
    console.error('Contact form error:', error);
    req.session.error = 'An error occurred while sending your message. Please try again.';
    res.redirect('/contact');
  }
});

// Settings page (requires authentication)
router.get('/settings', require('../middleware/auth').requireAuth, (req, res) => {
  res.render('pages/settings', {
    title: 'Settings - Sangam Alumni Network',
    user: req.session.user,
    currentPage: 'settings'
  });
});

// Dashboard page (requires authentication)
router.get('/dashboard', require('../middleware/auth').requireAuth, (req, res) => {
  res.render('pages/dashboard', {
    title: 'Dashboard - Sangam Alumni Network',
    user: req.session.user,
    currentPage: 'dashboard'
  });
});

// Profile page (requires authentication)
router.get('/profile', require('../middleware/auth').requireAuth, (req, res) => {
  res.render('pages/dashboard', {
    title: 'Profile - Sangam Alumni Network',
    user: req.session.user,
    currentPage: 'profile'
  });
});

// Chat page (requires authentication)
router.get('/chat', require('../middleware/auth').requireAuth, (req, res) => {
  res.render('pages/chat', {
    title: 'Chat - Sangam Alumni Network',
    user: req.session.user,
    currentPage: 'chat'
  });
});

// Admin panel (requires admin permissions)
router.get('/admin',
  require('../middleware/auth').requireAuth,
  require('../middleware/permissions').requirePermission('admin:access_panel'),
  (req, res) => {
    res.render('pages/admin', {
      title: 'Admin Panel - Sangam Alumni Network',
      user: req.session.user,
      currentPage: 'admin'
    });
  }
);

module.exports = router;
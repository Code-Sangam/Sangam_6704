const express = require('express');
const router = express.Router();

// Homepage route
router.get('/', (req, res) => {
  res.render('pages/home', {
    title: 'Sangam Alumni Network',
    description: 'Connect with alumni and students from your institution',
    currentPage: 'home'
  });
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
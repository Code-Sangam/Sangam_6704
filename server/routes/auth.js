const express = require('express');
const router = express.Router();
const { AuthController, authLimiter, loginLimiter } = require('../controllers/authController');
const { sessionActivity } = require('../middleware/auth');

// Apply session activity tracking to all auth routes
router.use(sessionActivity);

// Login routes
router.get('/login', AuthController.showLogin);
router.post('/login', loginLimiter, AuthController.login);

// Registration routes
router.get('/register', AuthController.showRegister);
router.post('/register', authLimiter, AuthController.register);

// Logout route
router.post('/logout', AuthController.logout);
router.get('/logout', AuthController.logout); // Allow GET for convenience

// Email verification routes
router.get('/verify-email/:token', AuthController.verifyEmail);
router.get('/verify-email', (req, res) => {
  res.render('pages/verify-email', {
    title: 'Verify Email - Sangam Alumni Network',
    user: req.session.user,
    currentPage: 'verify-email'
  });
});

// Password reset routes
router.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password', {
    title: 'Forgot Password - Sangam Alumni Network',
    error: req.session.error || null,
    success: req.session.success || null,
    currentPage: 'forgot-password'
  });
  
  delete req.session.error;
  delete req.session.success;
});

router.post('/forgot-password', authLimiter, AuthController.requestPasswordReset);

// Password reset form
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).render('pages/error', {
        title: 'Invalid Token',
        message: 'Password reset token is required'
      });
    }
    
    // TODO: Validate token and show reset form
    res.render('pages/reset-password', {
      title: 'Reset Password - Sangam Alumni Network',
      token: token,
      error: req.session.error || null,
      currentPage: 'reset-password'
    });
    
    delete req.session.error;
    
  } catch (error) {
    res.status(500).render('pages/error', {
      title: 'Error',
      message: 'An error occurred loading the password reset page'
    });
  }
});

// API endpoints for authentication
router.get('/api/current-user', AuthController.getCurrentUser);

// Check authentication status (for AJAX requests)
router.get('/api/status', (req, res) => {
  res.json({
    authenticated: !!req.session.user,
    user: req.session.user ? {
      id: req.session.user.id,
      email: req.session.user.email,
      role: req.session.user.role,
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      emailVerified: req.session.user.emailVerified
    } : null
  });
});

module.exports = router;
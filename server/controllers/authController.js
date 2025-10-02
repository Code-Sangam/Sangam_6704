const bcrypt = require('bcrypt');
const { User, Profile } = require('../models');
const { logger } = require('../middleware/errorHandler');
const rateLimit = require('express-rate-limit');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Login rate limiting (more restrictive)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 login attempts per windowMs
  message: {
    error: 'Too many login attempts',
    message: 'Please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

class AuthController {
  // Display login page
  static async showLogin(req, res) {
    try {
      // Redirect if already authenticated
      if (req.session.user) {
        const returnTo = req.session.returnTo || '/profile';
        delete req.session.returnTo;
        return res.redirect(returnTo);
      }
      
      res.render('pages/login', {
        title: 'Login - Sangam Alumni Network',
        error: req.session.error || null,
        email: req.session.loginEmail || '',
        currentPage: 'login'
      });
      
      // Clear temporary session data
      delete req.session.error;
      delete req.session.loginEmail;
      
    } catch (error) {
      logger.error('Error displaying login page:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: 'Unable to load login page'
      });
    }
  }
  
  // Handle login POST request
  static async login(req, res) {
    try {
      const { email, password, rememberMe } = req.body;
      
      // Validate input
      if (!email || !password) {
        req.session.error = 'Email and password are required';
        req.session.loginEmail = email;
        return res.redirect('/auth/login');
      }
      
      // Find user by email
      const user = await User.findByEmail(email);
      
      if (!user) {
        req.session.error = 'Invalid email or password';
        req.session.loginEmail = email;
        return res.redirect('/auth/login');
      }
      
      // Check if account is locked
      if (user.isLocked()) {
        const lockTimeRemaining = Math.ceil((user.locked_until - new Date()) / (1000 * 60));
        req.session.error = `Account is locked. Try again in ${lockTimeRemaining} minutes.`;
        return res.redirect('/auth/login');
      }
      
      // Check if account is active
      if (!user.is_active) {
        req.session.error = 'Account is deactivated. Please contact support.';
        return res.redirect('/auth/login');
      }
      
      // Validate password
      const isValidPassword = await user.validatePassword(password);
      
      if (!isValidPassword) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        
        req.session.error = 'Invalid email or password';
        req.session.loginEmail = email;
        return res.redirect('/auth/login');
      }
      
      // Reset login attempts on successful login
      await user.resetLoginAttempts();
      
      // Create session
      const sessionData = {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified,
        loginTime: new Date()
      };
      
      // Include profile data if available
      if (user.profile) {
        sessionData.firstName = user.profile.first_name;
        sessionData.lastName = user.profile.last_name;
        sessionData.profilePicture = user.profile.profile_picture;
      }
      
      req.session.user = sessionData;
      
      // Extend session if "Remember Me" is checked
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      
      // Log successful login
      logger.info(`User logged in: ${user.email} (${user.role})`);
      
      // Redirect to intended page or profile
      const returnTo = req.session.returnTo || '/profile';
      delete req.session.returnTo;
      
      res.redirect(returnTo);
      
    } catch (error) {
      logger.error('Login error:', error);
      req.session.error = 'An error occurred during login. Please try again.';
      res.redirect('/auth/login');
    }
  }
  
  // Display registration page
  static async showRegister(req, res) {
    try {
      // Redirect if already authenticated
      if (req.session.user) {
        return res.redirect('/profile');
      }
      
      res.render('pages/register', {
        title: 'Register - Sangam Alumni Network',
        error: req.session.error || null,
        formData: req.session.formData || {},
        currentPage: 'register'
      });
      
      // Clear temporary session data
      delete req.session.error;
      delete req.session.formData;
      
    } catch (error) {
      logger.error('Error displaying register page:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: 'Unable to load registration page'
      });
    }
  }
  
  // Handle registration POST request
  static async register(req, res) {
    try {
      const { 
        email, 
        password, 
        confirmPassword, 
        firstName, 
        lastName, 
        role,
        university,
        graduationYear,
        company,
        position 
      } = req.body;
      
      // Store form data for re-display on error
      req.session.formData = {
        email,
        firstName,
        lastName,
        role,
        university,
        graduationYear,
        company,
        position
      };
      
      // Validate required fields
      if (!email || !password || !confirmPassword || !firstName || !lastName || !role) {
        req.session.error = 'All required fields must be filled';
        return res.redirect('/auth/register');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        req.session.error = 'Please provide a valid email address';
        return res.redirect('/auth/register');
      }
      
      // Validate password strength
      if (password.length < 8) {
        req.session.error = 'Password must be at least 8 characters long';
        return res.redirect('/auth/register');
      }
      
      // Check password confirmation
      if (password !== confirmPassword) {
        req.session.error = 'Passwords do not match';
        return res.redirect('/auth/register');
      }
      
      // Validate role
      const validRoles = ['student', 'alumni', 'faculty'];
      if (!validRoles.includes(role)) {
        req.session.error = 'Please select a valid role';
        return res.redirect('/auth/register');
      }
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        req.session.error = 'An account with this email already exists';
        return res.redirect('/auth/register');
      }
      
      // Hash password
      const passwordHash = await User.hashPassword(password);
      
      // Create user
      const user = await User.create({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: role,
        email_verified: false // Will be true after email verification
      });
      
      // Create profile
      const profileData = {
        user_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim()
      };
      
      // Add role-specific profile data
      if (role === 'alumni' || role === 'faculty') {
        if (company) profileData.company = company.trim();
        if (position) profileData.position = position.trim();
      }
      
      if (role === 'student' || role === 'alumni') {
        if (university) profileData.university = university.trim();
        if (graduationYear) profileData.graduation_year = parseInt(graduationYear);
      }
      
      const profile = await Profile.create(profileData);
      
      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();
      
      // Log successful registration
      logger.info(`New user registered: ${user.email} (${user.role})`);
      
      // TODO: Send verification email (will be implemented later)
      console.log(`Verification token for ${email}: ${verificationToken}`);
      
      // Auto-login the user (skip email verification for now)
      const sessionData = {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified,
        firstName: profile.first_name,
        lastName: profile.last_name,
        profilePicture: profile.profile_picture,
        loginTime: new Date()
      };
      
      req.session.user = sessionData;
      
      // Clear form data
      delete req.session.formData;
      
      // Set success message
      req.session.success = 'Account created successfully! Welcome to Sangam Alumni Network.';
      
      res.redirect('/profile');
      
    } catch (error) {
      logger.error('Registration error:', error);
      
      // Handle specific database errors
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        req.session.error = messages.join(', ');
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        req.session.error = 'An account with this email already exists';
      } else {
        req.session.error = 'An error occurred during registration. Please try again.';
      }
      
      res.redirect('/auth/register');
    }
  }
  
  // Handle logout
  static async logout(req, res) {
    try {
      const userId = req.session.user?.id;
      
      // Log logout
      if (userId) {
        logger.info(`User logged out: ${req.session.user.email}`);
      }
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destruction error:', err);
          return res.status(500).json({ 
            error: 'Could not log out properly' 
          });
        }
        
        // Clear session cookie
        res.clearCookie('sangam.sid');
        
        // Redirect to home page
        res.redirect('/?message=logged-out');
      });
      
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ 
        error: 'An error occurred during logout' 
      });
    }
  }
  
  // Verify email (placeholder for future implementation)
  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).render('pages/error', {
          title: 'Invalid Token',
          message: 'Email verification token is required'
        });
      }
      
      // Find user by verification token
      const user = await User.findOne({
        where: { email_verification_token: token }
      });
      
      if (!user) {
        return res.status(400).render('pages/error', {
          title: 'Invalid Token',
          message: 'Invalid or expired verification token'
        });
      }
      
      // Verify email
      await user.verifyEmail();
      
      logger.info(`Email verified for user: ${user.email}`);
      
      res.render('pages/email-verified', {
        title: 'Email Verified',
        message: 'Your email has been successfully verified!'
      });
      
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).render('pages/error', {
        title: 'Verification Error',
        message: 'An error occurred during email verification'
      });
    }
  }
  
  // Password reset request (placeholder for future implementation)
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          error: 'Email is required'
        });
      }
      
      const user = await User.findByEmail(email);
      
      if (user) {
        const resetToken = user.generatePasswordResetToken();
        await user.save();
        
        // TODO: Send password reset email
        console.log(`Password reset token for ${email}: ${resetToken}`);
        
        logger.info(`Password reset requested for: ${email}`);
      }
      
      // Always return success to prevent email enumeration
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
      
    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json({
        error: 'An error occurred processing your request'
      });
    }
  }
  
  // Get current user info (API endpoint)
  static async getCurrentUser(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({
          error: 'Not authenticated'
        });
      }
      
      const user = await User.findByIdWithProfile(req.session.user.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      res.json({
        user: user.getPublicProfile(),
        profile: user.profile
      });
      
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        error: 'An error occurred fetching user data'
      });
    }
  }
}

module.exports = {
  AuthController,
  authLimiter,
  loginLimiter
};
const crypto = require('crypto');
const { User, Profile } = require('../models');
const { hashPassword, verifyPassword, generatePasswordResetToken, generateEmailVerificationToken } = require('./passwordUtils');
const { sessionSecurity } = require('../config/session');
const { logger } = require('../middleware/errorHandler');

/**
 * Create a new user account with profile
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Created user and profile
 */
const createUserAccount = async (userData) => {
  const { email, password, role, firstName, lastName, ...profileData } = userData;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role,
      email_verification_token: generateEmailVerificationToken()
    });

    // Create profile
    const profile = await Profile.create({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      ...profileData
    });

    // Return user without sensitive data
    const userResponse = user.toJSON();
    userResponse.profile = profile.toJSON();

    logger.info('New user account created:', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return userResponse;
  } catch (error) {
    logger.error('User account creation error:', error);
    throw error;
  }
};

/**
 * Authenticate user login
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Authentication result
 */
const authenticateUser = async (email, password, req) => {
  try {
    // Find user with profile
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: Profile,
        as: 'profile'
      }]
    });

    if (!user) {
      logger.warn('Login attempt with non-existent email:', { email, ip: req.ip });
      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked()) {
      logger.warn('Login attempt on locked account:', { 
        userId: user.id, 
        email: user.email, 
        ip: req.ip 
      });
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    // Check if account is active
    if (!user.is_active) {
      logger.warn('Login attempt on inactive account:', { 
        userId: user.id, 
        email: user.email, 
        ip: req.ip 
      });
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      logger.warn('Failed login attempt:', { 
        userId: user.id, 
        email: user.email, 
        attempts: user.login_attempts + 1,
        ip: req.ip 
      });
      
      throw new Error('Invalid email or password');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Regenerate session ID for security
    await sessionSecurity.regenerateOnLogin(req);

    // Create session data
    const sessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.email_verified,
      profile: user.profile ? {
        id: user.profile.id,
        firstName: user.profile.first_name,
        lastName: user.profile.last_name,
        profilePicture: user.profile.profile_picture
      } : null
    };

    // Set session data
    req.session.user = sessionUser;
    req.session.loginTime = new Date();
    req.session.ipAddress = req.ip;
    req.session.userAgent = req.get('User-Agent');

    logger.info('Successful user login:', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    return {
      success: true,
      user: sessionUser,
      message: 'Login successful'
    };

  } catch (error) {
    logger.error('Authentication error:', error);
    throw error;
  }
};

/**
 * Logout user and destroy session
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - Logout result
 */
const logoutUser = async (req) => {
  try {
    const userId = req.session.user?.id;
    
    // Destroy session securely
    await sessionSecurity.destroySession(req);

    if (userId) {
      logger.info('User logged out:', { userId });
    }

    return {
      success: true,
      message: 'Logout successful'
    };
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

/**
 * Initiate password reset process
 * @param {string} email - User email
 * @returns {Promise<Object>} - Reset initiation result
 */
const initiatePasswordReset = async (email) => {
  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    
    if (!user) {
      // Don't reveal if email exists or not
      logger.warn('Password reset attempt for non-existent email:', { email });
      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      };
    }

    if (!user.is_active) {
      logger.warn('Password reset attempt for inactive account:', { 
        userId: user.id, 
        email: user.email 
      });
      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent'
      };
    }

    // Generate reset token
    const resetData = generatePasswordResetToken();
    
    // Update user with reset token
    await user.update({
      password_reset_token: resetData.token,
      password_reset_expires: resetData.expires
    });

    logger.info('Password reset initiated:', {
      userId: user.id,
      email: user.email
    });

    return {
      success: true,
      message: 'Password reset link has been sent to your email',
      resetToken: resetData.token, // In production, this would be sent via email
      expiresIn: resetData.expiresIn
    };

  } catch (error) {
    logger.error('Password reset initiation error:', error);
    throw error;
  }
};

/**
 * Reset user password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Reset result
 */
const resetPassword = async (token, newPassword) => {
  try {
    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      logger.warn('Invalid or expired password reset token used:', { token });
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password and clear reset token
    await user.update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
      login_attempts: 0, // Reset login attempts
      locked_until: null // Unlock account if locked
    });

    logger.info('Password reset completed:', {
      userId: user.id,
      email: user.email
    });

    return {
      success: true,
      message: 'Password has been reset successfully'
    };

  } catch (error) {
    logger.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Change user password (authenticated)
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Change result
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      logger.warn('Invalid current password in change attempt:', { userId });
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await user.update({
      password_hash: passwordHash
    });

    logger.info('Password changed successfully:', { userId });

    return {
      success: true,
      message: 'Password changed successfully'
    };

  } catch (error) {
    logger.error('Password change error:', error);
    throw error;
  }
};

/**
 * Verify email address
 * @param {string} token - Email verification token
 * @returns {Promise<Object>} - Verification result
 */
const verifyEmail = async (token) => {
  try {
    const user = await User.findOne({
      where: { email_verification_token: token }
    });

    if (!user) {
      logger.warn('Invalid email verification token used:', { token });
      throw new Error('Invalid verification token');
    }

    if (user.email_verified) {
      return {
        success: true,
        message: 'Email is already verified'
      };
    }

    // Verify email
    await user.verifyEmail();

    logger.info('Email verified successfully:', {
      userId: user.id,
      email: user.email
    });

    return {
      success: true,
      message: 'Email verified successfully'
    };

  } catch (error) {
    logger.error('Email verification error:', error);
    throw error;
  }
};

/**
 * Resend email verification
 * @param {string} email - User email
 * @returns {Promise<Object>} - Resend result
 */
const resendEmailVerification = async (email) => {
  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    
    if (!user) {
      // Don't reveal if email exists or not
      return {
        success: true,
        message: 'If an account with this email exists, a verification email has been sent'
      };
    }

    if (user.email_verified) {
      return {
        success: true,
        message: 'Email is already verified'
      };
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken();
    
    await user.update({
      email_verification_token: verificationToken
    });

    logger.info('Email verification resent:', {
      userId: user.id,
      email: user.email
    });

    return {
      success: true,
      message: 'Verification email has been sent',
      verificationToken // In production, this would be sent via email
    };

  } catch (error) {
    logger.error('Email verification resend error:', error);
    throw error;
  }
};

module.exports = {
  createUserAccount,
  authenticateUser,
  logoutUser,
  initiatePasswordReset,
  resetPassword,
  changePassword,
  verifyEmail,
  resendEmailVerification
};
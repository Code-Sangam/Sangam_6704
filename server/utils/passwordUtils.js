const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logger } = require('../middleware/errorHandler');

// Password hashing configuration
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  maxLength: MAX_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '@$!%*?&'
};

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      throw new Error(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`);
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    logger.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
const verifyPassword = async (password, hash) => {
  try {
    if (!password || !hash) {
      return false;
    }

    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    logger.error('Password verification error:', error);
    return false;
  }
};

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {Object} - Strength analysis result
 */
const checkPasswordStrength = (password) => {
  const result = {
    isValid: false,
    score: 0,
    feedback: [],
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      numbers: false,
      specialChars: false
    }
  };

  if (!password || typeof password !== 'string') {
    result.feedback.push('Password is required');
    return result;
  }

  // Check length
  if (password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH) {
    result.requirements.length = true;
    result.score += 20;
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    result.feedback.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  } else {
    result.feedback.push(`Password must be no more than ${MAX_PASSWORD_LENGTH} characters long`);
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    result.requirements.uppercase = true;
    result.score += 20;
  } else {
    result.feedback.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    result.requirements.lowercase = true;
    result.score += 20;
  } else {
    result.feedback.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (/\d/.test(password)) {
    result.requirements.numbers = true;
    result.score += 20;
  } else {
    result.feedback.push('Password must contain at least one number');
  }

  // Check for special characters
  const specialCharRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
  if (specialCharRegex.test(password)) {
    result.requirements.specialChars = true;
    result.score += 20;
  } else {
    result.feedback.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.specialChars})`);
  }

  // Additional strength checks
  if (password.length >= 12) {
    result.score += 5; // Bonus for longer passwords
  }

  if (/(.)\1{2,}/.test(password)) {
    result.score -= 10; // Penalty for repeated characters
    result.feedback.push('Avoid using repeated characters');
  }

  // Check for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      result.score -= 15;
      result.feedback.push('Avoid using common password patterns');
      break;
    }
  }

  // Determine if password meets all requirements
  result.isValid = Object.values(result.requirements).every(req => req === true);

  // Ensure score doesn't go below 0
  result.score = Math.max(0, result.score);

  return result;
};

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 16)
 * @returns {string} - Generated password
 */
const generateSecurePassword = (length = 16) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = PASSWORD_REQUIREMENTS.specialChars;
  
  const allChars = uppercase + lowercase + numbers + specialChars;
  
  let password = '';
  
  // Ensure at least one character from each required category
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += specialChars[crypto.randomInt(0, specialChars.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => crypto.randomInt(0, 3) - 1).join('');
};

/**
 * Generate a password reset token
 * @returns {Object} - Token and expiry information
 */
const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  return {
    token,
    expires,
    expiresIn: '1 hour'
  };
};

/**
 * Generate an email verification token
 * @returns {string} - Verification token
 */
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate password reset token
 * @param {string} token - Token to validate
 * @param {string} storedToken - Stored token from database
 * @param {Date} expiryDate - Token expiry date
 * @returns {boolean} - True if token is valid
 */
const validatePasswordResetToken = (token, storedToken, expiryDate) => {
  if (!token || !storedToken || !expiryDate) {
    return false;
  }

  // Check if token has expired
  if (new Date() > expiryDate) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(storedToken, 'hex')
  );
};

/**
 * Check if password needs to be rehashed (due to changed salt rounds)
 * @param {string} hash - Current password hash
 * @returns {boolean} - True if rehashing is needed
 */
const needsRehash = (hash) => {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch (error) {
    logger.error('Error checking hash rounds:', error);
    return true; // Assume rehash is needed if we can't determine rounds
  }
};

/**
 * Securely compare two strings to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings match
 */
const timingSafeEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (error) {
    return false;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  checkPasswordStrength,
  generateSecurePassword,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  validatePasswordResetToken,
  needsRehash,
  timingSafeEqual,
  PASSWORD_REQUIREMENTS
};
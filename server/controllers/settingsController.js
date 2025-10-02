const { User, Profile, Session } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

const settingsController = {
  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const {
        firstName,
        lastName,
        email,
        company,
        position,
        university,
        major,
        graduationYear,
        bio,
        linkedinUrl,
        githubUrl
      } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({
          error: 'First name, last name, and email are required'
        });
      }
      
      // Check if email is already taken by another user
      if (email !== req.session.user.email) {
        const existingUser = await User.findOne({
          where: {
            email: email.toLowerCase(),
            id: { [Op.ne]: userId }
          }
        });
        
        if (existingUser) {
          return res.status(400).json({
            error: 'Email address is already in use'
          });
        }
      }
      
      // Update user email if changed
      if (email !== req.session.user.email) {
        await User.update(
          { email: email.toLowerCase() },
          { where: { id: userId } }
        );
        
        // Update session
        req.session.user.email = email.toLowerCase();
      }
      
      // Update or create profile
      const [profile, created] = await Profile.findOrCreate({
        where: { userId },
        defaults: {
          firstName,
          lastName,
          company: company || null,
          position: position || null,
          university: university || null,
          major: major || null,
          graduationYear: graduationYear ? parseInt(graduationYear) : null,
          bio: bio || null,
          linkedinUrl: linkedinUrl || null,
          githubUrl: githubUrl || null
        }
      });
      
      if (!created) {
        await profile.update({
          firstName,
          lastName,
          company: company || null,
          position: position || null,
          university: university || null,
          major: major || null,
          graduationYear: graduationYear ? parseInt(graduationYear) : null,
          bio: bio || null,
          linkedinUrl: linkedinUrl || null,
          githubUrl: githubUrl || null
        });
      }
      
      // Update session user data
      req.session.user.profile = {
        ...req.session.user.profile,
        firstName,
        lastName,
        company: company || null,
        position: position || null,
        university: university || null,
        major: major || null,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        bio: bio || null,
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null
      };
      
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: userId,
          email: req.session.user.email,
          role: req.session.user.role,
          profile: req.session.user.profile
        }
      });
      
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: error.message
      });
    }
  },
  
  // Change password
  changePassword: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { currentPassword, newPassword } = req.body;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required'
        });
      }
      
      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'New password must be at least 8 characters long'
        });
      }
      
      // Get user with current password
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: 'Current password is incorrect'
        });
      }
      
      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password
      await user.update({
        passwordHash: newPasswordHash
      });
      
      // Log activity
      await this.logActivity(userId, 'password_changed', 'Password was successfully updated');
      
      res.json({
        message: 'Password updated successfully'
      });
      
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        message: error.message
      });
    }
  },
  
  // Update privacy settings
  updatePrivacySettings: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const {
        profileVisibility,
        messageNotifications,
        emailNotifications,
        showOnlineStatus
      } = req.body;
      
      // For now, we'll store privacy settings in the user's profile
      // In a real application, you might want a separate UserSettings table
      const [profile] = await Profile.findOrCreate({
        where: { userId },
        defaults: {}
      });
      
      // Update privacy settings (stored as JSON in a metadata field)
      const privacySettings = {
        profileVisibility: profileVisibility || 'public',
        messageNotifications: !!messageNotifications,
        emailNotifications: !!emailNotifications,
        showOnlineStatus: !!showOnlineStatus
      };
      
      await profile.update({
        privacySettings: JSON.stringify(privacySettings)
      });
      
      // Log activity
      await this.logActivity(userId, 'privacy_updated', 'Privacy settings were updated');
      
      res.json({
        message: 'Privacy settings updated successfully',
        settings: privacySettings
      });
      
    } catch (error) {
      console.error('Privacy settings update error:', error);
      res.status(500).json({
        error: 'Failed to update privacy settings',
        message: error.message
      });
    }
  },
  
  // Get account activity
  getAccountActivity: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { limit = 20 } = req.query;
      
      // For now, we'll return mock data
      // In a real application, you'd have an ActivityLog table
      const mockActivities = [
        {
          id: 1,
          action: 'Profile updated',
          description: 'Updated bio and contact information',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          type: 'profile_update'
        },
        {
          id: 2,
          action: 'Password changed',
          description: 'Account password was successfully updated',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          type: 'security'
        },
        {
          id: 3,
          action: 'New message sent',
          description: 'Sent message in chat conversation',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          type: 'communication'
        },
        {
          id: 4,
          action: 'Profile viewed',
          description: 'Your profile was viewed by other users',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          type: 'profile_view'
        },
        {
          id: 5,
          action: 'Account created',
          description: 'Welcome to Sangam Alumni Network!',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
          type: 'account_creation'
        }
      ];
      
      res.json(mockActivities.slice(0, parseInt(limit)));
      
    } catch (error) {
      console.error('Account activity error:', error);
      res.status(500).json({
        error: 'Failed to fetch account activity',
        message: error.message
      });
    }
  },
  
  // Get active sessions
  getActiveSessions: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const currentSessionId = req.sessionID;
      
      // Get all active sessions for the user
      const sessions = await Session.findAll({
        where: {
          userId: userId,
          expiresAt: {
            [Op.gt]: new Date()
          }
        },
        order: [['updatedAt', 'DESC']]
      });
      
      // Format sessions for frontend
      const formattedSessions = sessions.map(session => {
        const sessionData = session.data ? JSON.parse(session.data) : {};
        const userAgent = sessionData.userAgent || '';
        
        return {
          id: session.sid,
          device: this.parseDeviceFromUserAgent(userAgent),
          browser: this.parseBrowserFromUserAgent(userAgent),
          deviceType: this.getDeviceType(userAgent),
          location: sessionData.location || 'Unknown Location',
          ip: sessionData.ip || 'Unknown IP',
          lastActive: session.updatedAt,
          isCurrent: session.sid === currentSessionId,
          createdAt: session.createdAt
        };
      });
      
      res.json(formattedSessions);
      
    } catch (error) {
      console.error('Active sessions error:', error);
      res.status(500).json({
        error: 'Failed to fetch active sessions',
        message: error.message
      });
    }
  },
  
  // Terminate session
  terminateSession: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { sessionId } = req.params;
      const currentSessionId = req.sessionID;
      
      // Prevent terminating current session
      if (sessionId === currentSessionId) {
        return res.status(400).json({
          error: 'Cannot terminate current session'
        });
      }
      
      // Find and delete the session
      const session = await Session.findOne({
        where: {
          sid: sessionId,
          userId: userId
        }
      });
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }
      
      await session.destroy();
      
      // Log activity
      await this.logActivity(userId, 'session_terminated', `Session ${sessionId.substring(0, 8)}... was terminated`);
      
      res.json({
        message: 'Session terminated successfully'
      });
      
    } catch (error) {
      console.error('Session termination error:', error);
      res.status(500).json({
        error: 'Failed to terminate session',
        message: error.message
      });
    }
  },
  
  // Helper method to log activity (placeholder)
  logActivity: async (userId, action, description) => {
    // In a real application, you'd save this to an ActivityLog table
    console.log(`Activity logged for user ${userId}: ${action} - ${description}`);
  },
  
  // Helper method to parse device from user agent
  parseDeviceFromUserAgent: (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    
    if (/iPhone/i.test(userAgent)) return 'iPhone';
    if (/iPad/i.test(userAgent)) return 'iPad';
    if (/Android/i.test(userAgent)) return 'Android Device';
    if (/Macintosh/i.test(userAgent)) return 'Mac';
    if (/Windows/i.test(userAgent)) return 'Windows PC';
    if (/Linux/i.test(userAgent)) return 'Linux PC';
    
    return 'Unknown Device';
  },
  
  // Helper method to parse browser from user agent
  parseBrowserFromUserAgent: (userAgent) => {
    if (!userAgent) return 'Unknown Browser';
    
    if (/Chrome/i.test(userAgent)) return 'Chrome';
    if (/Firefox/i.test(userAgent)) return 'Firefox';
    if (/Safari/i.test(userAgent)) return 'Safari';
    if (/Edge/i.test(userAgent)) return 'Edge';
    if (/Opera/i.test(userAgent)) return 'Opera';
    
    return 'Unknown Browser';
  },
  
  // Helper method to get device type
  getDeviceType: (userAgent) => {
    if (!userAgent) return 'desktop';
    
    if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }
};

module.exports = settingsController;
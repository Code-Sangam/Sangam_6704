const { User, Profile, Message, Session } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { hasPermission, getUserPermissions } = require('../middleware/permissions');

const adminController = {
  // Get admin dashboard data
  getDashboard: async (req, res) => {
    try {
      const [userStats, messageStats, recentUsers] = await Promise.all([
        // User statistics
        User.findAll({
          attributes: [
            'role',
            [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
          ],
          group: ['role']
        }),
        
        // Message statistics
        Message.findAll({
          attributes: [
            [Message.sequelize.fn('DATE', Message.sequelize.col('createdAt')), 'date'],
            [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'count']
          ],
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          group: [Message.sequelize.fn('DATE', Message.sequelize.col('createdAt'))],
          order: [[Message.sequelize.fn('DATE', Message.sequelize.col('createdAt')), 'DESC']],
          limit: 30
        }),
        
        // Recent users
        User.findAll({
          include: [{
            model: Profile,
            attributes: ['firstName', 'lastName', 'profilePicture']
          }],
          order: [['createdAt', 'DESC']],
          limit: 10
        })
      ]);
      
      // Format user statistics
      const formattedUserStats = userStats.reduce((acc, stat) => {
        acc[stat.role] = parseInt(stat.dataValues.count);
        return acc;
      }, {});
      
      // Calculate totals
      const totalUsers = Object.values(formattedUserStats).reduce((sum, count) => sum + count, 0);
      const totalMessages = await Message.count();
      const activeUsers = await Session.count({
        where: {
          expiresAt: {
            [Op.gt]: new Date()
          }
        }
      });
      
      res.json({
        stats: {
          totalUsers,
          totalMessages,
          activeUsers,
          usersByRole: formattedUserStats
        },
        charts: {
          messagesByDay: messageStats.map(stat => ({
            date: stat.dataValues.date,
            count: parseInt(stat.dataValues.count)
          }))
        },
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.Profile?.firstName || 'Unknown',
          lastName: user.Profile?.lastName || 'User',
          profilePicture: user.Profile?.profilePicture || null,
          createdAt: user.createdAt
        }))
      });
      
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({
        error: 'Failed to load dashboard data',
        message: error.message
      });
    }
  },
  
  // Get all users with filtering and pagination
  getUsers: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        role = '',
        status = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { email: { [Op.iLike]: `%${search}%` } },
          { '$Profile.firstName$': { [Op.iLike]: `%${search}%` } },
          { '$Profile.lastName$': { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (role) {
        whereClause.role = role;
      }
      
      if (status === 'active') {
        whereClause.isActive = true;
      } else if (status === 'inactive') {
        whereClause.isActive = false;
      }
      
      const users = await User.findAndCountAll({
        where: whereClause,
        include: [{
          model: Profile,
          attributes: ['firstName', 'lastName', 'profilePicture', 'company', 'position', 'graduationYear']
        }],
        attributes: ['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      const formattedUsers = users.rows.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        firstName: user.Profile?.firstName || 'Unknown',
        lastName: user.Profile?.lastName || 'User',
        profilePicture: user.Profile?.profilePicture || null,
        company: user.Profile?.company || null,
        position: user.Profile?.position || null,
        graduationYear: user.Profile?.graduationYear || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      res.json({
        users: formattedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.count / limit),
          totalUsers: users.count,
          hasNext: offset + users.rows.length < users.count,
          hasPrev: page > 1
        }
      });
      
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  },
  
  // Get user details
  getUserDetails: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findByPk(userId, {
        include: [{
          model: Profile,
          attributes: [
            'firstName', 'lastName', 'bio', 'profilePicture',
            'company', 'position', 'graduationYear', 'university',
            'major', 'linkedinUrl', 'githubUrl'
          ]
        }],
        attributes: ['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt']
      });
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Get user statistics
      const [messageCount, sessionCount] = await Promise.all([
        Message.count({ where: { senderId: userId } }),
        Session.count({ where: { userId: userId } })
      ]);
      
      const userDetails = {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.Profile ? {
          firstName: user.Profile.firstName,
          lastName: user.Profile.lastName,
          bio: user.Profile.bio,
          profilePicture: user.Profile.profilePicture,
          company: user.Profile.company,
          position: user.Profile.position,
          graduationYear: user.Profile.graduationYear,
          university: user.Profile.university,
          major: user.Profile.major,
          linkedinUrl: user.Profile.linkedinUrl,
          githubUrl: user.Profile.githubUrl
        } : null,
        stats: {
          messagesSent: messageCount,
          totalSessions: sessionCount
        }
      };
      
      res.json(userDetails);
      
    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({
        error: 'Failed to fetch user details',
        message: error.message
      });
    }
  },
  
  // Update user role
  updateUserRole: async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      const validRoles = ['student', 'alumni', 'faculty', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role specified'
        });
      }
      
      // Prevent non-super-admins from creating admins
      if (role === 'admin' && req.session.user.role !== 'super_admin') {
        return res.status(403).json({
          error: 'Only super admins can assign admin role'
        });
      }
      
      // Prevent users from changing their own role
      if (userId == req.session.user.id) {
        return res.status(400).json({
          error: 'Cannot change your own role'
        });
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      await user.update({ role });
      
      res.json({
        message: 'User role updated successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
      
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        error: 'Failed to update user role',
        message: error.message
      });
    }
  },
  
  // Suspend/activate user
  toggleUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      // Prevent users from suspending themselves
      if (userId == req.session.user.id) {
        return res.status(400).json({
          error: 'Cannot change your own account status'
        });
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      await user.update({ isActive: !!isActive });
      
      // If suspending user, terminate all their sessions
      if (!isActive) {
        await Session.destroy({
          where: { userId: userId }
        });
      }
      
      res.json({
        message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive
        }
      });
      
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        error: 'Failed to update user status',
        message: error.message
      });
    }
  },
  
  // Reset user password
  resetUserPassword: async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters long'
        });
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      
      await user.update({ passwordHash });
      
      // Terminate all user sessions to force re-login
      await Session.destroy({
        where: { userId: userId }
      });
      
      res.json({
        message: 'Password reset successfully. User will need to log in again.'
      });
      
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        error: 'Failed to reset password',
        message: error.message
      });
    }
  },
  
  // Delete user (soft delete)
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent users from deleting themselves
      if (userId == req.session.user.id) {
        return res.status(400).json({
          error: 'Cannot delete your own account'
        });
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Soft delete by deactivating and anonymizing
      await user.update({
        isActive: false,
        email: `deleted_${userId}@deleted.local`,
        deletedAt: new Date()
      });
      
      // Delete profile data
      await Profile.destroy({
        where: { userId: userId }
      });
      
      // Terminate all sessions
      await Session.destroy({
        where: { userId: userId }
      });
      
      res.json({
        message: 'User deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        error: 'Failed to delete user',
        message: error.message
      });
    }
  },
  
  // Get system settings
  getSystemSettings: async (req, res) => {
    try {
      // Mock system settings - in a real app, these would be in a settings table
      const settings = {
        general: {
          siteName: 'Sangam Alumni Network',
          siteDescription: 'Connect with alumni and students',
          maintenanceMode: false,
          registrationEnabled: true
        },
        security: {
          passwordMinLength: 8,
          sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
          maxLoginAttempts: 5,
          lockoutDuration: 15 * 60 * 1000 // 15 minutes
        },
        features: {
          chatEnabled: true,
          fileUploadEnabled: true,
          notificationsEnabled: true,
          profileVisibilityEnabled: true
        },
        limits: {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxMessagesPerDay: 1000,
          maxProfilePictureSize: 5 * 1024 * 1024 // 5MB
        }
      };
      
      res.json(settings);
      
    } catch (error) {
      console.error('Get system settings error:', error);
      res.status(500).json({
        error: 'Failed to fetch system settings',
        message: error.message
      });
    }
  },
  
  // Update system settings
  updateSystemSettings: async (req, res) => {
    try {
      const settings = req.body;
      
      // Basic validation
      if (settings.security?.passwordMinLength < 6) {
        return res.status(400).json({
          error: 'Password minimum length cannot be less than 6'
        });
      }
      
      if (settings.limits?.maxFileSize > 50 * 1024 * 1024) {
        return res.status(400).json({
          error: 'Maximum file size cannot exceed 50MB'
        });
      }
      
      // TODO: Save settings to database
      console.log('System settings updated:', settings);
      
      res.json({
        message: 'System settings updated successfully',
        settings
      });
      
    } catch (error) {
      console.error('Update system settings error:', error);
      res.status(500).json({
        error: 'Failed to update system settings',
        message: error.message
      });
    }
  },
  
  // Get user permissions
  getUserPermissions: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findByPk(userId, {
        attributes: ['id', 'role']
      });
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      const permissions = getUserPermissions(user.role);
      
      res.json({
        userId: user.id,
        role: user.role,
        permissions
      });
      
    } catch (error) {
      console.error('Get user permissions error:', error);
      res.status(500).json({
        error: 'Failed to fetch user permissions',
        message: error.message
      });
    }
  }
};

module.exports = adminController;
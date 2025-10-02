const { User, Profile } = require('../models');
const { Op } = require('sequelize');

const userController = {
  // Get all users (for admin purposes)
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 20, search = '', role = '' } = req.query;
      const offset = (page - 1) * limit;
      
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { '$Profile.firstName$': { [Op.iLike]: `%${search}%` } },
          { '$Profile.lastName$': { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (role) {
        whereClause.role = role;
      }
      
      const users = await User.findAndCountAll({
        where: whereClause,
        include: [{
          model: Profile,
          attributes: ['firstName', 'lastName', 'profilePicture', 'company', 'position', 'graduationYear']
        }],
        attributes: ['id', 'email', 'role', 'createdAt'],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      res.json({
        users: users.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.count / limit),
          totalUsers: users.count,
          hasNext: offset + users.rows.length < users.count,
          hasPrev: page > 1
        }
      });
      
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  },
  
  // Get user contacts for chat
  getUserContacts: async (req, res) => {
    try {
      const currentUserId = req.session.user.id;
      
      // Get all users except current user
      const contacts = await User.findAll({
        where: {
          id: { [Op.ne]: currentUserId }
        },
        include: [{
          model: Profile,
          attributes: ['firstName', 'lastName', 'profilePicture', 'company', 'position', 'graduationYear', 'university']
        }],
        attributes: ['id', 'email', 'role', 'createdAt'],
        order: [
          [Profile, 'firstName', 'ASC'],
          [Profile, 'lastName', 'ASC']
        ]
      });
      
      // Format contacts for chat interface
      const formattedContacts = contacts.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.Profile?.firstName || 'Unknown',
        lastName: user.Profile?.lastName || 'User',
        profilePicture: user.Profile?.profilePicture || null,
        company: user.Profile?.company || null,
        position: user.Profile?.position || null,
        graduationYear: user.Profile?.graduationYear || null,
        university: user.Profile?.university || null,
        isOnline: false, // Will be updated by Socket.io
        lastSeen: null   // Will be updated by Socket.io
      }));
      
      res.json(formattedContacts);
      
    } catch (error) {
      console.error('Error fetching user contacts:', error);
      res.status(500).json({
        error: 'Failed to fetch contacts',
        message: error.message
      });
    }
  },
  
  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.session.user.id;
      
      const user = await User.findByPk(id, {
        include: [{
          model: Profile,
          attributes: [
            'firstName', 'lastName', 'bio', 'profilePicture', 
            'company', 'position', 'graduationYear', 'university', 
            'major', 'linkedinUrl', 'githubUrl'
          ]
        }],
        attributes: ['id', 'email', 'role', 'createdAt']
      });
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Format user data
      const userData = {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
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
        isOwnProfile: user.id === currentUserId
      };
      
      res.json(userData);
      
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        error: 'Failed to fetch user',
        message: error.message
      });
    }
  },
  
  // Update user profile (basic info)
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.session.user.id;
      const { email, role } = req.body;
      
      // Check if user can update this profile
      if (id != currentUserId && req.session.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Unauthorized to update this user'
        });
      }
      
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Update user data
      const updateData = {};
      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
        if (existingUser) {
          return res.status(400).json({
            error: 'Email already in use'
          });
        }
        updateData.email = email;
      }
      
      // Only admins can change roles
      if (role && req.session.user.role === 'admin') {
        updateData.role = role;
      }
      
      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
      }
      
      res.json({
        message: 'User updated successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
      
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        error: 'Failed to update user',
        message: error.message
      });
    }
  },
  
  // Get user statistics
  getUserStats: async (req, res) => {
    try {
      const stats = await User.findAll({
        attributes: [
          'role',
          [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
        ],
        group: ['role']
      });
      
      const totalUsers = await User.count();
      const recentUsers = await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });
      
      res.json({
        totalUsers,
        recentUsers,
        roleDistribution: stats.reduce((acc, stat) => {
          acc[stat.role] = parseInt(stat.dataValues.count);
          return acc;
        }, {})
      });
      
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        error: 'Failed to fetch user statistics',
        message: error.message
      });
    }
  }
};

module.exports = userController;
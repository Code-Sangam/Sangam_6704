const { User, Profile, Message } = require('../models');
const { Op } = require('sequelize');

const dashboardController = {
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      
      let stats = {};
      
      if (userRole === 'student') {
        // Student statistics
        const [connectionsCount, messagesCount] = await Promise.all([
          // Count unique users the student has messaged with
          Message.count({
            where: {
              [Op.or]: [
                { senderId: userId },
                { receiverId: userId }
              ]
            },
            distinct: true,
            col: 'senderId'
          }),
          // Count total messages sent/received
          Message.count({
            where: {
              [Op.or]: [
                { senderId: userId },
                { receiverId: userId }
              ]
            }
          })
        ]);
        
        stats = {
          connections: Math.min(connectionsCount, 50), // Cap for demo
          messages: messagesCount,
          events: Math.floor(Math.random() * 10) + 2, // Mock data
          skills: Math.floor(Math.random() * 15) + 5 // Mock data
        };
        
      } else if (userRole === 'alumni') {
        // Alumni statistics
        const [menteesCount, messagesCount] = await Promise.all([
          // Count students who have messaged this alumni
          Message.count({
            where: { receiverId: userId },
            distinct: true,
            col: 'senderId'
          }),
          Message.count({
            where: {
              [Op.or]: [
                { senderId: userId },
                { receiverId: userId }
              ]
            }
          })
        ]);
        
        stats = {
          mentees: menteesCount,
          rating: 4.7 + (Math.random() * 0.3), // Mock rating
          mentoringHours: Math.floor(messagesCount / 10) + 15, // Estimate based on messages
          experienceYears: Math.floor(Math.random() * 10) + 3 // Mock data
        };
        
      } else if (userRole === 'faculty') {
        // Faculty statistics
        const messagesCount = await Message.count({
          where: {
            [Op.or]: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        });
        
        stats = {
          students: Math.floor(messagesCount / 5) + 20, // Estimate
          courses: Math.floor(Math.random() * 8) + 3, // Mock data
          publications: Math.floor(Math.random() * 25) + 5, // Mock data
          achievements: Math.floor(Math.random() * 12) + 3 // Mock data
        };
      }
      
      res.json(stats);
      
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch dashboard statistics',
        message: error.message
      });
    }
  },
  
  // Get recent activity
  getRecentActivity: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      
      // Get recent messages as activity
      const recentMessages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'sender',
            include: [{
              model: Profile,
              attributes: ['firstName', 'lastName']
            }],
            attributes: ['id', 'role']
          },
          {
            model: User,
            as: 'receiver',
            include: [{
              model: Profile,
              attributes: ['firstName', 'lastName']
            }],
            attributes: ['id', 'role']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      
      // Convert messages to activity format
      const activities = recentMessages.map(message => {
        const isOwnMessage = message.senderId === userId;
        const otherUser = isOwnMessage ? message.receiver : message.sender;
        const otherUserName = otherUser.Profile ? 
          `${otherUser.Profile.firstName} ${otherUser.Profile.lastName}` : 
          'Unknown User';
        
        return {
          id: message.id,
          type: 'message',
          title: isOwnMessage ? 
            `Sent message to ${otherUserName}` : 
            `Received message from ${otherUserName}`,
          description: message.content.length > 50 ? 
            message.content.substring(0, 50) + '...' : 
            message.content,
          timestamp: message.createdAt
        };
      });
      
      // Add some mock activities for variety
      const mockActivities = [
        {
          id: 'profile-update',
          type: 'profile',
          title: 'Profile updated',
          description: 'Updated bio and contact information',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: 'connection-made',
          type: 'connection',
          title: 'New connection made',
          description: 'Connected with a fellow alumni',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        }
      ];
      
      // Combine and sort activities
      const allActivities = [...activities, ...mockActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8);
      
      res.json(allActivities);
      
    } catch (error) {
      console.error('Recent activity error:', error);
      res.status(500).json({
        error: 'Failed to fetch recent activity',
        message: error.message
      });
    }
  },
  
  // Get connections/network
  getConnections: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      
      // Get users who have had conversations with current user
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: [
          {
            model: User,
            as: 'sender',
            include: [{
              model: Profile,
              attributes: ['firstName', 'lastName', 'profilePicture', 'company', 'university']
            }],
            attributes: ['id', 'role']
          },
          {
            model: User,
            as: 'receiver',
            include: [{
              model: Profile,
              attributes: ['firstName', 'lastName', 'profilePicture', 'company', 'university']
            }],
            attributes: ['id', 'role']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 50
      });
      
      // Extract unique connections
      const connectionsMap = new Map();
      
      messages.forEach(message => {
        const otherUser = message.senderId === userId ? message.receiver : message.sender;
        
        if (!connectionsMap.has(otherUser.id)) {
          const profile = otherUser.Profile;
          connectionsMap.set(otherUser.id, {
            id: otherUser.id,
            name: profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown User',
            role: otherUser.role,
            profilePicture: profile?.profilePicture || null,
            company: profile?.company || null,
            university: profile?.university || null,
            isOnline: Math.random() > 0.5, // Mock online status
            lastMessage: message.createdAt
          });
        }
      });
      
      const connections = Array.from(connectionsMap.values())
        .sort((a, b) => new Date(b.lastMessage) - new Date(a.lastMessage));
      
      res.json(connections);
      
    } catch (error) {
      console.error('Connections error:', error);
      res.status(500).json({
        error: 'Failed to fetch connections',
        message: error.message
      });
    }
  },
  
  // Get upcoming events
  getUpcomingEvents: async (req, res) => {
    try {
      const userId = req.session.user.id;
      const userRole = req.session.user.role;
      
      // Mock events data - in a real app, you'd have an Events table
      const mockEvents = [
        {
          id: 1,
          title: 'Alumni Networking Event',
          description: 'Connect with fellow alumni in your area',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          type: 'networking'
        },
        {
          id: 2,
          title: 'Career Development Workshop',
          description: 'Learn about career advancement strategies',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          type: 'workshop'
        },
        {
          id: 3,
          title: 'Tech Talk: AI in Industry',
          description: 'Industry experts discuss AI applications',
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          type: 'tech-talk'
        }
      ];
      
      // Filter events based on user role
      let relevantEvents = mockEvents;
      
      if (userRole === 'student') {
        relevantEvents = mockEvents.filter(event => 
          event.type === 'workshop' || event.type === 'tech-talk'
        );
      } else if (userRole === 'alumni') {
        relevantEvents = mockEvents.filter(event => 
          event.type === 'networking' || event.type === 'tech-talk'
        );
      }
      
      res.json(relevantEvents);
      
    } catch (error) {
      console.error('Upcoming events error:', error);
      res.status(500).json({
        error: 'Failed to fetch upcoming events',
        message: error.message
      });
    }
  }
};

module.exports = dashboardController;
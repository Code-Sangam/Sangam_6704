const { Message, User, Profile } = require('../models');
const { Op } = require('sequelize');

class ChatService {
  // Format message for API response
  static formatMessage(message, currentUserId = null) {
    const isOwnMessage = currentUserId && message.senderId === currentUserId;
    
    return {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.isDeleted ? '[This message was deleted]' : message.content,
      messageType: message.messageType,
      timestamp: message.createdAt,
      readAt: message.readAt,
      isEdited: message.isEdited || false,
      editedAt: message.editedAt || null,
      isDeleted: message.isDeleted || false,
      deletedAt: message.deletedAt || null,
      isOwnMessage,
      canEdit: isOwnMessage && this.canMessageBeEdited(message),
      canDelete: isOwnMessage || message.receiverId === currentUserId,
      sender: message.sender ? {
        id: message.sender.id,
        firstName: message.sender.Profile?.firstName || 'Unknown',
        lastName: message.sender.Profile?.lastName || 'User',
        profilePicture: message.sender.Profile?.profilePicture || null,
        role: message.sender.role
      } : null,
      receiver: message.receiver ? {
        id: message.receiver.id,
        firstName: message.receiver.Profile?.firstName || 'Unknown',
        lastName: message.receiver.Profile?.lastName || 'User',
        profilePicture: message.receiver.Profile?.profilePicture || null,
        role: message.receiver.role
      } : null
    };
  }
  
  // Check if message can be edited
  static canMessageBeEdited(message) {
    if (message.isDeleted || message.messageType !== 'text') {
      return false;
    }
    
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return message.createdAt > fifteenMinutesAgo;
  }
  
  // Check if message can be deleted for everyone
  static canMessageBeDeletedForEveryone(message, userId) {
    if (message.senderId !== userId) {
      return false;
    }
    
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return message.createdAt > fifteenMinutesAgo;
  }
  
  // Get conversation participants
  static async getConversationParticipants(userId1, userId2) {
    const users = await User.findAll({
      where: {
        id: { [Op.in]: [userId1, userId2] }
      },
      include: [{
        model: Profile,
        attributes: ['firstName', 'lastName', 'profilePicture']
      }],
      attributes: ['id', 'email', 'role']
    });
    
    return users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.Profile?.firstName || 'Unknown',
      lastName: user.Profile?.lastName || 'User',
      profilePicture: user.Profile?.profilePicture || null
    }));
  }
  
  // Build message query with includes
  static getMessageQueryIncludes() {
    return [
      {
        model: User,
        as: 'sender',
        include: [{
          model: Profile,
          attributes: ['firstName', 'lastName', 'profilePicture']
        }],
        attributes: ['id', 'email', 'role']
      },
      {
        model: User,
        as: 'receiver',
        include: [{
          model: Profile,
          attributes: ['firstName', 'lastName', 'profilePicture']
        }],
        attributes: ['id', 'email', 'role']
      }
    ];
  }
  
  // Get unread message count for user
  static async getUnreadMessageCount(userId, fromUserId = null) {
    const whereClause = {
      receiverId: userId,
      readAt: null
    };
    
    if (fromUserId) {
      whereClause.senderId = fromUserId;
    }
    
    return await Message.count({ where: whereClause });
  }
  
  // Mark conversation messages as read
  static async markConversationAsRead(currentUserId, otherUserId) {
    const updatedCount = await Message.update(
      { readAt: new Date() },
      {
        where: {
          senderId: otherUserId,
          receiverId: currentUserId,
          readAt: null
        }
      }
    );
    
    return updatedCount[0];
  }
  
  // Get recent conversations with last message and unread count
  static async getRecentConversations(userId, limit = 20) {
    // Get all messages involving the user
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: this.getMessageQueryIncludes(),
      order: [['createdAt', 'DESC']],
      limit: 100 // Get more to ensure we have recent conversations
    });
    
    // Group by conversation partner
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === userId ? message.receiver : message.sender;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          user: {
            id: otherUser.id,
            firstName: otherUser.Profile?.firstName || 'Unknown',
            lastName: otherUser.Profile?.lastName || 'User',
            profilePicture: otherUser.Profile?.profilePicture || null,
            role: otherUser.role,
            email: otherUser.email
          },
          lastMessage: {
            id: message.id,
            content: message.isDeleted ? '[This message was deleted]' : message.content,
            timestamp: message.createdAt,
            senderId: message.senderId,
            messageType: message.messageType,
            isRead: !!message.readAt
          },
          unreadCount: 0,
          lastActivity: message.createdAt
        });
      }
      
      // Count unread messages from this user
      if (message.receiverId === userId && !message.readAt) {
        const conversation = conversationMap.get(otherUserId);
        conversation.unreadCount++;
      }
    });
    
    // Convert to array and sort by last activity
    return Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      .slice(0, limit);
  }
  
  // Search messages with highlighting
  static async searchMessages(userId, query, options = {}) {
    const {
      page = 1,
      limit = 20,
      messageType = '',
      conversationWith = '',
      dateFrom = '',
      dateTo = ''
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {
      [Op.or]: [
        { senderId: userId },
        { receiverId: userId }
      ],
      content: {
        [Op.iLike]: `%${query}%`
      }
    };
    
    // Add filters
    if (messageType) {
      whereClause.messageType = messageType;
    }
    
    if (conversationWith) {
      whereClause[Op.or] = [
        { senderId: userId, receiverId: conversationWith },
        { senderId: conversationWith, receiverId: userId }
      ];
    }
    
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt[Op.lte] = new Date(dateTo);
      }
    }
    
    const messages = await Message.findAndCountAll({
      where: whereClause,
      include: this.getMessageQueryIncludes(),
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Format messages with search highlighting
    const formattedMessages = messages.rows.map(message => {
      const formatted = this.formatMessage(message, userId);
      
      // Add conversation context
      const otherUser = message.senderId === userId ? message.receiver : message.sender;
      formatted.conversationWith = {
        id: otherUser.id,
        firstName: otherUser.Profile?.firstName || 'Unknown',
        lastName: otherUser.Profile?.lastName || 'User',
        profilePicture: otherUser.Profile?.profilePicture || null
      };
      
      // Highlight search terms (simple implementation)
      if (!message.isDeleted) {
        formatted.highlightedContent = this.highlightSearchTerms(message.content, query);
      }
      
      return formatted;
    });
    
    return {
      messages: formattedMessages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(messages.count / limit),
        totalMessages: messages.count,
        hasNext: offset + messages.rows.length < messages.count,
        hasPrev: page > 1
      }
    };
  }
  
  // Simple search term highlighting
  static highlightSearchTerms(content, query) {
    if (!query || !content) return content;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(regex, '<mark>$1</mark>');
  }
  
  // Get message statistics for a conversation
  static async getConversationStatistics(userId, otherUserId) {
    const whereClause = {
      [Op.or]: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    };
    
    const [
      totalMessages,
      unreadMessages,
      messagesSent,
      messagesReceived,
      firstMessage,
      lastMessage,
      messagesByType,
      messagesByDay
    ] = await Promise.all([
      Message.count({ where: whereClause }),
      Message.count({ 
        where: { 
          ...whereClause, 
          receiverId: userId, 
          readAt: null 
        } 
      }),
      Message.count({ 
        where: { 
          senderId: userId, 
          receiverId: otherUserId 
        } 
      }),
      Message.count({ 
        where: { 
          senderId: otherUserId, 
          receiverId: userId 
        } 
      }),
      Message.findOne({ 
        where: whereClause, 
        order: [['createdAt', 'ASC']] 
      }),
      Message.findOne({ 
        where: whereClause, 
        order: [['createdAt', 'DESC']] 
      }),
      Message.findAll({
        where: whereClause,
        attributes: [
          'messageType',
          [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'count']
        ],
        group: ['messageType']
      }),
      Message.findAll({
        where: whereClause,
        attributes: [
          [Message.sequelize.fn('DATE', Message.sequelize.col('createdAt')), 'date'],
          [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'count']
        ],
        group: [Message.sequelize.fn('DATE', Message.sequelize.col('createdAt'))],
        order: [[Message.sequelize.fn('DATE', Message.sequelize.col('createdAt')), 'DESC']],
        limit: 30 // Last 30 days
      })
    ]);
    
    return {
      totalMessages,
      unreadMessages,
      messagesSent,
      messagesReceived,
      firstMessageDate: firstMessage?.createdAt || null,
      lastMessageDate: lastMessage?.createdAt || null,
      messagesByType: messagesByType.reduce((acc, item) => {
        acc[item.messageType] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
      messagesByDay: messagesByDay.map(item => ({
        date: item.dataValues.date,
        count: parseInt(item.dataValues.count)
      }))
    };
  }
}

module.exports = ChatService;
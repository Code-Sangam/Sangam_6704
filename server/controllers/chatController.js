const { Message, User, Profile } = require('../models');
const { Op } = require('sequelize');
const ChatService = require('../services/chatService');

const chatController = {
  // Get chat messages between current user and another user
  getChatMessages: async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.session.user.id;
      const { 
        page = 1, 
        limit = 50, 
        search = '', 
        messageType = '', 
        dateFrom = '', 
        dateTo = '',
        unreadOnly = false 
      } = req.query;
      const offset = (page - 1) * limit;
      
      // Validate that the other user exists
      const otherUser = await User.findByPk(userId);
      if (!otherUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Build where clause with filters
      const whereClause = {
        [Op.or]: [
          {
            senderId: currentUserId,
            receiverId: userId
          },
          {
            senderId: userId,
            receiverId: currentUserId
          }
        ]
      };
      
      // Add search filter
      if (search) {
        whereClause.content = {
          [Op.iLike]: `%${search}%`
        };
      }
      
      // Add message type filter
      if (messageType) {
        whereClause.messageType = messageType;
      }
      
      // Add date range filter
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt[Op.gte] = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.createdAt[Op.lte] = new Date(dateTo);
        }
      }
      
      // Add unread filter
      if (unreadOnly === 'true') {
        whereClause.readAt = null;
        whereClause.receiverId = currentUserId;
      }
      
      // Get messages between the two users
      const messages = await Message.findAndCountAll({
        where: whereClause,
        include: ChatService.getMessageQueryIncludes(),
        order: [['createdAt', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      // Format messages for frontend
      const formattedMessages = messages.rows.map(message => 
        ChatService.formatMessage(message, currentUserId)
      );
      
      res.json({
        messages: formattedMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(messages.count / limit),
          totalMessages: messages.count,
          hasNext: offset + messages.rows.length < messages.count,
          hasPrev: page > 1
        }
      });
      
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({
        error: 'Failed to fetch messages',
        message: error.message
      });
    }
  },
  
  // Send a message (HTTP endpoint - mainly for fallback)
  sendMessage: async (req, res) => {
    try {
      const { receiverId, content, messageType = 'text' } = req.body;
      const senderId = req.session.user.id;
      
      // Validate input
      if (!receiverId || !content || !content.trim()) {
        return res.status(400).json({
          error: 'Receiver ID and message content are required'
        });
      }
      
      // Validate that receiver exists
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return res.status(404).json({
          error: 'Receiver not found'
        });
      }
      
      // Create message
      const message = await Message.create({
        senderId,
        receiverId,
        content: content.trim(),
        messageType
      });
      
      // Get message with user details
      const messageWithDetails = await Message.findByPk(message.id, {
        include: [
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
        ]
      });
      
      // Format message for response
      const formattedMessage = {
        id: messageWithDetails.id,
        senderId: messageWithDetails.senderId,
        receiverId: messageWithDetails.receiverId,
        content: messageWithDetails.content,
        messageType: messageWithDetails.messageType,
        timestamp: messageWithDetails.createdAt,
        readAt: messageWithDetails.readAt,
        sender: {
          id: messageWithDetails.sender.id,
          firstName: messageWithDetails.sender.Profile?.firstName || 'Unknown',
          lastName: messageWithDetails.sender.Profile?.lastName || 'User',
          profilePicture: messageWithDetails.sender.Profile?.profilePicture || null
        },
        receiver: {
          id: messageWithDetails.receiver.id,
          firstName: messageWithDetails.receiver.Profile?.firstName || 'Unknown',
          lastName: messageWithDetails.receiver.Profile?.lastName || 'User',
          profilePicture: messageWithDetails.receiver.Profile?.profilePicture || null
        }
      };
      
      res.status(201).json({
        message: 'Message sent successfully',
        data: formattedMessage
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        message: error.message
      });
    }
  },
  
  // Get active users (from Socket.io)
  getActiveUsers: async (req, res) => {
    try {
      // This would typically get active users from Socket.io
      // For now, we'll return a placeholder response
      // The actual active users are managed by the Socket.io server
      
      res.json({
        message: 'Active users are managed by Socket.io',
        activeUsers: [],
        note: 'Use Socket.io events to get real-time active user data'
      });
      
    } catch (error) {
      console.error('Error fetching active users:', error);
      res.status(500).json({
        error: 'Failed to fetch active users',
        message: error.message
      });
    }
  },
  
  // Mark messages as read
  markMessagesAsRead: async (req, res) => {
    try {
      const { senderId } = req.body;
      const receiverId = req.session.user.id;
      
      if (!senderId) {
        return res.status(400).json({
          error: 'Sender ID is required'
        });
      }
      
      // Mark all unread messages from sender as read
      const updatedMessages = await Message.update(
        { readAt: new Date() },
        {
          where: {
            senderId: senderId,
            receiverId: receiverId,
            readAt: null
          },
          returning: true
        }
      );
      
      res.json({
        message: 'Messages marked as read',
        updatedCount: updatedMessages[0]
      });
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        error: 'Failed to mark messages as read',
        message: error.message
      });
    }
  },
  
  // Get conversation list for current user
  getConversations: async (req, res) => {
    try {
      const currentUserId = req.session.user.id;
      const { limit = 20 } = req.query;
      
      const conversations = await ChatService.getRecentConversations(currentUserId, parseInt(limit));
      
      res.json(conversations);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({
        error: 'Failed to fetch conversations',
        message: error.message
      });
    }
  },
  
  // Search messages across all conversations
  searchMessages: async (req, res) => {
    try {
      const currentUserId = req.session.user.id;
      const { 
        query = '', 
        page = 1, 
        limit = 20, 
        messageType = '',
        userId = '',
        dateFrom = '',
        dateTo = ''
      } = req.query;
      
      if (!query.trim()) {
        return res.status(400).json({
          error: 'Search query is required'
        });
      }
      
      const result = await ChatService.searchMessages(currentUserId, query, {
        page: parseInt(page),
        limit: parseInt(limit),
        messageType,
        conversationWith: userId,
        dateFrom,
        dateTo
      });
      
      res.json({
        ...result,
        searchQuery: query
      });
      
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({
        error: 'Failed to search messages',
        message: error.message
      });
    }
  },
  
  // Get message history with advanced pagination
  getMessageHistory: async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.session.user.id;
      const { 
        before = '', 
        after = '', 
        limit = 50,
        messageId = ''
      } = req.query;
      
      // Validate that the other user exists
      const otherUser = await User.findByPk(userId);
      if (!otherUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Build where clause
      const whereClause = {
        [Op.or]: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      };
      
      // Add cursor-based pagination
      if (before) {
        whereClause.createdAt = { [Op.lt]: new Date(before) };
      } else if (after) {
        whereClause.createdAt = { [Op.gt]: new Date(after) };
      } else if (messageId) {
        // Load messages around a specific message
        const targetMessage = await Message.findByPk(messageId);
        if (targetMessage) {
          const halfLimit = Math.floor(limit / 2);
          
          // Get messages before and after the target message
          const [messagesBefore, messagesAfter] = await Promise.all([
            Message.findAll({
              where: {
                ...whereClause,
                createdAt: { [Op.lt]: targetMessage.createdAt }
              },
              include: [
                {
                  model: User,
                  as: 'sender',
                  include: [{ model: Profile, attributes: ['firstName', 'lastName', 'profilePicture'] }],
                  attributes: ['id', 'email', 'role']
                },
                {
                  model: User,
                  as: 'receiver',
                  include: [{ model: Profile, attributes: ['firstName', 'lastName', 'profilePicture'] }],
                  attributes: ['id', 'email', 'role']
                }
              ],
              order: [['createdAt', 'DESC']],
              limit: halfLimit
            }),
            Message.findAll({
              where: {
                ...whereClause,
                createdAt: { [Op.gte]: targetMessage.createdAt }
              },
              include: [
                {
                  model: User,
                  as: 'sender',
                  include: [{ model: Profile, attributes: ['firstName', 'lastName', 'profilePicture'] }],
                  attributes: ['id', 'email', 'role']
                },
                {
                  model: User,
                  as: 'receiver',
                  include: [{ model: Profile, attributes: ['firstName', 'lastName', 'profilePicture'] }],
                  attributes: ['id', 'email', 'role']
                }
              ],
              order: [['createdAt', 'ASC']],
              limit: halfLimit + 1
            })
          ]);
          
          const allMessages = [...messagesBefore.reverse(), ...messagesAfter];
          const formattedMessages = allMessages.map(message => ({
            id: message.id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            content: message.content,
            messageType: message.messageType,
            timestamp: message.createdAt,
            readAt: message.readAt,
            isTarget: message.id === parseInt(messageId),
            sender: {
              id: message.sender.id,
              firstName: message.sender.Profile?.firstName || 'Unknown',
              lastName: message.sender.Profile?.lastName || 'User',
              profilePicture: message.sender.Profile?.profilePicture || null
            }
          }));
          
          return res.json({
            messages: formattedMessages,
            targetMessageId: messageId,
            hasMore: true
          });
        }
      }
      
      // Regular pagination
      const messages = await Message.findAll({
        where: whereClause,
        include: [
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
        ],
        order: [['createdAt', after ? 'ASC' : 'DESC']],
        limit: parseInt(limit)
      });
      
      const formattedMessages = messages.map(message => ({
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        messageType: message.messageType,
        timestamp: message.createdAt,
        readAt: message.readAt,
        sender: {
          id: message.sender.id,
          firstName: message.sender.Profile?.firstName || 'Unknown',
          lastName: message.sender.Profile?.lastName || 'User',
          profilePicture: message.sender.Profile?.profilePicture || null
        }
      }));
      
      // Reverse if we're loading newer messages
      if (after) {
        formattedMessages.reverse();
      }
      
      res.json({
        messages: formattedMessages,
        hasMore: messages.length === parseInt(limit),
        cursor: messages.length > 0 ? messages[messages.length - 1].createdAt : null
      });
      
    } catch (error) {
      console.error('Error fetching message history:', error);
      res.status(500).json({
        error: 'Failed to fetch message history',
        message: error.message
      });
    }
  },
  
  // Delete a message
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const currentUserId = req.session.user.id;
      const { deleteForEveryone = false } = req.body;
      
      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json({
          error: 'Message not found'
        });
      }
      
      // Check if user can delete this message
      const canDelete = message.senderId === currentUserId || message.receiverId === currentUserId;
      if (!canDelete) {
        return res.status(403).json({
          error: 'You can only delete your own messages or messages sent to you'
        });
      }
      
      // Check if sender wants to delete for everyone (within 15 minutes)
      if (deleteForEveryone && message.senderId === currentUserId) {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (message.createdAt > fifteenMinutesAgo) {
          await message.update({
            content: '[This message was deleted]',
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: currentUserId
          });
        } else {
          return res.status(400).json({
            error: 'Messages can only be deleted for everyone within 15 minutes of sending'
          });
        }
      } else {
        // Soft delete - mark as deleted for this user only
        await message.update({
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: currentUserId
        });
      }
      
      res.json({
        message: 'Message deleted successfully',
        deletedForEveryone: deleteForEveryone && message.senderId === currentUserId
      });
      
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        error: 'Failed to delete message',
        message: error.message
      });
    }
  },
  
  // Edit a message
  editMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const currentUserId = req.session.user.id;
      
      if (!content || !content.trim()) {
        return res.status(400).json({
          error: 'Message content is required'
        });
      }
      
      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json({
          error: 'Message not found'
        });
      }
      
      // Check if user can edit this message
      if (message.senderId !== currentUserId) {
        return res.status(403).json({
          error: 'You can only edit your own messages'
        });
      }
      
      // Check if message can be edited (within 15 minutes and text type)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (message.createdAt <= fifteenMinutesAgo) {
        return res.status(400).json({
          error: 'Messages can only be edited within 15 minutes of sending'
        });
      }
      
      if (message.messageType !== 'text') {
        return res.status(400).json({
          error: 'Only text messages can be edited'
        });
      }
      
      if (message.isDeleted) {
        return res.status(400).json({
          error: 'Deleted messages cannot be edited'
        });
      }
      
      // Update message
      await message.update({
        content: content.trim(),
        isEdited: true,
        editedAt: new Date()
      });
      
      // Get updated message with user details
      const updatedMessage = await Message.findByPk(messageId, {
        include: [
          {
            model: User,
            as: 'sender',
            include: [{
              model: Profile,
              attributes: ['firstName', 'lastName', 'profilePicture']
            }],
            attributes: ['id', 'email', 'role']
          }
        ]
      });
      
      const formattedMessage = {
        id: updatedMessage.id,
        senderId: updatedMessage.senderId,
        receiverId: updatedMessage.receiverId,
        content: updatedMessage.content,
        messageType: updatedMessage.messageType,
        timestamp: updatedMessage.createdAt,
        readAt: updatedMessage.readAt,
        isEdited: updatedMessage.isEdited,
        editedAt: updatedMessage.editedAt,
        sender: {
          id: updatedMessage.sender.id,
          firstName: updatedMessage.sender.Profile?.firstName || 'Unknown',
          lastName: updatedMessage.sender.Profile?.lastName || 'User',
          profilePicture: updatedMessage.sender.Profile?.profilePicture || null
        }
      };
      
      res.json({
        message: 'Message updated successfully',
        data: formattedMessage
      });
      
    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({
        error: 'Failed to edit message',
        message: error.message
      });
    }
  },
  
  // Upload file and send as message
  uploadFile: async (req, res) => {
    try {
      const { receiverId, messageType = 'file' } = req.body;
      const senderId = req.session.user.id;
      
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded'
        });
      }
      
      if (!receiverId) {
        return res.status(400).json({
          error: 'Receiver ID is required'
        });
      }
      
      // Validate that receiver exists
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return res.status(404).json({
          error: 'Receiver not found'
        });
      }
      
      const file = req.file;
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          error: 'File size exceeds 10MB limit'
        });
      }
      
      // Create file URL (assuming files are stored in uploads directory)
      const fileUrl = `/uploads/${file.filename}`;
      
      // Create message with file
      const message = await Message.create({
        senderId,
        receiverId,
        content: `[${messageType === 'image' ? 'Image' : 'File'}] ${file.originalname}`,
        messageType,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype
      });
      
      // Get message with user details
      const messageWithDetails = await Message.findByPk(message.id, {
        include: ChatService.getMessageQueryIncludes()
      });
      
      const formattedMessage = ChatService.formatMessage(messageWithDetails, senderId);
      
      res.status(201).json({
        message: 'File uploaded successfully',
        data: formattedMessage
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({
        error: 'Failed to upload file',
        message: error.message
      });
    }
  },
  
  // Get conversation statistics
  getConversationStats: async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.session.user.id;
      
      // Validate that the other user exists
      const otherUser = await User.findByPk(userId, {
        include: [{
          model: Profile,
          attributes: ['firstName', 'lastName', 'profilePicture']
        }]
      });
      
      if (!otherUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      const stats = await ChatService.getConversationStatistics(currentUserId, userId);
      
      res.json({
        ...stats,
        conversationWith: {
          id: otherUser.id,
          firstName: otherUser.Profile?.firstName || 'Unknown',
          lastName: otherUser.Profile?.lastName || 'User',
          profilePicture: otherUser.Profile?.profilePicture || null,
          role: otherUser.role
        }
      });
      
    } catch (error) {
      console.error('Error fetching conversation stats:', error);
      res.status(500).json({
        error: 'Failed to fetch conversation statistics',
        message: error.message
      });
    }
  }
};

module.exports = chatController;
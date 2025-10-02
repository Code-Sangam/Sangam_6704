// Socket.io handlers for real-time chat functionality

const chatSocket = (io) => {
  // Store active users and their socket connections
  const activeUsers = new Map();
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Handle user authentication and joining
    socket.on('user:join', (userData) => {
      if (userData && userData.id) {
        socket.userId = userData.id;
        socket.userRole = userData.role;
        
        // Store user connection
        activeUsers.set(userData.id, {
          socketId: socket.id,
          user: userData,
          lastSeen: new Date()
        });
        
        // Join user to their personal room
        socket.join(`user:${userData.id}`);
        
        // Broadcast user online status
        socket.broadcast.emit('user:online', {
          userId: userData.id,
          user: userData
        });
        
        console.log(`User ${userData.id} joined chat`);
      }
    });
    
    // Handle private messages
    socket.on('message:send', async (messageData) => {
      try {
        const { receiverId, content, messageType = 'text' } = messageData;
        
        if (!socket.userId) {
          socket.emit('error', { message: 'Authentication required' });
          return;
        }
        
        // Import Message model
        const { Message, User, Profile } = require('../models');
        
        // Save message to database
        const message = await Message.create({
          senderId: socket.userId,
          receiverId: receiverId,
          content: content.trim(),
          messageType: messageType
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
        
        // Format message for Socket.io
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
          }
        };
        
        // Send message to receiver if they're online
        const receiverConnection = activeUsers.get(receiverId);
        if (receiverConnection) {
          io.to(`user:${receiverId}`).emit('message:receive', formattedMessage);
        }
        
        // Send confirmation back to sender
        socket.emit('message:sent', formattedMessage);
        
        console.log(`Message sent from ${socket.userId} to ${receiverId}`);
        
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicators
    socket.on('typing:start', (data) => {
      if (socket.userId && data.receiverId) {
        const receiverConnection = activeUsers.get(data.receiverId);
        if (receiverConnection) {
          io.to(`user:${data.receiverId}`).emit('typing:start', {
            userId: socket.userId,
            user: activeUsers.get(socket.userId)?.user
          });
        }
      }
    });
    
    socket.on('typing:stop', (data) => {
      if (socket.userId && data.receiverId) {
        const receiverConnection = activeUsers.get(data.receiverId);
        if (receiverConnection) {
          io.to(`user:${data.receiverId}`).emit('typing:stop', {
            userId: socket.userId
          });
        }
      }
    });
    
    // Handle message read receipts
    socket.on('message:read', async (data) => {
      try {
        if (socket.userId && data.messageId && data.senderId) {
          // Import Message model
          const { Message } = require('../models');
          
          // Update message read status in database
          const message = await Message.findByPk(data.messageId);
          if (message && message.receiverId === socket.userId && !message.readAt) {
            await message.update({ readAt: new Date() });
            
            // Notify sender if they're online
            const senderConnection = activeUsers.get(data.senderId);
            if (senderConnection) {
              io.to(`user:${data.senderId}`).emit('message:read', {
                messageId: data.messageId,
                readBy: socket.userId,
                readAt: message.readAt
              });
            }
          }
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });
    
    // Handle message editing
    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;
        
        if (!socket.userId || !messageId || !content) {
          socket.emit('error', { message: 'Invalid edit data' });
          return;
        }
        
        const { Message, User, Profile } = require('../models');
        
        const message = await Message.findByPk(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        
        // Check permissions and time limit
        if (message.senderId !== socket.userId) {
          socket.emit('error', { message: 'You can only edit your own messages' });
          return;
        }
        
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        if (message.createdAt <= fifteenMinutesAgo) {
          socket.emit('error', { message: 'Messages can only be edited within 15 minutes' });
          return;
        }
        
        // Update message
        await message.update({
          content: content.trim(),
          isEdited: true,
          editedAt: new Date()
        });
        
        // Get updated message with details
        const updatedMessage = await Message.findByPk(messageId, {
          include: [
            {
              model: User,
              as: 'sender',
              include: [{ model: Profile, attributes: ['firstName', 'lastName', 'profilePicture'] }],
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
        
        // Notify both users
        socket.emit('message:edited', formattedMessage);
        const receiverConnection = activeUsers.get(message.receiverId);
        if (receiverConnection) {
          io.to(`user:${message.receiverId}`).emit('message:edited', formattedMessage);
        }
        
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });
    
    // Handle message deletion
    socket.on('message:delete', async (data) => {
      try {
        const { messageId, deleteForEveryone = false } = data;
        
        if (!socket.userId || !messageId) {
          socket.emit('error', { message: 'Invalid delete data' });
          return;
        }
        
        const { Message } = require('../models');
        
        const message = await Message.findByPk(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        
        // Check permissions
        const canDelete = message.senderId === socket.userId || message.receiverId === socket.userId;
        if (!canDelete) {
          socket.emit('error', { message: 'You can only delete your own messages' });
          return;
        }
        
        // Handle delete for everyone (sender only, within 15 minutes)
        if (deleteForEveryone && message.senderId === socket.userId) {
          const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
          if (message.createdAt > fifteenMinutesAgo) {
            await message.update({
              content: '[This message was deleted]',
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: socket.userId
            });
            
            // Notify both users
            const deleteData = { messageId, deletedForEveryone: true };
            socket.emit('message:deleted', deleteData);
            const receiverConnection = activeUsers.get(message.receiverId);
            if (receiverConnection) {
              io.to(`user:${message.receiverId}`).emit('message:deleted', deleteData);
            }
          } else {
            socket.emit('error', { message: 'Messages can only be deleted for everyone within 15 minutes' });
            return;
          }
        } else {
          // Soft delete for this user only
          await message.update({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: socket.userId
          });
          
          socket.emit('message:deleted', { messageId, deletedForEveryone: false });
        }
        
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });
    
    // Handle user disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        // Remove user from active users
        activeUsers.delete(socket.userId);
        
        // Broadcast user offline status
        socket.broadcast.emit('user:offline', {
          userId: socket.userId,
          lastSeen: new Date()
        });
        
        console.log(`User ${socket.userId} disconnected`);
      } else {
        console.log(`Anonymous user disconnected: ${socket.id}`);
      }
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
  
  // Utility function to get active users (for API endpoints)
  const getActiveUsers = () => {
    return Array.from(activeUsers.values()).map(connection => ({
      userId: connection.user.id,
      user: connection.user,
      lastSeen: connection.lastSeen
    }));
  };
  
  // Utility function to check if user is online
  const isUserOnline = (userId) => {
    return activeUsers.has(userId);
  };
  
  return {
    getActiveUsers,
    isUserOnline
  };
};

module.exports = chatSocket;
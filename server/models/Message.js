const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: {
          args: [1, 5000],
          msg: 'Message content must be between 1 and 5000 characters'
        },
        notEmpty: {
          msg: 'Message content cannot be empty'
        }
      }
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system'),
      defaultValue: 'text',
      allowNull: false,
      validate: {
        isIn: {
          args: [['text', 'image', 'file', 'system']],
          msg: 'Message type must be one of: text, image, file, system'
        }
      }
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'File URL must be a valid URL'
        }
      }
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'File name must be less than 255 characters'
        }
      }
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: 0,
          msg: 'File size cannot be negative'
        },
        max: {
          args: 50 * 1024 * 1024, // 50MB
          msg: 'File size cannot exceed 50MB'
        }
      }
    },
    file_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'File type must be less than 100 characters'
        }
      }
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    edited_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reply_to_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    thread_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Thread ID must be less than 50 characters'
        }
      }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      validate: {
        isValidJSON(value) {
          if (value && typeof value !== 'object') {
            throw new Error('Metadata must be a valid JSON object');
          }
        }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    
    indexes: [
      {
        fields: ['sender_id']
      },
      {
        fields: ['receiver_id']
      },
      {
        fields: ['sender_id', 'receiver_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['read_at']
      },
      {
        fields: ['message_type']
      },
      {
        fields: ['is_deleted']
      },
      {
        fields: ['thread_id']
      },
      {
        fields: ['reply_to_id']
      },
      {
        // Composite index for conversation queries
        fields: ['sender_id', 'receiver_id', 'created_at']
      },
      {
        // Index for unread messages
        fields: ['receiver_id', 'read_at']
      }
    ],
    
    scopes: {
      unread: {
        where: {
          read_at: null,
          is_deleted: false
        }
      },
      read: {
        where: {
          read_at: {
            [sequelize.Sequelize.Op.not]: null
          },
          is_deleted: false
        }
      },
      notDeleted: {
        where: {
          is_deleted: false
        }
      },
      byType: (type) => ({
        where: {
          message_type: type,
          is_deleted: false
        }
      }),
      conversation: (userId1, userId2) => ({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { sender_id: userId1, receiver_id: userId2 },
            { sender_id: userId2, receiver_id: userId1 }
          ],
          is_deleted: false
        },
        order: [['created_at', 'ASC']]
      }),
      recent: (limit = 50) => ({
        where: {
          is_deleted: false
        },
        order: [['created_at', 'DESC']],
        limit
      })
    },
    
    hooks: {
      beforeValidate: (message) => {
        // Trim content
        if (message.content) {
          message.content = message.content.trim();
        }
        
        // Set delivered_at if not set
        if (!message.delivered_at) {
          message.delivered_at = new Date();
        }
        
        // Validate file fields consistency
        if (message.message_type === 'file' || message.message_type === 'image') {
          if (!message.file_url) {
            throw new Error('File URL is required for file/image messages');
          }
        }
        
        // Generate thread_id for conversation if not provided
        if (!message.thread_id && message.sender_id && message.receiver_id) {
          const ids = [message.sender_id, message.receiver_id].sort();
          message.thread_id = `thread_${ids[0]}_${ids[1]}`;
        }
      },
      
      beforeUpdate: (message) => {
        message.updated_at = new Date();
        
        // Set edited timestamp if content changed
        if (message.changed('content') && !message.is_deleted) {
          message.is_edited = true;
          message.edited_at = new Date();
        }
      },
      
      afterCreate: async (message) => {
        // Log message creation (could trigger notifications here)
        console.log(`New message from ${message.sender_id} to ${message.receiver_id}`);
      }
    }
  });
  
  // Instance methods
  Message.prototype.markAsRead = async function(userId = null) {
    if (this.read_at) {
      return this; // Already read
    }
    
    // Only the receiver can mark as read
    if (userId && userId !== this.receiver_id) {
      throw new Error('Only the message receiver can mark it as read');
    }
    
    this.read_at = new Date();
    await this.save();
    return this;
  };
  
  Message.prototype.markAsDelivered = async function() {
    if (!this.delivered_at) {
      this.delivered_at = new Date();
      await this.save();
    }
    return this;
  };
  
  Message.prototype.softDelete = async function(deletedBy) {
    this.is_deleted = true;
    this.deleted_at = new Date();
    this.deleted_by = deletedBy;
    await this.save();
    return this;
  };
  
  Message.prototype.canBeEditedBy = function(userId) {
    // Only sender can edit, within 15 minutes, and not deleted
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return (
      this.sender_id === userId &&
      this.created_at > fifteenMinutesAgo &&
      !this.is_deleted &&
      this.message_type === 'text'
    );
  };
  
  Message.prototype.canBeDeletedBy = function(userId) {
    // Sender can delete anytime, receiver can delete from their view
    return (
      this.sender_id === userId || 
      this.receiver_id === userId
    ) && !this.is_deleted;
  };
  
  Message.prototype.getDisplayContent = function() {
    if (this.is_deleted) {
      return '[This message was deleted]';
    }
    
    switch (this.message_type) {
      case 'image':
        return '[Image]';
      case 'file':
        return `[File: ${this.file_name || 'Unknown'}]`;
      case 'system':
        return this.content;
      default:
        return this.content;
    }
  };
  
  Message.prototype.toJSON = function() {
    const values = { ...this.get() };
    
    // Add computed fields
    values.displayContent = this.getDisplayContent();
    values.isRead = !!this.read_at;
    values.isDelivered = !!this.delivered_at;
    
    return values;
  };
  
  return Message;
};
const { sequelize, Sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

// Import model definitions
const UserModel = require('./User');
const ProfileModel = require('./Profile');
const MessageModel = require('./Message');
const SessionModel = require('./Session');

// Initialize models
const User = UserModel(sequelize, Sequelize.DataTypes);
const Profile = ProfileModel(sequelize, Sequelize.DataTypes);
const Message = MessageModel(sequelize, Sequelize.DataTypes);
const Session = SessionModel(sequelize, Sequelize.DataTypes);

// Define associations
const defineAssociations = () => {
  // User - Profile relationship (One-to-One)
  User.hasOne(Profile, {
    foreignKey: 'user_id',
    as: 'profile',
    onDelete: 'CASCADE'
  });
  
  Profile.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // User - Message relationships (One-to-Many for sent and received messages)
  User.hasMany(Message, {
    foreignKey: 'sender_id',
    as: 'sentMessages',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Message, {
    foreignKey: 'receiver_id',
    as: 'receivedMessages',
    onDelete: 'CASCADE'
  });
  
  Message.belongsTo(User, {
    foreignKey: 'sender_id',
    as: 'sender'
  });
  
  Message.belongsTo(User, {
    foreignKey: 'receiver_id',
    as: 'receiver'
  });
  
  // User - Session relationship (One-to-Many)
  User.hasMany(Session, {
    foreignKey: 'user_id',
    as: 'sessions',
    onDelete: 'CASCADE'
  });
  
  Session.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

// Call association function
defineAssociations();

// Add instance methods to User model
User.prototype.validatePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password_hash);
  } catch (error) {
    console.error('Password validation error:', error);
    return false;
  }
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Remove sensitive information
  delete values.password_hash;
  delete values.deleted_at;
  
  return values;
};

// Add class methods to User model
User.hashPassword = async function(password) {
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

User.findByEmail = async function(email) {
  return await this.findOne({
    where: { email: email.toLowerCase() },
    include: [{
      model: Profile,
      as: 'profile'
    }]
  });
};

User.findByIdWithProfile = async function(id) {
  return await this.findByPk(id, {
    include: [{
      model: Profile,
      as: 'profile'
    }]
  });
};

// Add instance methods to Profile model
Profile.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`.trim();
};

Profile.prototype.getDisplayName = function() {
  const fullName = this.getFullName();
  return fullName || 'Anonymous User';
};

Profile.prototype.isComplete = function() {
  const requiredFields = ['first_name', 'last_name'];
  return requiredFields.every(field => this[field] && this[field].trim());
};

// Add class methods to Profile model
Profile.searchProfiles = async function(searchTerm, filters = {}) {
  const whereClause = {};
  
  if (searchTerm) {
    whereClause[Sequelize.Op.or] = [
      { first_name: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { last_name: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { company: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { position: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { university: { [Sequelize.Op.iLike]: `%${searchTerm}%` } },
      { major: { [Sequelize.Op.iLike]: `%${searchTerm}%` } }
    ];
  }
  
  // Apply filters
  if (filters.role) {
    whereClause['$user.role$']$'] = filters.role;
  }
  
  if (filters.graduationYear) {
    whereClause.graduation_year = filters.graduationYear;
  }
  
  if (filters.company) {
    whereClause.company = { [Sequelize.Op.iLike]: `%${filters.company}%` };
  }
  
  return await this.findAll({
    where: whereClause,
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'role', 'created_at']
    }],
    order: [['updated_at', 'DESC']],
    limit: filters.limit || 50
  });
};

// Add instance methods to Message model
Message.prototype.isRead = function() {
  return this.read_at !== null;
};

Message.prototype.markAsRead = async function() {
  if (!this.isRead()) {
    this.read_at = new Date();
    await this.save();
  }
  return this;
};

// Add class methods to Message model
Message.getConversation = async function(userId1, userId2, options = {}) {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  
  return await this.findAll({
    where: {
      [Sequelize.Op.or]: [
        { sender_id: userId1, receiver_id: userId2 },
        { sender_id: userId2, receiver_id: userId1 }
      ]
    },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'email'],
        include: [{
          model: Profile,
          as: 'profile',
          attributes: ['first_name', 'last_name', 'profile_picture']
        }]
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'email'],
        include: [{
          model: Profile,
          as: 'profile',
          attributes: ['first_name', 'last_name', 'profile_picture']
        }]
      }
    ],
    order: [['created_at', 'ASC']],
    limit,
    offset
  });
};

Message.getRecentConversations = async function(userId, limit = 20) {
  const conversations = await sequelize.query(`
    SELECT DISTINCT ON (conversation_partner) 
      conversation_partner,
      latest_message_id,
      latest_message_content,
      latest_message_time,
      unread_count
    FROM (
      SELECT 
        CASE 
          WHEN sender_id = :userId THEN receiver_id 
          ELSE sender_id 
        END as conversation_partner,
        id as latest_message_id,
        content as latest_message_content,
        created_at as latest_message_time,
        (
          SELECT COUNT(*) 
          FROM messages m2 
          WHERE m2.receiver_id = :userId 
            AND m2.sender_id = CASE 
              WHEN sender_id = :userId THEN receiver_id 
              ELSE sender_id 
            END
            AND m2.read_at IS NULL
        ) as unread_count,
        ROW_NUMBER() OVER (
          PARTITION BY CASE 
            WHEN sender_id = :userId THEN receiver_id 
            ELSE sender_id 
          END 
          ORDER BY created_at DESC
        ) as rn
      FROM messages 
      WHERE sender_id = :userId OR receiver_id = :userId
    ) ranked_messages
    WHERE rn = 1
    ORDER BY latest_message_time DESC
    LIMIT :limit
  `, {
    replacements: { userId, limit },
    type: Sequelize.QueryTypes.SELECT
  });
  
  return conversations;
};

// Database synchronization helper
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('📊 All models synchronized successfully');
  } catch (error) {
    console.error('❌ Model synchronization failed:', error);
    throw error;
  }
};

// Export models and utilities
module.exports = {
  sequelize,
  Sequelize,
  
  // Models
  User,
  Profile,
  Message,
  Session,
  
  // Utilities
  syncDatabase,
  defineAssociations
};
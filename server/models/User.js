const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: 'users_email_unique',
        msg: 'Email address is already registered'
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        },
        len: {
          args: [5, 255],
          msg: 'Email must be between 5 and 255 characters'
        }
      },
      set(value) {
        // Always store email in lowercase
        this.setDataValue('email', value ? value.toLowerCase().trim() : value);
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [60, 255],
          msg: 'Password hash must be properly formatted'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('student', 'alumni', 'faculty', 'admin'),
      allowNull: false,
      defaultValue: 'student',
      validate: {
        isIn: {
          args: [['student', 'alumni', 'faculty', 'admin']],
          msg: 'Role must be one of: student, alumni, faculty, admin'
        }
      }
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
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
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Enables soft deletes
    underscored: true,
    
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['email_verification_token']
      },
      {
        fields: ['password_reset_token']
      }
    ],
    
    scopes: {
      active: {
        where: {
          is_active: true,
          deleted_at: null
        }
      },
      verified: {
        where: {
          email_verified: true
        }
      },
      byRole: (role) => ({
        where: {
          role: role
        }
      }),
      withProfile: {
        include: [{
          association: 'profile'
        }]
      }
    },
    
    hooks: {
      beforeValidate: (user) => {
        // Trim and normalize email
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
      },
      
      beforeUpdate: (user) => {
        // Update the updated_at timestamp
        user.updated_at = new Date();
      },
      
      afterCreate: async (user) => {
        console.log(`New user created: ${user.email} (${user.role})`);
      },
      
      beforeDestroy: async (user) => {
        console.log(`User deleted: ${user.email}`);
      }
    }
  });
  
  // Instance methods
  User.prototype.isLocked = function() {
    return this.locked_until && this.locked_until > new Date();
  };
  
  User.prototype.incrementLoginAttempts = async function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.locked_until && this.locked_until < new Date()) {
      return await this.update({
        login_attempts: 1,
        locked_until: null
      });
    }
    
    const updates = { login_attempts: this.login_attempts + 1 };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.login_attempts + 1 >= 5 && !this.isLocked()) {
      updates.locked_until = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }
    
    return await this.update(updates);
  };
  
  User.prototype.resetLoginAttempts = async function() {
    return await this.update({
      login_attempts: 0,
      locked_until: null,
      last_login_at: new Date()
    });
  };
  
  User.prototype.generatePasswordResetToken = function() {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    this.password_reset_token = token;
    this.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    return token;
  };
  
  User.prototype.generateEmailVerificationToken = function() {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    this.email_verification_token = token;
    
    return token;
  };
  
  User.prototype.verifyEmail = async function() {
    return await this.update({
      email_verified: true,
      email_verification_token: null
    });
  };
  
  User.prototype.canReceiveMessages = function() {
    return this.is_active && this.email_verified && !this.isLocked();
  };
  
  User.prototype.getPublicProfile = function() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      emailVerified: this.email_verified,
      isActive: this.is_active,
      lastLoginAt: this.last_login_at,
      createdAt: this.created_at
    };
  };
  
  return User;
};
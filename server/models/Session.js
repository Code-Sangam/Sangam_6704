const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    sid: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      validate: {
        len: {
          args: [1, 36],
          msg: 'Session ID must be between 1 and 36 characters'
        }
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Expires must be a valid date'
        },
        isAfter: {
          args: new Date().toISOString(),
          msg: 'Session expiry must be in the future'
        }
      }
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isValidJSON(value) {
          if (value) {
            try {
              JSON.parse(value);
            } catch (error) {
              throw new Error('Session data must be valid JSON');
            }
          }
        }
      }
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
      validate: {
        isIP: {
          msg: 'Must be a valid IP address'
        }
      }
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'User agent must be less than 1000 characters'
        }
      }
    },
    device_type: {
      type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
      defaultValue: 'unknown',
      allowNull: false
    },
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Browser name must be less than 100 characters'
        }
      }
    },
    os: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Operating system must be less than 100 characters'
        }
      }
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Location must be less than 255 characters'
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    last_activity: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    login_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    logout_time: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'sessions',
    timestamps: true,
    underscored: true,
    
    indexes: [
      {
        unique: true,
        fields: ['sid']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['expires']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['last_activity']
      },
      {
        fields: ['ip_address']
      },
      {
        fields: ['created_at']
      },
      {
        // Composite index for active user sessions
        fields: ['user_id', 'is_active', 'expires']
      }
    ],
    
    scopes: {
      active: {
        where: {
          is_active: true,
          expires: {
            [sequelize.Sequelize.Op.gt]: new Date()
          }
        }
      },
      expired: {
        where: {
          expires: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      },
      byUser: (userId) => ({
        where: {
          user_id: userId
        }
      }),
      recent: (hours = 24) => ({
        where: {
          last_activity: {
            [sequelize.Sequelize.Op.gt]: new Date(Date.now() - hours * 60 * 60 * 1000)
          }
        }
      })
    },
    
    hooks: {
      beforeValidate: (session) => {
        // Parse user agent to extract device info
        if (session.user_agent && !session.device_type) {
          session.device_type = parseDeviceType(session.user_agent);
        }
        
        if (session.user_agent && !session.browser) {
          session.browser = parseBrowser(session.user_agent);
        }
        
        if (session.user_agent && !session.os) {
          session.os = parseOS(session.user_agent);
        }
        
        // Update last activity
        session.last_activity = new Date();
      },
      
      beforeUpdate: (session) => {
        session.updated_at = new Date();
        session.last_activity = new Date();
      },
      
      beforeDestroy: async (session) => {
        // Log session destruction
        console.log(`Session destroyed: ${session.sid}`);
      },
      
      afterCreate: async (session) => {
        // Clean up expired sessions periodically
        if (Math.random() < 0.01) { // 1% chance to trigger cleanup
          await Session.cleanupExpiredSessions();
        }
      }
    }
  });
  
  // Class methods
  Session.cleanupExpiredSessions = async function() {
    try {
      const deletedCount = await this.destroy({
        where: {
          expires: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      });
      
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired sessions`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  };
  
  Session.getActiveSessionsForUser = async function(userId) {
    return await this.findAll({
      where: {
        user_id: userId,
        is_active: true,
        expires: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      },
      order: [['last_activity', 'DESC']]
    });
  };
  
  Session.terminateUserSessions = async function(userId, exceptSessionId = null) {
    const whereClause = {
      user_id: userId,
      is_active: true
    };
    
    if (exceptSessionId) {
      whereClause.sid = {
        [sequelize.Sequelize.Op.ne]: exceptSessionId
      };
    }
    
    const updatedCount = await this.update(
      {
        is_active: false,
        logout_time: new Date()
      },
      {
        where: whereClause
      }
    );
    
    return updatedCount[0];
  };
  
  Session.getSessionStats = async function(userId = null) {
    const whereClause = userId ? { user_id: userId } : {};
    
    const [totalSessions, activeSessions, expiredSessions] = await Promise.all([
      this.count({ where: whereClause }),
      this.count({
        where: {
          ...whereClause,
          is_active: true,
          expires: { [sequelize.Sequelize.Op.gt]: new Date() }
        }
      }),
      this.count({
        where: {
          ...whereClause,
          expires: { [sequelize.Sequelize.Op.lt]: new Date() }
        }
      })
    ]);
    
    return {
      total: totalSessions,
      active: activeSessions,
      expired: expiredSessions,
      inactive: totalSessions - activeSessions - expiredSessions
    };
  };
  
  // Instance methods
  Session.prototype.isExpired = function() {
    return this.expires < new Date();
  };
  
  Session.prototype.isActive = function() {
    return this.is_active && !this.isExpired();
  };
  
  Session.prototype.terminate = async function() {
    this.is_active = false;
    this.logout_time = new Date();
    await this.save();
    return this;
  };
  
  Session.prototype.extend = async function(additionalTime = 24 * 60 * 60 * 1000) {
    // Extend session by additional time (default 24 hours)
    this.expires = new Date(this.expires.getTime() + additionalTime);
    this.last_activity = new Date();
    await this.save();
    return this;
  };
  
  Session.prototype.updateActivity = async function(ipAddress = null, userAgent = null) {
    this.last_activity = new Date();
    
    if (ipAddress) {
      this.ip_address = ipAddress;
    }
    
    if (userAgent) {
      this.user_agent = userAgent;
      this.device_type = parseDeviceType(userAgent);
      this.browser = parseBrowser(userAgent);
      this.os = parseOS(userAgent);
    }
    
    await this.save();
    return this;
  };
  
  Session.prototype.getSessionInfo = function() {
    return {
      id: this.sid,
      userId: this.user_id,
      isActive: this.isActive(),
      isExpired: this.isExpired(),
      deviceType: this.device_type,
      browser: this.browser,
      os: this.os,
      location: this.location,
      ipAddress: this.ip_address,
      loginTime: this.login_time,
      lastActivity: this.last_activity,
      expiresAt: this.expires
    };
  };
  
  return Session;
};

// Helper functions for parsing user agent
function parseDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

function parseBrowser(userAgent) {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  if (ua.includes('internet explorer') || ua.includes('trident')) return 'Internet Explorer';
  
  return 'Unknown';
}

function parseOS(userAgent) {
  if (!userAgent) return 'Unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  
  return 'Unknown';
}
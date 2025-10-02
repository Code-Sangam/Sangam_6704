const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        name: 'profiles_user_id_unique',
        msg: 'User already has a profile'
      },
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: 'First name must be between 1 and 100 characters'
        },
        notEmpty: {
          msg: 'First name is required'
        }
      },
      set(value) {
        // Capitalize first letter and trim
        if (value) {
          this.setDataValue('first_name', value.trim().charAt(0).toUpperCase() + value.trim().slice(1).toLowerCase());
        }
      }
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Last name must be between 1 and 100 characters'
        },
        notEmpty: {
          msg: 'Last name is required'
        }
      },
      set(value) {
        // Capitalize first letter and trim
        if (value) {
          this.setDataValue('last_name', value.trim().charAt(0).toUpperCase() + value.trim().slice(1).toLowerCase());
        }
      }
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Bio must be less than 1000 characters'
        }
      }
    },
    profile_picture: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Profile picture must be a valid URL'
        }
      }
    },
    
    // Professional Information
    company: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Company name must be less than 255 characters'
        }
      }
    },
    position: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Position must be less than 255 characters'
        }
      }
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Industry must be less than 100 characters'
        }
      }
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: 0,
          msg: 'Experience years cannot be negative'
        },
        max: {
          args: 50,
          msg: 'Experience years cannot exceed 50'
        }
      }
    },
    
    // Educational Information
    university: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'University name must be less than 255 characters'
        }
      }
    },
    major: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Major must be less than 255 characters'
        }
      }
    },
    degree: {
      type: DataTypes.ENUM('bachelor', 'master', 'phd', 'diploma', 'certificate', 'other'),
      allowNull: true,
      validate: {
        isIn: {
          args: [['bachelor', 'master', 'phd', 'diploma', 'certificate', 'other']],
          msg: 'Degree must be one of: bachelor, master, phd, diploma, certificate, other'
        }
      }
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: 1950,
          msg: 'Graduation year must be after 1950'
        },
        max: {
          args: new Date().getFullYear() + 10,
          msg: 'Graduation year cannot be more than 10 years in the future'
        }
      }
    },
    gpa: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: {
          args: 0.0,
          msg: 'GPA cannot be negative'
        },
        max: {
          args: 4.0,
          msg: 'GPA cannot exceed 4.0'
        }
      }
    },
    
    // Contact Information
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[\+]?[1-9][\d]{0,15}$/,
          msg: 'Please provide a valid phone number'
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
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'UTC'
    },
    
    // Social Links
    linkedin_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'LinkedIn URL must be a valid URL'
        },
        isLinkedInUrl(value) {
          if (value && !value.includes('linkedin.com')) {
            throw new Error('Must be a valid LinkedIn URL');
          }
        }
      }
    },
    github_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'GitHub URL must be a valid URL'
        },
        isGitHubUrl(value) {
          if (value && !value.includes('github.com')) {
            throw new Error('Must be a valid GitHub URL');
          }
        }
      }
    },
    twitter_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Twitter URL must be a valid URL'
        },
        isTwitterUrl(value) {
          if (value && !value.includes('twitter.com') && !value.includes('x.com')) {
            throw new Error('Must be a valid Twitter/X URL');
          }
        }
      }
    },
    website_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Website URL must be a valid URL'
        }
      }
    },
    
    // Preferences
    is_mentor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_seeking_mentor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    is_open_to_opportunities: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    preferred_contact_method: {
      type: DataTypes.ENUM('email', 'phone', 'linkedin', 'platform'),
      defaultValue: 'platform',
      allowNull: false
    },
    
    // Skills and Interests
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isArrayOfStrings(value) {
          if (value && (!Array.isArray(value) || !value.every(item => typeof item === 'string'))) {
            throw new Error('Skills must be an array of strings');
          }
        }
      }
    },
    interests: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isArrayOfStrings(value) {
          if (value && (!Array.isArray(value) || !value.every(item => typeof item === 'string'))) {
            throw new Error('Interests must be an array of strings');
          }
        }
      }
    },
    
    // Privacy Settings
    profile_visibility: {
      type: DataTypes.ENUM('public', 'alumni_only', 'private'),
      defaultValue: 'alumni_only',
      allowNull: false
    },
    show_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    show_phone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    }
  }, {
    tableName: 'profiles',
    timestamps: true,
    underscored: true,
    
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['first_name', 'last_name']
      },
      {
        fields: ['company']
      },
      {
        fields: ['university']
      },
      {
        fields: ['graduation_year']
      },
      {
        fields: ['is_mentor']
      },
      {
        fields: ['is_seeking_mentor']
      },
      {
        fields: ['profile_visibility']
      },
      {
        fields: ['created_at']
      }
    ],
    
    scopes: {
      public: {
        where: {
          profile_visibility: 'public'
        }
      },
      mentors: {
        where: {
          is_mentor: true
        }
      },
      seekingMentors: {
        where: {
          is_seeking_mentor: true
        }
      },
      byGraduationYear: (year) => ({
        where: {
          graduation_year: year
        }
      }),
      byCompany: (company) => ({
        where: {
          company: {
            [sequelize.Sequelize.Op.iLike]: `%${company}%`
          }
        }
      })
    },
    
    hooks: {
      beforeValidate: (profile) => {
        // Normalize URLs
        const urlFields = ['linkedin_url', 'github_url', 'twitter_url', 'website_url', 'profile_picture'];
        urlFields.forEach(field => {
          if (profile[field] && typeof profile[field] === 'string') {
            let url = profile[field].trim();
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url;
            }
            profile[field] = url;
          }
        });
        
        // Normalize arrays
        if (profile.skills && typeof profile.skills === 'string') {
          try {
            profile.skills = JSON.parse(profile.skills);
          } catch (e) {
            profile.skills = profile.skills.split(',').map(s => s.trim()).filter(s => s);
          }
        }
        
        if (profile.interests && typeof profile.interests === 'string') {
          try {
            profile.interests = JSON.parse(profile.interests);
          } catch (e) {
            profile.interests = profile.interests.split(',').map(s => s.trim()).filter(s => s);
          }
        }
      },
      
      beforeUpdate: (profile) => {
        profile.updated_at = new Date();
      }
    }
  });
  
  return Profile;
};
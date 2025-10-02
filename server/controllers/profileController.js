const { User, Profile } = require('../models');
const { logger } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.session.user.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
    }
  }
});

class ProfileController {
  // Display user's own profile
  static async showProfile(req, res) {
    try {
      const userId = req.session.user.id;
      
      const user = await User.findByIdWithProfile(userId);
      
      if (!user) {
        return res.status(404).render('pages/error', {
          title: 'User Not Found',
          message: 'User profile not found'
        });
      }
      
      res.render('pages/profile', {
        title: `${user.profile?.getDisplayName() || 'Profile'} - Sangam Alumni Network`,
        profileUser: user,
        profile: user.profile,
        isOwnProfile: true,
        currentPage: 'profile'
      });
      
    } catch (error) {
      logger.error('Error displaying profile:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: 'Unable to load profile'
      });
    }
  }
  
  // Display another user's profile
  static async showUserProfile(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.session.user.id;
      
      // Don't allow viewing own profile through this route
      if (parseInt(userId) === currentUserId) {
        return res.redirect('/profile');
      }
      
      const user = await User.findByIdWithProfile(userId);
      
      if (!user || !user.is_active) {
        return res.status(404).render('pages/error', {
          title: 'Profile Not Found',
          message: 'The requested profile does not exist or is not available'
        });
      }
      
      // Check profile visibility
      const profile = user.profile;
      if (!profile) {
        return res.status(404).render('pages/error', {
          title: 'Profile Not Found',
          message: 'Profile not found'
        });
      }
      
      // Check visibility permissions
      const currentUser = await User.findByIdWithProfile(currentUserId);
      const canView = ProfileController.canViewProfile(profile, currentUser);
      
      if (!canView) {
        return res.status(403).render('pages/error', {
          title: 'Access Denied',
          message: 'You do not have permission to view this profile'
        });
      }
      
      res.render('pages/profile', {
        title: `${profile.getDisplayName()} - Sangam Alumni Network`,
        profileUser: user,
        profile: profile,
        isOwnProfile: false,
        currentPage: 'profile'
      });
      
    } catch (error) {
      logger.error('Error displaying user profile:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: 'Unable to load profile'
      });
    }
  }
  
  // Show profile edit form
  static async showEditProfile(req, res) {
    try {
      const userId = req.session.user.id;
      
      const user = await User.findByIdWithProfile(userId);
      
      if (!user) {
        return res.status(404).render('pages/error', {
          title: 'User Not Found',
          message: 'User not found'
        });
      }
      
      res.render('pages/profile-edit', {
        title: 'Edit Profile - Sangam Alumni Network',
        profileUser: user,
        profile: user.profile,
        currentPage: 'profile',
        error: req.session.error || null,
        success: req.session.success || null
      });
      
      // Clear flash messages
      delete req.session.error;
      delete req.session.success;
      
    } catch (error) {
      logger.error('Error displaying edit profile:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: 'Unable to load edit profile page'
      });
    }
  }
  
  // Update profile
  static async updateProfile(req, res) {
    try {
      const userId = req.session.user.id;
      const {
        firstName,
        lastName,
        bio,
        company,
        position,
        industry,
        experienceYears,
        university,
        major,
        degree,
        graduationYear,
        gpa,
        phone,
        location,
        timezone,
        linkedinUrl,
        githubUrl,
        twitterUrl,
        websiteUrl,
        skills,
        interests,
        isMentor,
        isSeekingMentor,
        isOpenToOpportunities,
        preferredContactMethod,
        profileVisibility,
        showEmail,
        showPhone
      } = req.body;
      
      const user = await User.findByIdWithProfile(userId);
      
      if (!user) {
        req.session.error = 'User not found';
        return res.redirect('/profile/edit');
      }
      
      // Prepare profile data
      const profileData = {
        first_name: firstName?.trim(),
        last_name: lastName?.trim(),
        bio: bio?.trim() || null,
        company: company?.trim() || null,
        position: position?.trim() || null,
        industry: industry?.trim() || null,
        experience_years: experienceYears ? parseInt(experienceYears) : null,
        university: university?.trim() || null,
        major: major?.trim() || null,
        degree: degree || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        gpa: gpa ? parseFloat(gpa) : null,
        phone: phone?.trim() || null,
        location: location?.trim() || null,
        timezone: timezone || 'UTC',
        linkedin_url: linkedinUrl?.trim() || null,
        github_url: githubUrl?.trim() || null,
        twitter_url: twitterUrl?.trim() || null,
        website_url: websiteUrl?.trim() || null,
        is_mentor: !!isMentor,
        is_seeking_mentor: !!isSeekingMentor,
        is_open_to_opportunities: !!isOpenToOpportunities,
        preferred_contact_method: preferredContactMethod || 'platform',
        profile_visibility: profileVisibility || 'alumni_only',
        show_email: !!showEmail,
        show_phone: !!showPhone
      };
      
      // Handle skills and interests arrays
      if (skills) {
        profileData.skills = typeof skills === 'string' 
          ? skills.split(',').map(s => s.trim()).filter(s => s)
          : skills;
      }
      
      if (interests) {
        profileData.interests = typeof interests === 'string'
          ? interests.split(',').map(s => s.trim()).filter(s => s)
          : interests;
      }
      
      // Update or create profile
      if (user.profile) {
        await user.profile.update(profileData);
      } else {
        profileData.user_id = userId;
        await Profile.create(profileData);
      }
      
      // Update session data
      req.session.user.firstName = profileData.first_name;
      req.session.user.lastName = profileData.last_name;
      
      logger.info(`Profile updated for user: ${user.email}`);
      
      req.session.success = 'Profile updated successfully!';
      res.redirect('/profile');
      
    } catch (error) {
      logger.error('Error updating profile:', error);
      
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        req.session.error = messages.join(', ');
      } else {
        req.session.error = 'An error occurred while updating your profile. Please try again.';
      }
      
      res.redirect('/profile/edit');
    }
  }
  
  // Upload profile picture
  static uploadProfilePicture = [
    upload.single('profilePicture'),
    async (req, res) => {
      try {
        const userId = req.session.user.id;
        
        if (!req.file) {
          return res.status(400).json({
            error: 'No file uploaded'
          });
        }
        
        const user = await User.findByIdWithProfile(userId);
        
        if (!user || !user.profile) {
          return res.status(404).json({
            error: 'Profile not found'
          });
        }
        
        // Delete old profile picture if it exists
        if (user.profile.profile_picture) {
          const oldPath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profile.profile_picture));
          try {
            await fs.unlink(oldPath);
          } catch (error) {
            // Ignore error if file doesn't exist
          }
        }
        
        // Update profile with new picture URL
        const pictureUrl = `/uploads/profiles/${req.file.filename}`;
        await user.profile.update({
          profile_picture: pictureUrl
        });
        
        // Update session data
        req.session.user.profilePicture = pictureUrl;
        
        logger.info(`Profile picture updated for user: ${user.email}`);
        
        res.json({
          success: true,
          message: 'Profile picture updated successfully',
          profilePicture: pictureUrl
        });
        
      } catch (error) {
        logger.error('Error uploading profile picture:', error);
        
        // Clean up uploaded file on error
        if (req.file) {
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            // Ignore cleanup error
          }
        }
        
        res.status(500).json({
          error: 'Failed to upload profile picture'
        });
      }
    }
  ];
  
  // Search profiles API
  static async searchProfiles(req, res) {
    try {
      const { q, role, graduationYear, company, limit = 20, offset = 0 } = req.query;
      const currentUserId = req.session.user.id;
      
      const filters = {
        limit: Math.min(parseInt(limit), 50),
        offset: parseInt(offset) || 0
      };
      
      if (role && ['student', 'alumni', 'faculty'].includes(role)) {
        filters.role = role;
      }
      
      if (graduationYear) {
        filters.graduationYear = parseInt(graduationYear);
      }
      
      if (company) {
        filters.company = company;
      }
      
      const profiles = await Profile.searchProfiles(q, filters);
      
      // Filter out profiles based on visibility and current user permissions
      const currentUser = await User.findByIdWithProfile(currentUserId);
      const visibleProfiles = profiles.filter(profile => 
        ProfileController.canViewProfile(profile, currentUser)
      );
      
      // Format response
      const formattedProfiles = visibleProfiles.map(profile => ({
        id: profile.user.id,
        name: profile.getDisplayName(),
        role: profile.user.role,
        company: profile.company,
        position: profile.position,
        university: profile.university,
        graduationYear: profile.graduation_year,
        profilePicture: profile.profile_picture,
        isMentor: profile.is_mentor,
        isSeekingMentor: profile.is_seeking_mentor,
        location: profile.location,
        skills: profile.skills?.slice(0, 5) || [] // Limit skills in search results
      }));
      
      res.json({
        profiles: formattedProfiles,
        total: visibleProfiles.length,
        hasMore: visibleProfiles.length === filters.limit
      });
      
    } catch (error) {
      logger.error('Error searching profiles:', error);
      res.status(500).json({
        error: 'Failed to search profiles'
      });
    }
  }
  
  // Get profile API
  static async getProfile(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.session.user.id;
      
      const user = await User.findByIdWithProfile(userId);
      
      if (!user || !user.is_active || !user.profile) {
        return res.status(404).json({
          error: 'Profile not found'
        });
      }
      
      // Check visibility permissions
      const currentUser = await User.findByIdWithProfile(currentUserId);
      const canView = ProfileController.canViewProfile(user.profile, currentUser);
      
      if (!canView) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
      
      // Format profile data based on privacy settings
      const profileData = {
        id: user.id,
        name: user.profile.getDisplayName(),
        role: user.role,
        bio: user.profile.bio,
        profilePicture: user.profile.profile_picture,
        company: user.profile.company,
        position: user.profile.position,
        industry: user.profile.industry,
        experienceYears: user.profile.experience_years,
        university: user.profile.university,
        major: user.profile.major,
        degree: user.profile.degree,
        graduationYear: user.profile.graduation_year,
        location: user.profile.location,
        skills: user.profile.skills || [],
        interests: user.profile.interests || [],
        isMentor: user.profile.is_mentor,
        isSeekingMentor: user.profile.is_seeking_mentor,
        isOpenToOpportunities: user.profile.is_open_to_opportunities,
        socialLinks: {
          linkedin: user.profile.linkedin_url,
          github: user.profile.github_url,
          twitter: user.profile.twitter_url,
          website: user.profile.website_url
        },
        joinDate: user.created_at,
        isOwnProfile: parseInt(userId) === currentUserId
      };
      
      // Add contact info based on privacy settings
      if (user.profile.show_email || parseInt(userId) === currentUserId) {
        profileData.email = user.email;
      }
      
      if (user.profile.show_phone || parseInt(userId) === currentUserId) {
        profileData.phone = user.profile.phone;
      }
      
      res.json(profileData);
      
    } catch (error) {
      logger.error('Error getting profile:', error);
      res.status(500).json({
        error: 'Failed to get profile'
      });
    }
  }
  
  // Helper method to check profile visibility
  static canViewProfile(profile, currentUser) {
    if (!profile || !currentUser) return false;
    
    // User can always view their own profile
    if (profile.user_id === currentUser.id) return true;
    
    // Admin can view all profiles
    if (currentUser.role === 'admin') return true;
    
    switch (profile.profile_visibility) {
      case 'public':
        return true;
      case 'alumni_only':
        return ['alumni', 'faculty', 'admin'].includes(currentUser.role);
      case 'private':
        return false;
      default:
        return false;
    }
  }
  
  // Get profile statistics
  static async getProfileStats(req, res) {
    try {
      const userId = req.session.user.id;
      
      // Get various statistics
      const stats = {
        profileCompletion: 0,
        connectionCount: 0, // Will be implemented with connections feature
        messageCount: 0,    // Will be implemented with message counting
        viewCount: 0        // Will be implemented with profile view tracking
      };
      
      // Calculate profile completion
      const user = await User.findByIdWithProfile(userId);
      if (user && user.profile) {
        stats.profileCompletion = ProfileController.calculateProfileCompletion(user.profile);
      }
      
      res.json(stats);
      
    } catch (error) {
      logger.error('Error getting profile stats:', error);
      res.status(500).json({
        error: 'Failed to get profile statistics'
      });
    }
  }
  
  // Helper method to calculate profile completion percentage
  static calculateProfileCompletion(profile) {
    const fields = [
      'first_name', 'last_name', 'bio', 'profile_picture',
      'company', 'position', 'university', 'graduation_year',
      'location', 'skills', 'interests'
    ];
    
    let completedFields = 0;
    
    fields.forEach(field => {
      const value = profile[field];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          completedFields++;
        } else if (!Array.isArray(value)) {
          completedFields++;
        }
      }
    });
    
    return Math.round((completedFields / fields.length) * 100);
  }
}

module.exports = ProfileController;
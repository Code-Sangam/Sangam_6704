const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');

// User's own profile
router.get('/', ProfileController.showProfile);

// Edit profile form
router.get('/edit', ProfileController.showEditProfile);

// Update profile
router.post('/edit', ProfileController.updateProfile);

// Upload profile picture
router.post('/upload-picture', ProfileController.uploadProfilePicture);

// Settings page
router.get('/settings', (req, res) => {
  res.render('pages/settings', {
    title: 'Settings - Sangam Alumni Network',
    user: req.session.user,
    currentPage: 'settings'
  });
});

// API endpoints
router.get('/api/search', ProfileController.searchProfiles);
router.get('/api/stats', ProfileController.getProfileStats);
router.get('/api/:userId', ProfileController.getProfile);

// View another user's profile (must be last to avoid conflicts)
router.get('/:userId', ProfileController.showUserProfile);

module.exports = router;
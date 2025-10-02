const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const { requirePermission, requireRole } = require('../middleware/permissions');

// API health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Protected API routes (require authentication)
router.use(authMiddleware.requireAuth);

// User API endpoints
router.get('/users', require('../controllers/userController').getAllUsers);
router.get('/users/contacts', require('../controllers/userController').getUserContacts);
router.get('/users/:id', require('../controllers/userController').getUserById);

// Profile API endpoints
router.get('/profiles/search', require('../controllers/profileController').searchProfiles);
router.get('/profiles/:userId', require('../controllers/profileController').getProfile);
router.get('/profile/stats', require('../controllers/profileController').getProfileStats);

// Chat API endpoints
router.get('/chat/messages/:userId', require('../controllers/chatController').getChatMessages);
router.get('/chat/history/:userId', require('../controllers/chatController').getMessageHistory);
router.get('/chat/search', require('../controllers/chatController').searchMessages);
router.get('/chat/stats/:userId', require('../controllers/chatController').getConversationStats);
router.post('/chat/messages', require('../controllers/chatController').sendMessage);
router.post('/chat/upload', uploadSingle, handleUploadError, require('../controllers/chatController').uploadFile);
router.put('/chat/messages/:messageId', require('../controllers/chatController').editMessage);
router.delete('/chat/messages/:messageId', require('../controllers/chatController').deleteMessage);
router.post('/chat/messages/read', require('../controllers/chatController').markMessagesAsRead);
router.get('/chat/conversations', require('../controllers/chatController').getConversations);
router.get('/chat/active-users', require('../controllers/chatController').getActiveUsers);

// Settings API endpoints
router.put('/profile/update', require('../controllers/settingsController').updateProfile);
router.post('/auth/change-password', require('../controllers/settingsController').changePassword);
router.put('/settings/privacy', require('../controllers/settingsController').updatePrivacySettings);
router.get('/settings/activity', require('../controllers/settingsController').getAccountActivity);
router.get('/settings/sessions', require('../controllers/settingsController').getActiveSessions);
router.delete('/settings/sessions/:sessionId', require('../controllers/settingsController').terminateSession);

// Dashboard API endpoints
router.get('/dashboard/stats', require('../controllers/dashboardController').getDashboardStats);
router.get('/dashboard/activity', require('../controllers/dashboardController').getRecentActivity);
router.get('/dashboard/connections', require('../controllers/dashboardController').getConnections);
router.get('/dashboard/events', require('../controllers/dashboardController').getUpcomingEvents);

// Admin API endpoints (require admin permissions)
router.get('/admin/dashboard', requirePermission('admin:access_panel'), require('../controllers/adminController').getDashboard);
router.get('/admin/users', requirePermission('users:view_list'), require('../controllers/adminController').getUsers);
router.get('/admin/users/:userId', requirePermission('users:view_details'), require('../controllers/adminController').getUserDetails);
router.put('/admin/users/:userId/role', requirePermission('users:change_role'), require('../controllers/adminController').updateUserRole);
router.put('/admin/users/:userId/status', requirePermission('users:suspend'), require('../controllers/adminController').toggleUserStatus);
router.put('/admin/users/:userId/reset-password', requirePermission('users:edit_profile'), require('../controllers/adminController').resetUserPassword);
router.delete('/admin/users/:userId', requirePermission('users:delete'), require('../controllers/adminController').deleteUser);
router.get('/admin/settings', requirePermission('settings:view_system'), require('../controllers/adminController').getSystemSettings);
router.put('/admin/settings', requirePermission('settings:edit_system'), require('../controllers/adminController').updateSystemSettings);
router.get('/admin/users/:userId/permissions', requirePermission('users:view_details'), require('../controllers/adminController').getUserPermissions);

module.exports = router;
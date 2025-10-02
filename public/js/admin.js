// Admin Panel JavaScript

class AdminPanel {
  constructor() {
    this.currentSection = 'dashboard';
    this.currentPage = 1;
    this.usersPerPage = 20;
    this.filters = {
      search: '',
      role: '',
      status: ''
    };
    
    this.init();
  }
  
  init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.loadDashboard();
  }
  
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.switchSection(section);
      });
    });
  }
  
  setupEventListeners() {
    // User search and filters
    const userSearch = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const applyFilters = document.getElementById('applyFilters');
    
    if (applyFilters) {
      applyFilters.addEventListener('click', () => {
        this.filters.search = userSearch?.value || '';
        this.filters.role = roleFilter?.value || '';
        this.filters.status = statusFilter?.value || '';
        this.currentPage = 1;
        this.loadUsers();
      });
    }
    
    // Enter key for search
    if (userSearch) {
      userSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyFilters?.click();
        }
      });
    }
    
    // Tab switching
    this.setupTabs();
    
    // System settings form
    const settingsForm = document.getElementById('systemSettingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSystemSettings();
      });
    }
  }
  
  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(e.currentTarget.closest('.admin-section'), tabName);
      });
    });
  }
  
  switchSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section=\"${section}\"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.admin-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
    
    this.currentSection = section;
    
    // Load section data
    switch (section) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'users':
        this.loadUsers();
        break;
      case 'content':
        this.loadContentModeration();
        break;
      case 'settings':
        this.loadSystemSettings();
        break;
      case 'analytics':
        this.loadAnalytics();
        break;
    }
  }
  
  switchTab(container, tabName) {
    // Update tab buttons
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    container.querySelector(`[data-tab=\"${tabName}\"]`).classList.add('active');
    
    // Update tab content
    container.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    container.querySelector(`#${tabName}-tab`).classList.add('active');
  }
  
  async loadDashboard() {
    try {
      const response = await fetch('/api/admin/dashboard');\n      const data = await response.json();\n      \n      if (response.ok) {\n        this.updateDashboardStats(data.stats);\n        this.updateRecentUsers(data.recentUsers);\n        this.updateUserRoleChart(data.stats.usersByRole);\n      } else {\n        this.showMessage('Failed to load dashboard data', 'error');\n      }\n    } catch (error) {\n      console.error('Dashboard load error:', error);\n      this.showMessage('Failed to load dashboard data', 'error');\n    }\n  }\n  \n  updateDashboardStats(stats) {\n    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;\n    document.getElementById('totalMessages').textContent = stats.totalMessages || 0;\n    document.getElementById('activeUsers').textContent = stats.activeUsers || 0;\n    \n    // Calculate growth rate (mock calculation)\n    const growthRate = stats.totalUsers > 0 ? '+12%' : '0%';\n    document.getElementById('growthRate').textContent = growthRate;\n  }\n  \n  updateRecentUsers(users) {\n    const container = document.getElementById('recentUsersList');\n    if (!container) return;\n    \n    if (!users || users.length === 0) {\n      container.innerHTML = '<div class=\"empty-state\"><p>No recent users</p></div>';\n      return;\n    }\n    \n    container.innerHTML = users.map(user => `\n      <div class=\"user-item\">\n        <div class=\"user-avatar\">\n          ${user.profilePicture ? \n            `<img src=\"${user.profilePicture}\" alt=\"${user.firstName}\">` :\n            `${user.firstName?.charAt(0) || 'U'}`\n          }\n        </div>\n        <div class=\"user-info\">\n          <div class=\"user-name\">${user.firstName} ${user.lastName}</div>\n          <div class=\"user-role\">${user.role}</div>\n        </div>\n      </div>\n    `).join('');\n  }\n  \n  updateUserRoleChart(usersByRole) {\n    const canvas = document.getElementById('userRoleChart');\n    if (!canvas) return;\n    \n    const ctx = canvas.getContext('2d');\n    \n    // Simple pie chart implementation\n    const roles = Object.keys(usersByRole);\n    const counts = Object.values(usersByRole);\n    const total = counts.reduce((sum, count) => sum + count, 0);\n    \n    if (total === 0) {\n      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';\n      ctx.font = '16px Arial';\n      ctx.textAlign = 'center';\n      ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);\n      return;\n    }\n    \n    const colors = {\n      student: '#3b82f6',\n      alumni: '#10b981',\n      faculty: '#f59e0b',\n      admin: '#ef4444'\n    };\n    \n    let currentAngle = 0;\n    const centerX = canvas.width / 2;\n    const centerY = canvas.height / 2;\n    const radius = Math.min(centerX, centerY) - 20;\n    \n    roles.forEach((role, index) => {\n      const count = counts[index];\n      const percentage = count / total;\n      const sliceAngle = percentage * 2 * Math.PI;\n      \n      // Draw slice\n      ctx.beginPath();\n      ctx.moveTo(centerX, centerY);\n      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);\n      ctx.closePath();\n      ctx.fillStyle = colors[role] || '#6b7280';\n      ctx.fill();\n      \n      // Draw label\n      const labelAngle = currentAngle + sliceAngle / 2;\n      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);\n      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);\n      \n      ctx.fillStyle = 'white';\n      ctx.font = '12px Arial';\n      ctx.textAlign = 'center';\n      ctx.fillText(`${role}\\n${count}`, labelX, labelY);\n      \n      currentAngle += sliceAngle;\n    });\n  }\n  \n  async loadUsers() {\n    try {\n      const params = new URLSearchParams({\n        page: this.currentPage,\n        limit: this.usersPerPage,\n        ...this.filters\n      });\n      \n      const response = await fetch(`/api/admin/users?${params}`);\n      const data = await response.json();\n      \n      if (response.ok) {\n        this.updateUsersTable(data.users);\n        this.updateUsersPagination(data.pagination);\n      } else {\n        this.showMessage('Failed to load users', 'error');\n      }\n    } catch (error) {\n      console.error('Users load error:', error);\n      this.showMessage('Failed to load users', 'error');\n    }\n  }\n  \n  updateUsersTable(users) {\n    const tbody = document.getElementById('usersTableBody');\n    if (!tbody) return;\n    \n    if (!users || users.length === 0) {\n      tbody.innerHTML = `\n        <tr>\n          <td colspan=\"6\" class=\"empty-state\">\n            <p>No users found</p>\n          </td>\n        </tr>\n      `;\n      return;\n    }\n    \n    tbody.innerHTML = users.map(user => `\n      <tr>\n        <td>\n          <div class=\"user-cell\">\n            ${user.profilePicture ? \n              `<img src=\"${user.profilePicture}\" alt=\"${user.firstName}\">` :\n              `<div class=\"user-avatar\">${user.firstName?.charAt(0) || 'U'}</div>`\n            }\n            <div class=\"user-details\">\n              <div class=\"user-name\">${user.firstName} ${user.lastName}</div>\n            </div>\n          </div>\n        </td>\n        <td>${user.email}</td>\n        <td>\n          <span class=\"role-badge role-${user.role}\">${user.role}</span>\n        </td>\n        <td>\n          <span class=\"status-badge status-${user.isActive ? 'active' : 'inactive'}\">\n            ${user.isActive ? 'Active' : 'Inactive'}\n          </span>\n        </td>\n        <td>${new Date(user.createdAt).toLocaleDateString()}</td>\n        <td>\n          <div class=\"action-buttons\">\n            <button class=\"btn btn-sm btn-secondary\" onclick=\"adminPanel.viewUser(${user.id})\">\n              View\n            </button>\n            <button class=\"btn btn-sm btn-primary\" onclick=\"adminPanel.editUser(${user.id})\">\n              Edit\n            </button>\n            <button class=\"btn btn-sm btn-danger\" onclick=\"adminPanel.toggleUserStatus(${user.id}, ${!user.isActive})\">\n              ${user.isActive ? 'Suspend' : 'Activate'}\n            </button>\n          </div>\n        </td>\n      </tr>\n    `).join('');\n  }\n  \n  updateUsersPagination(pagination) {\n    const container = document.getElementById('usersPagination');\n    if (!container) return;\n    \n    const { currentPage, totalPages, totalUsers, hasNext, hasPrev } = pagination;\n    \n    let paginationHTML = `\n      <button class=\"pagination-btn\" ${!hasPrev ? 'disabled' : ''} onclick=\"adminPanel.changePage(${currentPage - 1})\">\n        Previous\n      </button>\n    `;\n    \n    // Page numbers\n    const startPage = Math.max(1, currentPage - 2);\n    const endPage = Math.min(totalPages, currentPage + 2);\n    \n    for (let i = startPage; i <= endPage; i++) {\n      paginationHTML += `\n        <button class=\"pagination-btn ${i === currentPage ? 'active' : ''}\" onclick=\"adminPanel.changePage(${i})\">\n          ${i}\n        </button>\n      `;\n    }\n    \n    paginationHTML += `\n      <button class=\"pagination-btn\" ${!hasNext ? 'disabled' : ''} onclick=\"adminPanel.changePage(${currentPage + 1})\">\n        Next\n      </button>\n      <div class=\"pagination-info\">\n        Showing ${((currentPage - 1) * this.usersPerPage) + 1}-${Math.min(currentPage * this.usersPerPage, totalUsers)} of ${totalUsers}\n      </div>\n    `;\n    \n    container.innerHTML = paginationHTML;\n  }\n  \n  changePage(page) {\n    this.currentPage = page;\n    this.loadUsers();\n  }\n  \n  async viewUser(userId) {\n    try {\n      const response = await fetch(`/api/admin/users/${userId}`);\n      const user = await response.json();\n      \n      if (response.ok) {\n        this.showUserModal(user);\n      } else {\n        this.showMessage('Failed to load user details', 'error');\n      }\n    } catch (error) {\n      console.error('View user error:', error);\n      this.showMessage('Failed to load user details', 'error');\n    }\n  }\n  \n  showUserModal(user) {\n    const modal = document.getElementById('userModal');\n    const modalBody = document.getElementById('userModalBody');\n    \n    modalBody.innerHTML = `\n      <div class=\"user-details-modal\">\n        <div class=\"user-header\">\n          ${user.profilePicture ? \n            `<img src=\"${user.profilePicture}\" alt=\"${user.profile?.firstName}\" class=\"user-avatar-large\">` :\n            `<div class=\"user-avatar-large\">${user.profile?.firstName?.charAt(0) || 'U'}</div>`\n          }\n          <div class=\"user-info\">\n            <h3>${user.profile?.firstName || 'Unknown'} ${user.profile?.lastName || 'User'}</h3>\n            <p>${user.email}</p>\n            <span class=\"role-badge role-${user.role}\">${user.role}</span>\n            <span class=\"status-badge status-${user.isActive ? 'active' : 'inactive'}\">\n              ${user.isActive ? 'Active' : 'Inactive'}\n            </span>\n          </div>\n        </div>\n        \n        <div class=\"user-stats\">\n          <div class=\"stat-item\">\n            <span class=\"stat-label\">Messages Sent</span>\n            <span class=\"stat-value\">${user.stats?.messagesSent || 0}</span>\n          </div>\n          <div class=\"stat-item\">\n            <span class=\"stat-label\">Total Sessions</span>\n            <span class=\"stat-value\">${user.stats?.totalSessions || 0}</span>\n          </div>\n          <div class=\"stat-item\">\n            <span class=\"stat-label\">Member Since</span>\n            <span class=\"stat-value\">${new Date(user.createdAt).toLocaleDateString()}</span>\n          </div>\n        </div>\n        \n        ${user.profile ? `\n          <div class=\"user-profile\">\n            <h4>Profile Information</h4>\n            <div class=\"profile-grid\">\n              <div class=\"profile-item\">\n                <span class=\"profile-label\">Company</span>\n                <span class=\"profile-value\">${user.profile.company || 'Not specified'}</span>\n              </div>\n              <div class=\"profile-item\">\n                <span class=\"profile-label\">Position</span>\n                <span class=\"profile-value\">${user.profile.position || 'Not specified'}</span>\n              </div>\n              <div class=\"profile-item\">\n                <span class=\"profile-label\">Graduation Year</span>\n                <span class=\"profile-value\">${user.profile.graduationYear || 'Not specified'}</span>\n              </div>\n              <div class=\"profile-item\">\n                <span class=\"profile-label\">University</span>\n                <span class=\"profile-value\">${user.profile.university || 'Not specified'}</span>\n              </div>\n            </div>\n            ${user.profile.bio ? `\n              <div class=\"profile-bio\">\n                <span class=\"profile-label\">Bio</span>\n                <p>${user.profile.bio}</p>\n              </div>\n            ` : ''}\n          </div>\n        ` : ''}\n        \n        <div class=\"user-actions\">\n          <button class=\"btn btn-primary\" onclick=\"adminPanel.editUser(${user.id})\">\n            Edit User\n          </button>\n          <button class=\"btn btn-secondary\" onclick=\"adminPanel.resetUserPassword(${user.id})\">\n            Reset Password\n          </button>\n          <button class=\"btn btn-danger\" onclick=\"adminPanel.toggleUserStatus(${user.id}, ${!user.isActive})\">\n            ${user.isActive ? 'Suspend User' : 'Activate User'}\n          </button>\n        </div>\n      </div>\n    `;\n    \n    modal.style.display = 'flex';\n  }\n  \n  async editUser(userId) {\n    // Implementation for editing user\n    this.showMessage('Edit user functionality coming soon', 'info');\n  }\n  \n  async toggleUserStatus(userId, isActive) {\n    try {\n      const response = await fetch(`/api/admin/users/${userId}/status`, {\n        method: 'PUT',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({ isActive })\n      });\n      \n      const result = await response.json();\n      \n      if (response.ok) {\n        this.showMessage(result.message, 'success');\n        this.loadUsers();\n        this.closeUserModal();\n      } else {\n        this.showMessage(result.error || 'Failed to update user status', 'error');\n      }\n    } catch (error) {\n      console.error('Toggle user status error:', error);\n      this.showMessage('Failed to update user status', 'error');\n    }\n  }\n  \n  async resetUserPassword(userId) {\n    const newPassword = prompt('Enter new password (minimum 8 characters):');\n    if (!newPassword || newPassword.length < 8) {\n      this.showMessage('Password must be at least 8 characters long', 'error');\n      return;\n    }\n    \n    try {\n      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {\n        method: 'PUT',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({ newPassword })\n      });\n      \n      const result = await response.json();\n      \n      if (response.ok) {\n        this.showMessage(result.message, 'success');\n        this.closeUserModal();\n      } else {\n        this.showMessage(result.error || 'Failed to reset password', 'error');\n      }\n    } catch (error) {\n      console.error('Reset password error:', error);\n      this.showMessage('Failed to reset password', 'error');\n    }\n  }\n  \n  closeUserModal() {\n    const modal = document.getElementById('userModal');\n    modal.style.display = 'none';\n  }\n  \n  async loadContentModeration() {\n    // Implementation for content moderation\n    this.showMessage('Content moderation functionality coming soon', 'info');\n  }\n  \n  async loadSystemSettings() {\n    try {\n      const response = await fetch('/api/admin/settings');\n      const settings = await response.json();\n      \n      if (response.ok) {\n        this.populateSettingsForm(settings);\n      } else {\n        this.showMessage('Failed to load system settings', 'error');\n      }\n    } catch (error) {\n      console.error('Load settings error:', error);\n      this.showMessage('Failed to load system settings', 'error');\n    }\n  }\n  \n  populateSettingsForm(settings) {\n    // General settings\n    const siteName = document.getElementById('siteName');\n    const siteDescription = document.getElementById('siteDescription');\n    const maintenanceMode = document.getElementById('maintenanceMode');\n    const registrationEnabled = document.getElementById('registrationEnabled');\n    \n    if (siteName) siteName.value = settings.general?.siteName || '';\n    if (siteDescription) siteDescription.value = settings.general?.siteDescription || '';\n    if (maintenanceMode) maintenanceMode.checked = settings.general?.maintenanceMode || false;\n    if (registrationEnabled) registrationEnabled.checked = settings.general?.registrationEnabled !== false;\n    \n    // Security settings\n    const passwordMinLength = document.getElementById('passwordMinLength');\n    const maxLoginAttempts = document.getElementById('maxLoginAttempts');\n    const lockoutDuration = document.getElementById('lockoutDuration');\n    \n    if (passwordMinLength) passwordMinLength.value = settings.security?.passwordMinLength || 8;\n    if (maxLoginAttempts) maxLoginAttempts.value = settings.security?.maxLoginAttempts || 5;\n    if (lockoutDuration) lockoutDuration.value = Math.floor((settings.security?.lockoutDuration || 900000) / 60000);\n    \n    // Feature settings\n    const chatEnabled = document.getElementById('chatEnabled');\n    const fileUploadEnabled = document.getElementById('fileUploadEnabled');\n    const notificationsEnabled = document.getElementById('notificationsEnabled');\n    \n    if (chatEnabled) chatEnabled.checked = settings.features?.chatEnabled !== false;\n    if (fileUploadEnabled) fileUploadEnabled.checked = settings.features?.fileUploadEnabled !== false;\n    if (notificationsEnabled) notificationsEnabled.checked = settings.features?.notificationsEnabled !== false;\n    \n    // Limits\n    const maxFileSize = document.getElementById('maxFileSize');\n    const maxMessagesPerDay = document.getElementById('maxMessagesPerDay');\n    \n    if (maxFileSize) maxFileSize.value = Math.floor((settings.limits?.maxFileSize || 10485760) / 1048576);\n    if (maxMessagesPerDay) maxMessagesPerDay.value = settings.limits?.maxMessagesPerDay || 1000;\n  }\n  \n  async saveSystemSettings() {\n    const form = document.getElementById('systemSettingsForm');\n    const formData = new FormData(form);\n    \n    const settings = {\n      general: {\n        siteName: formData.get('general.siteName'),\n        siteDescription: formData.get('general.siteDescription'),\n        maintenanceMode: formData.has('general.maintenanceMode'),\n        registrationEnabled: formData.has('general.registrationEnabled')\n      },\n      security: {\n        passwordMinLength: parseInt(formData.get('security.passwordMinLength')),\n        maxLoginAttempts: parseInt(formData.get('security.maxLoginAttempts')),\n        lockoutDuration: parseInt(formData.get('security.lockoutDuration')) * 60000\n      },\n      features: {\n        chatEnabled: formData.has('features.chatEnabled'),\n        fileUploadEnabled: formData.has('features.fileUploadEnabled'),\n        notificationsEnabled: formData.has('features.notificationsEnabled')\n      },\n      limits: {\n        maxFileSize: parseInt(formData.get('limits.maxFileSize')) * 1048576,\n        maxMessagesPerDay: parseInt(formData.get('limits.maxMessagesPerDay'))\n      }\n    };\n    \n    try {\n      const response = await fetch('/api/admin/settings', {\n        method: 'PUT',\n        headers: {\n          'Content-Type': 'application/json'\n        },\n        body: JSON.stringify(settings)\n      });\n      \n      const result = await response.json();\n      \n      if (response.ok) {\n        this.showMessage('Settings saved successfully', 'success');\n      } else {\n        this.showMessage(result.error || 'Failed to save settings', 'error');\n      }\n    } catch (error) {\n      console.error('Save settings error:', error);\n      this.showMessage('Failed to save settings', 'error');\n    }\n  }\n  \n  async loadAnalytics() {\n    // Implementation for analytics\n    this.showMessage('Analytics functionality coming soon', 'info');\n  }\n  \n  showMessage(message, type = 'info') {\n    const container = document.getElementById('messageContainer');\n    const messageEl = document.createElement('div');\n    messageEl.className = `message ${type}`;\n    messageEl.textContent = message;\n    \n    container.appendChild(messageEl);\n    \n    // Auto remove after 5 seconds\n    setTimeout(() => {\n      if (messageEl.parentNode) {\n        messageEl.parentNode.removeChild(messageEl);\n      }\n    }, 5000);\n  }\n}\n\n// Global functions\nfunction closeUserModal() {\n  document.getElementById('userModal').style.display = 'none';\n}\n\nfunction loadSystemSettings() {\n  adminPanel.loadSystemSettings();\n}\n\n// Initialize admin panel when DOM is loaded\nlet adminPanel;\ndocument.addEventListener('DOMContentLoaded', () => {\n  adminPanel = new AdminPanel();\n});"
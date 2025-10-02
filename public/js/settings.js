// Settings Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  initializeSettings();
});

function initializeSettings() {
  // Initialize navigation
  setupNavigation();
  
  // Initialize forms
  setupProfileForm();
  setupPasswordForm();
  setupPrivacyForm();
  
  // Load dynamic content
  loadAccountActivity();
  loadActiveSessions();
  
  // Setup password validation
  setupPasswordValidation();
}

// Navigation Setup
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.settings-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const sectionId = this.dataset.section;
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      // Update active section
      sections.forEach(section => section.classList.remove('active'));
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });
}

// Profile Form Setup
function setupProfileForm() {
  const profileForm = document.getElementById('profileForm');
  
  if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());
      
      try {
        showLoading(this);
        
        const response = await fetch('/api/profile/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showMessage('Profile updated successfully!', 'success');
        } else {
          showMessage(result.error || 'Failed to update profile', 'error');
        }
      } catch (error) {
        console.error('Profile update error:', error);
        showMessage('Failed to update profile. Please try again.', 'error');
      } finally {
        hideLoading(this);
      }
    });
  }
}

// Password Form Setup
function setupPasswordForm() {
  const passwordForm = document.getElementById('passwordForm');
  
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());
      
      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
      }
      
      // Validate password strength
      if (!isPasswordStrong(data.newPassword)) {
        showMessage('Password does not meet requirements', 'error');
        return;
      }
      
      try {
        showLoading(this);
        
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showMessage('Password updated successfully!', 'success');
          this.reset();
          updatePasswordStrength('');
        } else {
          showMessage(result.error || 'Failed to update password', 'error');
        }
      } catch (error) {
        console.error('Password update error:', error);
        showMessage('Failed to update password. Please try again.', 'error');
      } finally {
        hideLoading(this);
      }
    });
  }
}

// Privacy Form Setup
function setupPrivacyForm() {
  const privacyForm = document.getElementById('privacyForm');
  
  if (privacyForm) {
    privacyForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = {};
      
      // Handle checkboxes
      data.profileVisibility = formData.get('profileVisibility');
      data.messageNotifications = formData.has('messageNotifications');
      data.emailNotifications = formData.has('emailNotifications');
      data.showOnlineStatus = formData.has('showOnlineStatus');
      
      try {
        showLoading(this);
        
        const response = await fetch('/api/settings/privacy', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showMessage('Privacy settings updated successfully!', 'success');
        } else {
          showMessage(result.error || 'Failed to update privacy settings', 'error');
        }
      } catch (error) {
        console.error('Privacy settings update error:', error);
        showMessage('Failed to update privacy settings. Please try again.', 'error');
      } finally {
        hideLoading(this);
      }
    });
  }
}

// Password Validation Setup
function setupPasswordValidation() {
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      const password = this.value;
      updatePasswordStrength(password);
      validatePasswordRequirements(password);
    });
  }
  
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
      const newPassword = newPasswordInput.value;
      const confirmPassword = this.value;
      
      if (confirmPassword && newPassword !== confirmPassword) {
        this.setCustomValidity('Passwords do not match');
      } else {
        this.setCustomValidity('');
      }
    });
  }
}

// Password Strength Calculation
function updatePasswordStrength(password) {
  const strengthIndicator = document.getElementById('passwordStrength');
  if (!strengthIndicator) return;
  
  const strength = calculatePasswordStrength(password);
  
  strengthIndicator.className = 'password-strength';
  if (strength > 0) {
    strengthIndicator.classList.add(getStrengthClass(strength));
  }
}

function calculatePasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  return strength;
}

function getStrengthClass(strength) {
  switch (strength) {
    case 1:
    case 2: return 'weak';
    case 3: return 'fair';
    case 4: return 'good';
    case 5: return 'strong';
    default: return '';
  }
}

function isPasswordStrong(password) {
  return calculatePasswordStrength(password) >= 4;
}

// Password Requirements Validation
function validatePasswordRequirements(password) {
  const requirements = {
    'req-length': password.length >= 8,
    'req-uppercase': /[A-Z]/.test(password),
    'req-lowercase': /[a-z]/.test(password),
    'req-number': /[0-9]/.test(password),
    'req-special': /[^A-Za-z0-9]/.test(password)
  };
  
  Object.entries(requirements).forEach(([id, isValid]) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('valid', isValid);
    }
  });
}

// Load Account Activity
async function loadAccountActivity() {
  const activityList = document.getElementById('activityList');
  if (!activityList) return;
  
  try {
    const response = await fetch('/api/settings/activity');
    const activities = await response.json();
    
    if (response.ok) {
      renderActivityList(activities);
    } else {
      activityList.innerHTML = '<div class="error">Failed to load activity</div>';
    }
  } catch (error) {
    console.error('Error loading activity:', error);
    activityList.innerHTML = '<div class="error">Failed to load activity</div>';
  }
}

function renderActivityList(activities) {
  const activityList = document.getElementById('activityList');
  
  if (activities.length === 0) {
    activityList.innerHTML = '<div class="loading">No recent activity</div>';
    return;
  }
  
  const html = activities.map(activity => `
    <div class="activity-item">
      <div class="activity-icon"></div>
      <div class="activity-content">
        <div class="activity-title">${escapeHtml(activity.action)}</div>
        <div class="activity-description">${escapeHtml(activity.description)}</div>
        <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
      </div>
    </div>
  `).join('');
  
  activityList.innerHTML = html;
}

// Load Active Sessions
async function loadActiveSessions() {
  const sessionsList = document.getElementById('sessionsList');
  if (!sessionsList) return;
  
  try {
    const response = await fetch('/api/settings/sessions');
    const sessions = await response.json();
    
    if (response.ok) {
      renderSessionsList(sessions);
    } else {
      sessionsList.innerHTML = '<div class="error">Failed to load sessions</div>';
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
    sessionsList.innerHTML = '<div class="error">Failed to load sessions</div>';
  }
}

function renderSessionsList(sessions) {
  const sessionsList = document.getElementById('sessionsList');
  
  if (sessions.length === 0) {
    sessionsList.innerHTML = '<div class="loading">No active sessions</div>';
    return;
  }
  
  const html = sessions.map(session => `
    <div class="session-item">
      <div class="session-info">
        <div class="session-icon">
          <i class="icon-${session.deviceType === 'mobile' ? 'smartphone' : 'monitor'}"></i>
        </div>
        <div class="session-details">
          <h4>
            ${escapeHtml(session.device)}
            ${session.isCurrent ? '<span class="session-current">Current</span>' : ''}
          </h4>
          <div class="session-meta">${escapeHtml(session.browser)} • ${escapeHtml(session.location)}</div>
          <div class="session-time">${formatTimeAgo(session.lastActive)}</div>
        </div>
      </div>
      ${!session.isCurrent ? `
        <button class="btn btn-danger btn-sm" onclick="terminateSession('${session.id}')">
          Terminate
        </button>
      ` : ''}
    </div>
  `).join('');
  
  sessionsList.innerHTML = html;
}

// Terminate Session
async function terminateSession(sessionId) {
  if (!confirm('Are you sure you want to terminate this session?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/settings/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showMessage('Session terminated successfully', 'success');
      loadActiveSessions(); // Reload sessions
    } else {
      showMessage(result.error || 'Failed to terminate session', 'error');
    }
  } catch (error) {
    console.error('Error terminating session:', error);
    showMessage('Failed to terminate session. Please try again.', 'error');
  }
}

// Utility Functions
function resetForm() {
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.reset();
  }
}

function clearPasswordForm() {
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.reset();
    updatePasswordStrength('');
    
    // Reset requirement indicators
    const requirements = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special'];
    requirements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.remove('valid');
      }
    });
  }
}

function showLoading(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="icon-loader"></i> Saving...';
  }
}

function hideLoading(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    // Restore original text based on form
    if (form.id === 'profileForm') {
      submitBtn.innerHTML = 'Save Changes';
    } else if (form.id === 'passwordForm') {
      submitBtn.innerHTML = 'Update Password';
    } else if (form.id === 'privacyForm') {
      submitBtn.innerHTML = 'Save Privacy Settings';
    }
  }
}

function showMessage(message, type) {
  const container = document.getElementById('messageContainer');
  if (!container) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = `message ${type}`;
  messageEl.textContent = message;
  
  container.appendChild(messageEl);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageEl.parentElement) {
      messageEl.remove();
    }
  }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
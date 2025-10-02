// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
});

function initializeDashboard() {
  // Load dashboard data
  loadDashboardStats();
  loadRecentActivity();
  loadConnections();
  loadUpcomingEvents();
  calculateProfileCompletion();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup periodic updates
  setInterval(updateDashboardData, 300000); // Update every 5 minutes
}

// Setup Event Listeners
function setupEventListeners() {
  // Quick action button
  const quickActionBtn = document.getElementById('quickActionBtn');
  if (quickActionBtn) {
    quickActionBtn.addEventListener('click', handleQuickAction);
  }
  
  // Refresh buttons
  const refreshButtons = document.querySelectorAll('[onclick="refreshActivity()"]');
  refreshButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      loadRecentActivity();
    });
  });
}

// Load Dashboard Statistics
async function loadDashboardStats() {
  try {
    const response = await fetch('/api/dashboard/stats');
    const stats = await response.json();
    
    if (response.ok) {
      updateStatsDisplay(stats);
    } else {
      console.error('Failed to load dashboard stats:', stats.error);
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

function updateStatsDisplay(stats) {
  // Update stats based on user role
  const userRole = window.currentUser?.role || 'student';
  
  if (userRole === 'student') {
    updateElement('connectionsCount', stats.connections || 0);
    updateElement('messagesCount', stats.messages || 0);
    updateElement('eventsCount', stats.events || 0);
    updateElement('skillsCount', stats.skills || 0);
  } else if (userRole === 'alumni') {
    updateElement('menteesCount', stats.mentees || 0);
    updateElement('ratingScore', (stats.rating || 0).toFixed(1));
    updateElement('hoursCount', stats.mentoringHours || 0);
    updateElement('experienceYears', stats.experienceYears || 0);
  } else if (userRole === 'faculty') {
    updateElement('studentsCount', stats.students || 0);
    updateElement('coursesCount', stats.courses || 0);
    updateElement('publicationsCount', stats.publications || 0);
    updateElement('achievementsCount', stats.achievements || 0);
  }
}

// Load Recent Activity
async function loadRecentActivity() {
  const activityList = document.getElementById('activityList');
  if (!activityList) return;
  
  try {
    activityList.innerHTML = '<div class="loading">Loading recent activity...</div>';
    
    const response = await fetch('/api/dashboard/activity');
    const activities = await response.json();
    
    if (response.ok) {
      renderActivityList(activities);
    } else {
      activityList.innerHTML = '<div class="loading">Failed to load activity</div>';
    }
  } catch (error) {
    console.error('Error loading activity:', error);
    activityList.innerHTML = '<div class="loading">Failed to load activity</div>';
  }
}

function renderActivityList(activities) {
  const activityList = document.getElementById('activityList');
  
  if (activities.length === 0) {
    activityList.innerHTML = '<div class="loading">No recent activity</div>';
    return;
  }
  
  const html = activities.slice(0, 5).map(activity => `
    <div class="activity-item">
      <div class="activity-icon ${activity.type}">
        <i class="icon-${getActivityIcon(activity.type)}"></i>
      </div>
      <div class="activity-content">
        <div class="activity-title">${escapeHtml(activity.title)}</div>
        <div class="activity-description">${escapeHtml(activity.description)}</div>
        <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
      </div>
    </div>
  `).join('');
  
  activityList.innerHTML = html;
}

// Load Connections
async function loadConnections() {
  const connectionsList = document.getElementById('connectionsList');
  if (!connectionsList) return;
  
  try {
    connectionsList.innerHTML = '<div class="loading">Loading connections...</div>';
    
    const response = await fetch('/api/dashboard/connections');
    const connections = await response.json();
    
    if (response.ok) {
      renderConnectionsList(connections);
    } else {
      connectionsList.innerHTML = '<div class="loading">Failed to load connections</div>';
    }
  } catch (error) {
    console.error('Error loading connections:', error);
    connectionsList.innerHTML = '<div class="loading">Failed to load connections</div>';
  }
}

function renderConnectionsList(connections) {
  const connectionsList = document.getElementById('connectionsList');
  
  if (connections.length === 0) {
    connectionsList.innerHTML = '<div class="loading">No connections yet</div>';
    return;
  }
  
  const html = connections.slice(0, 5).map(connection => `
    <div class="connection-item">
      <img src="${connection.profilePicture || '/images/default-avatar.png'}" alt="${escapeHtml(connection.name)}" class="connection-avatar">
      <div class="connection-info">
        <div class="connection-name">${escapeHtml(connection.name)}</div>
        <div class="connection-role">${escapeHtml(connection.role)}</div>
      </div>
      ${connection.isOnline ? '<div class="connection-status"></div>' : ''}
    </div>
  `).join('');
  
  connectionsList.innerHTML = html;
}

// Load Upcoming Events
async function loadUpcomingEvents() {
  const eventsList = document.getElementById('eventsList');
  if (!eventsList) return;
  
  try {
    eventsList.innerHTML = '<div class="loading">Loading events...</div>';
    
    const response = await fetch('/api/dashboard/events');
    const events = await response.json();
    
    if (response.ok) {
      renderEventsList(events);
    } else {
      eventsList.innerHTML = '<div class="loading">Failed to load events</div>';
    }
  } catch (error) {
    console.error('Error loading events:', error);
    eventsList.innerHTML = '<div class="loading">Failed to load events</div>';
  }
}

function renderEventsList(events) {
  const eventsList = document.getElementById('eventsList');
  
  if (events.length === 0) {
    eventsList.innerHTML = '<div class="loading">No upcoming events</div>';
    return;
  }
  
  const html = events.slice(0, 3).map(event => `
    <div class="event-item">
      <div class="event-date">${formatEventDate(event.date)}</div>
      <div class="event-title">${escapeHtml(event.title)}</div>
      <div class="event-description">${escapeHtml(event.description)}</div>
    </div>
  `).join('');
  
  eventsList.innerHTML = html;
}

// Calculate Profile Completion
function calculateProfileCompletion() {
  const user = window.currentUser;
  if (!user || !user.profile) return;
  
  const profile = user.profile;
  const requiredFields = [
    'firstName',
    'lastName',
    'bio',
    'university',
    'major'
  ];
  
  // Add role-specific fields
  if (user.role === 'alumni') {
    requiredFields.push('company', 'position', 'graduationYear');
  } else if (user.role === 'student') {
    requiredFields.push('graduationYear');
  }
  
  const completedFields = requiredFields.filter(field => 
    profile[field] && profile[field].toString().trim() !== ''
  );
  
  const percentage = Math.round((completedFields.length / requiredFields.length) * 100);
  
  updateElement('completionPercentage', `${percentage}%`);
  
  const progressBar = document.getElementById('completionProgress');
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
}

// Handle Quick Action
function handleQuickAction() {
  const userRole = window.currentUser?.role || 'student';
  
  if (userRole === 'student') {
    window.location.href = '/search';
  } else if (userRole === 'alumni') {
    window.location.href = '/students';
  } else if (userRole === 'faculty') {
    window.location.href = '/courses';
  }
}

// Update Dashboard Data (Periodic)
function updateDashboardData() {
  loadDashboardStats();
  loadRecentActivity();
}

// Refresh Activity
function refreshActivity() {
  loadRecentActivity();
}

// Utility Functions
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    // Add animation effect
    element.style.opacity = '0.5';
    setTimeout(() => {
      element.textContent = value;
      element.style.opacity = '1';
    }, 150);
  }
}

function getActivityIcon(type) {
  const icons = {
    message: 'message-circle',
    profile: 'user',
    connection: 'users',
    event: 'calendar',
    achievement: 'award',
    course: 'book',
    mentoring: 'heart',
    default: 'activity'
  };
  
  return icons[type] || icons.default;
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

function formatEventDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Tomorrow';
  } else if (diffInDays < 7) {
    return `In ${diffInDays} days`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make current user available globally
if (typeof window.currentUser === 'undefined') {
  // This would be set by the server in the template
  window.currentUser = {
    id: null,
    role: 'student',
    profile: {}
  };
}
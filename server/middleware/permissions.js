// Role-based Access Control (RBAC) Middleware

const permissions = {
  // User roles hierarchy (higher number = more permissions)
  roles: {
    'student': 1,
    'alumni': 2,
    'faculty': 3,
    'admin': 4,
    'super_admin': 5
  },
  
  // Permission definitions
  actions: {
    // Profile permissions
    'profile:view_own': ['student', 'alumni', 'faculty', 'admin', 'super_admin'],
    'profile:edit_own': ['student', 'alumni', 'faculty', 'admin', 'super_admin'],
    'profile:view_others': ['alumni', 'faculty', 'admin', 'super_admin'],
    'profile:edit_others': ['admin', 'super_admin'],
    
    // Chat permissions
    'chat:send_message': ['student', 'alumni', 'faculty', 'admin', 'super_admin'],
    'chat:view_conversations': ['student', 'alumni', 'faculty', 'admin', 'super_admin'],
    'chat:delete_own_messages': ['student', 'alumni', 'faculty', 'admin', 'super_admin'],
    'chat:delete_any_messages': ['admin', 'super_admin'],
    'chat:moderate': ['faculty', 'admin', 'super_admin'],
    
    // User management permissions
    'users:view_list': ['faculty', 'admin', 'super_admin'],
    'users:view_details': ['faculty', 'admin', 'super_admin'],
    'users:edit_profile': ['admin', 'super_admin'],
    'users:change_role': ['super_admin'],
    'users:suspend': ['admin', 'super_admin'],
    'users:delete': ['super_admin'],
    
    // Settings permissions
    'settings:view_own': ['student', 'alumni', 'faculty', 'admin', 'super_admin'],
    'settings:edit_own': ['student', 'alumni', 'faculty', 'admin', 'super_admin'],
    'settings:view_system': ['admin', 'super_admin'],
    'settings:edit_system': ['super_admin'],
    
    // Admin panel permissions
    'admin:access_panel': ['admin', 'super_admin'],
    'admin:view_analytics': ['admin', 'super_admin'],
    'admin:manage_content': ['admin', 'super_admin'],
    'admin:system_settings': ['super_admin'],
    
    // Content permissions
    'content:create': ['alumni', 'faculty', 'admin', 'super_admin'],
    'content:edit_own': ['alumni', 'faculty', 'admin', 'super_admin'],
    'content:edit_any': ['admin', 'super_admin'],
    'content:delete_own': ['alumni', 'faculty', 'admin', 'super_admin'],
    'content:delete_any': ['admin', 'super_admin'],
    'content:moderate': ['faculty', 'admin', 'super_admin']
  }
};

// Check if user has permission
function hasPermission(userRole, action) {
  const allowedRoles = permissions.actions[action];
  if (!allowedRoles) {
    console.warn(`Unknown permission action: ${action}`);
    return false;
  }
  
  return allowedRoles.includes(userRole);
}

// Check if user role is higher than or equal to required role
function hasRoleLevel(userRole, requiredRole) {
  const userLevel = permissions.roles[userRole] || 0;
  const requiredLevel = permissions.roles[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

// Middleware to require specific permission
function requirePermission(action) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.session.user.role;
    
    if (!hasPermission(userRole, action)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: action,
        userRole: userRole
      });
    }
    
    next();
  };
}

// Middleware to require minimum role level
function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.session.user.role;
    
    if (!hasRoleLevel(userRole, requiredRole)) {
      return res.status(403).json({
        error: 'Insufficient role level',
        code: 'ROLE_DENIED',
        required: requiredRole,
        userRole: userRole
      });
    }
    
    next();
  };
}

// Get user permissions for frontend
function getUserPermissions(userRole) {
  const userPermissions = {};
  
  Object.entries(permissions.actions).forEach(([action, allowedRoles]) => {
    userPermissions[action] = allowedRoles.includes(userRole);
  });
  
  return userPermissions;
}

module.exports = {
  permissions,
  hasPermission,
  hasRoleLevel,
  requirePermission,
  requireRole,
  getUserPermissions
};
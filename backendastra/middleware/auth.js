const jwt = require('jsonwebtoken');
const User = require('../models/User');

const userModel = new User();

// UPDATED: Support both Authorization header and cookie authentication
const authenticateUser = async (req, res, next) => {
  try {
    let token = null;
    
    // Try to get token from Authorization header first (for production)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      // console.log('🔐 Token found in Authorization header');
    } 
    // Fallback to cookie (for localhost/additional security)
    else if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
      // console.log('🔐 Token found in cookies');
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided',
        hint: 'Send token in Authorization header as "Bearer <token>" or ensure cookies are enabled'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for user:', decoded.email);
    
    // Get user from database
    const user = await userModel.findById(decoded.userId);
    
    if (!user) {
      // Clear invalid cookie if it exists
      res.clearCookie('authToken');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    // Clear invalid cookie
    res.clearCookie('authToken');
    
    // Handle different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// ENHANCED: Role-based authorization middleware
const requireRole = (allowedRoles) => {
  // Ensure allowedRoles is an array
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }
    
    // console.log(`✅ Role check passed: ${req.user.role} in [${allowedRoles.join(', ')}]`);
    next();
  };
};

// ENHANCED: Permission checking utilities
const checkPermissions = {
  canManageAnnouncements: (user) => user && user.role === 'admin',
  canAddEditorials: (user) => user && ['admin', 'mentor'].includes(user.role),
  canManageUsers: (user) => user && user.role === 'admin',
  canManageSheets: (user) => user && user.role === 'admin',
  canAddProblems: (user) => user && user.role === 'admin',
  // NEW: Additional permission checks
  canViewAnnouncements: (user) => user && ['admin', 'mentor', 'student'].includes(user.role),
  canCreatePosts: (user) => user && ['admin', 'mentor'].includes(user.role),
  isAuthenticated: (user) => !!user
};

// NEW: Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.userId);
      
      if (user) {
        req.user = user;
        // console.log('✅ Optional auth: User authenticated');
      }
    }
    
    // Continue regardless of authentication status
    next();
    
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    // console.log('⚠️ Optional auth: Invalid token, continuing without user');
    next();
  }
};

// NEW: Middleware to check specific permissions
const requirePermission = (permissionCheck) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!permissionCheck(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        userRole: req.user.role
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateUser,
  requireRole,
  checkPermissions,
  optionalAuth,
  requirePermission
};

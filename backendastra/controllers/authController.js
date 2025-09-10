const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const userModel = new User();

// Utility function to check if email is in admin list
const isAdminEmail = (email) => {
  if (!email || !process.env.ADMIN_EMAILS) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS
    .split(',')
    .map(e => e.trim().toLowerCase());
  
  return adminEmails.includes(email.toLowerCase());
};

// FIXED: Return JWT token in response for frontend localStorage
exports.verifyGoogleToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // console.log('✅ Google token verified for:', email);

    // Check if user exists
    let user = await userModel.findByGoogleId(googleId);
    let isNewUser = false;
    
    if (!user) {
      // Check if user exists by email
      user = await userModel.findByEmail(email);
      
      if (user) {
        // console.log('📝 Updating existing user with Google ID');
        const shouldBeAdmin = isAdminEmail(email);
        const updates = { 
          googleId,
          profilePicture: picture || user.profilePicture,
          name: name || user.name,
          ...(shouldBeAdmin && user.role !== 'admin' && { role: 'admin' })
        };
        
        await userModel.updateUser(user._id, updates);
        user.googleId = googleId;
        user.profilePicture = picture || user.profilePicture;
        user.name = name || user.name;
        
        if (shouldBeAdmin && user.role !== 'admin') {
          // console.log(`🔄 Promoting existing user ${email} to admin`);
          user.role = 'admin';
        }
      } else {
        // Create new user
        const userRole = isAdminEmail(email) ? 'admin' : 'student';
        
        // console.log(`📝 Creating new user with role: ${userRole}`);
        
        user = await userModel.createUser({
          googleId,
          name,
          email,
          profilePicture: picture || null,
          role: userRole
        });
        
        isNewUser = true;
        
        // Send welcome email asynchronously
        sendWelcomeEmail(user)
          .then((welcomeResult) => {
            if (welcomeResult.success) {
              // console.log(`✅ Welcome email sent to: ${email}`);
            }
          })
          .catch((welcomeError) => {
            console.error(`❌ Welcome email error for ${email}:`, welcomeError);
          });
      }
    } else {
      // console.log('✅ Existing user found, updating profile...');
      
      const shouldBeAdmin = isAdminEmail(email);
      const updates = {
        profilePicture: picture || user.profilePicture,
        name: name || user.name
      };
      
      if (shouldBeAdmin && user.role !== 'admin') {
        // console.log(`🔄 Promoting user ${email} to admin`);
        updates.role = 'admin';
        user.role = 'admin';
      }
      
      await userModel.updateUser(user._id, updates);
      user.profilePicture = picture || user.profilePicture;
      user.name = name || user.name;
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie (for additional security)
    res.cookie('authToken', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // console.log(`🎉 Authentication successful for ${user.name} (${user.role})`);

    // CRITICAL: Return JWT token in response body for frontend
    res.json({
      success: true,
      message: 'Authentication successful',
      token: jwtToken, // ← This is what was missing!
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || null,
        role: user.role
      },
      isNewUser,
      isAdmin: user.role === 'admin'
    });

  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid Google token'
    });
  }
};

// FIXED: Support both cookie and Authorization header authentication
exports.getCurrentUser = async (req, res) => {
  try {
    // Try to get token from Authorization header first, then cookie
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.authToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      res.clearCookie('authToken');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check admin status
    const shouldBeAdmin = isAdminEmail(user.email);
    if (shouldBeAdmin && user.role !== 'admin') {
      // console.log(`🔄 Auto-promoting ${user.email} to admin`);
      await userModel.updateUserRole(user._id, 'admin');
      user.role = 'admin';
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || null,
        role: user.role
      }
    });

  } catch (error) {
    res.clearCookie('authToken');
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('❌ getCurrentUser error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

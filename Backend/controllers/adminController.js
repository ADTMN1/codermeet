// controllers/adminController.js
const User = require("../models/user");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, role: 'admin' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, role: 'admin' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find admin user
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials"
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials"
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Prepare user data
    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      role: user.role,
      plan: user.plan,
      isProfessional: user.isProfessional,
      avatar: user.avatar,
      lastLogin: user.lastLogin,
      permissions: ['admin', 'user_management', 'leaderboard_management', 'system_monitoring']
    };

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        token: accessToken,
        refreshToken
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Admin logout
exports.adminLogout = async (req, res) => {
  try {
    // In a real implementation, you would invalidate the token
    // For now, just return success
    res.status(200).json({
      success: true,
      message: "Admin logged out successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required"
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: "Invalid admin user"
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    res.status(200).json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token"
    });
  }
};

// Get session info
exports.getSessionInfo = async (req, res) => {
  try {
    const user = await User.findById(req.userProfile._id).select('-password');
    
    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: "Invalid admin session"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (err) {
    console.error('Session info error:', err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Get admin profile
exports.getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userProfile._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update admin profile
exports.updateAdminProfile = async (req, res) => {
  try {
    const { fullName, email, phone, location, bio, adminProfile } = req.body;
    const userId = req.userProfile._id;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (bio) updateData.bio = bio;

    // Handle nested adminProfile updates
    if (adminProfile) {
      updateData.adminProfile = {};
      if (adminProfile.department) {
        updateData.adminProfile.department = adminProfile.department;
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });

  } catch (err) {
    console.error('Admin profile update error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Server error" 
    });
  }
};

// Change admin password
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userProfile._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Toggle 2FA
exports.toggleTwoFactorAuth = async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.userProfile._id;

    // In a real implementation, you would set up 2FA here
    // For now, just return success
    
    res.status(200).json({
      success: true,
      message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const trialUsers = await User.countDocuments({ plan: "Trial" });
    const basicUsers = await User.countDocuments({ plan: "Basic" });
    const premiumUsers = await User.countDocuments({ plan: "Premium" });
    const professionalUsers = await User.countDocuments({ isProfessional: true });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { 
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { 
        $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    // New users today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { 
        $gte: startOfDay
      }
    });

    // Calculate growth rates
    const monthlyGrowth = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.find({
      createdAt: { $gte: sevenDaysAgo }
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        trialUsers,
        basicUsers,
        premiumUsers,
        professionalUsers,
        adminUsers,
        newUsersThisMonth,
        newUsersLastMonth,
        newUsersToday,
        monthlyGrowth,
        recentUsers,
        recentActivity: recentUsers.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid role. Must be 'user' or 'admin'" 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get leaderboard data for admin
exports.getLeaderboardData = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'points',
      sortOrder = 'desc',
      plan = 'all',
      role = 'all',
      timeRange = 'all'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (plan !== 'all') {
      query.plan = plan;
    }

    if (role !== 'all') {
      query.role = role;
    }

    // Time range filtering
    if (timeRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        query.lastPointsUpdate = { $gte: startDate };
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Get users with pagination and sorting
    const users = await User.find(query)
      .select('username fullName email points avatar plan role lastPointsUpdate createdAt')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Add rank to each user
    const usersWithRank = users.map((user, index) => ({
      ...user.toObject(),
      rank: skip + index + 1
    }));

    res.status(200).json({
      success: true,
      data: {
        users: usersWithRank,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers,
          hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
          hasPrevPage: pageNum > 1
        },
        filters: {
          search,
          plan,
          role,
          timeRange,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user points
exports.updateUserPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, reason } = req.body;

    if (typeof points !== 'number' || points < 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Points must be a non-negative number" 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        points,
        lastPointsUpdate: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Points updated successfully

    res.status(200).json({
      success: true,
      message: "User points updated successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add bonus points to user
exports.addBonusPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { bonusPoints, reason } = req.body;

    if (typeof bonusPoints !== 'number' || bonusPoints <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Bonus points must be a positive number" 
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    const newPoints = user.points + bonusPoints;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        points: newPoints,
        lastPointsUpdate: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    // Bonus points added successfully

    res.status(200).json({
      success: true,
      message: `Successfully added ${bonusPoints} bonus points to ${user.username}`,
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get leaderboard activity
exports.getLeaderboardActivity = async (req, res) => {
  try {
    const { timeRange = '7days' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (timeRange) {
      case '24hours':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get recent points updates
    const recentUpdates = await User.find({
      lastPointsUpdate: { $gte: startDate }
    })
      .select('username fullName points lastPointsUpdate')
      .sort({ lastPointsUpdate: -1 })
      .limit(20);

    // Get top gainers in this period
    const topGainers = await User.find({
      lastPointsUpdate: { $gte: startDate }
    })
      .select('username fullName points')
      .sort({ points: -1 })
      .limit(10);

    // Points distribution
    const pointsStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' },
          avgPoints: { $avg: '$points' },
          maxPoints: { $max: '$points' },
          minPoints: { $min: '$points' },
          usersWithPoints: { $sum: { $cond: [{ $gt: ['$points', 0] }, 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        recentUpdates,
        topGainers,
        stats: pointsStats[0] || {
          totalPoints: 0,
          avgPoints: 0,
          maxPoints: 0,
          minPoints: 0,
          usersWithPoints: 0
        },
        timeRange
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Reset leaderboard
exports.resetLeaderboard = async (req, res) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== 'RESET_LEADERBOARD_CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: "Invalid confirmation. Use 'RESET_LEADERBOARD_CONFIRMED' to proceed."
      });
    }

    // Reset all user points to 0
    const result = await User.updateMany(
      {},
      { 
        points: 0,
        lastPointsUpdate: new Date()
      }
    );

    // Leaderboard reset completed

    res.status(200).json({
      success: true,
      message: `Leaderboard reset successfully. ${result.modifiedCount} users affected.`,
      data: {
        usersReset: result.modifiedCount
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get system health
exports.getSystemHealth = async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Get database connection status
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
      success: true,
      data: {
        server: {
          uptime: uptime,
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
            external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
          },
          nodeVersion: process.version,
          platform: process.platform,
        },
        database: {
          status: dbStatus,
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Promote user to admin
exports.promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Promote to admin
    user.role = 'admin';
    user.plan = 'Premium';
    user.isProfessional = true;
    user.setDefaultPermissions();
    await user.save();

    res.status(200).json({
      success: true,
      message: "User promoted to admin successfully",
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
          plan: user.plan
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Demote admin to user
exports.demoteFromAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Don't allow demoting the last admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot demote the last admin user" 
      });
    }

    // Demote to trial user
    user.role = 'trial';
    user.plan = 'Trial';
    user.isProfessional = false;
    user.permissions = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: "Admin demoted to regular user successfully",
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
          plan: user.plan
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all admin users
exports.getAdminUsers = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get system activity
exports.getSystemActivity = async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User registrations over time
    const registrations24h = await User.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    
    const registrations7d = await User.countDocuments({
      createdAt: { $gte: last7Days }
    });
    
    const registrations30d = await User.countDocuments({
      createdAt: { $gte: last30Days }
    });

    // Plan distribution
    const planDistribution = await User.aggregate([
      {
        $group: {
          _id: "$plan",
          count: { $sum: 1 }
        }
      }
    ]);

    // Role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Professional status
    const professionalCount = await User.countDocuments({ isProfessional: true });
    const nonProfessionalCount = await User.countDocuments({ isProfessional: false });

    res.status(200).json({
      success: true,
      data: {
        registrations: {
          last24Hours: registrations24h,
          last7Days: registrations7d,
          last30Days: registrations30d,
        },
        distributions: {
          plans: planDistribution,
          roles: roleDistribution,
          professional: {
            yes: professionalCount,
            no: nonProfessionalCount,
          },
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// controllers/adminController.js
const User = require("../models/user");
const mongoose = require("mongoose");

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

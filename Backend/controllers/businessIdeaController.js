const BusinessIdea = require('../models/businessIdea');
const Competition = require('../models/competition');
const Notification = require('../models/notification');
const User = require('../models/user');
const mongoose = require('mongoose');

// Submit a new business idea
const submitBusinessIdea = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      targetMarket,
      revenueModel,
      teamSize,
      currentStage,
      fundingNeeded,
      contactEmail,
      additionalInfo
    } = req.body;

    const businessIdea = new BusinessIdea({
      userId: req.userProfile._id,
      userName: req.body.userName,
      title,
      description,
      category,
      targetMarket,
      revenueModel,
      teamSize,
      currentStage,
      fundingNeeded,
      contactEmail,
      additionalInfo
    });

    await businessIdea.save();

    // Create notification for user who submitted business idea
    const userNotification = await Notification.createNotification({
      recipient: req.userProfile._id,
      sender: req.userProfile._id,
      title: 'Business Idea Submitted Successfully!',
      message: `Your business idea "${title}" has been submitted for review. We'll notify you once it's been reviewed.`,
      type: 'achievement',
      metadata: {
        businessIdeaId: businessIdea._id,
        category: category
      }
    });

    // Emit real-time notification to the user
    const io = req.app.get('io');
    if (io) {
      const populatedNotification = await Notification.findById(userNotification._id)
        .populate('sender', 'fullName username avatar')
        .populate('recipient', 'fullName username avatar')
        .exec();
      
      io.to(`user_${req.userProfile._id}`).emit('new-notification', populatedNotification.toJSON());
    }

    // Create notification for admins about new business idea submission
    try {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      
      for (const admin of adminUsers) {
        const adminNotification = await Notification.createNotification({
          recipient: admin._id,
          sender: req.userProfile._id,
          title: 'New Business Idea Submission',
          message: `A new business idea "${title}" has been submitted by ${req.body.userName}.`,
          type: 'system',
          metadata: {
            businessIdeaId: businessIdea._id,
            submittedBy: req.userProfile._id,
            category: category
          }
        });

        // Emit real-time notification to admin
        const io = req.app.get('io');
        if (io) {
          const populatedAdminNotification = await Notification.findById(adminNotification._id)
            .populate('sender', 'fullName username avatar')
            .populate('recipient', 'fullName username avatar')
            .exec();
          
          io.to(`user_${admin._id}`).emit('new-notification', populatedAdminNotification.toJSON());
          console.log(`Real-time notification sent to admin ${admin._id} for business idea submission`);
        }
      }
    } catch (adminError) {
      console.error('Error creating admin notifications:', adminError);
      // Don't fail the request if admin notifications fail
    }

    res.status(201).json(businessIdea);
  } catch (error) {
    console.error('Error submitting business idea:', error);
    res.status(500).json({ message: 'Failed to submit business idea' });
  }
};

// Get all business ideas for a user
const getUserBusinessIdeas = async (req, res) => {
  try {
    const ideas = await BusinessIdea.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(ideas);
  } catch (error) {
    console.error('Error fetching user ideas:', error);
    res.status(500).json({ message: 'Failed to fetch business ideas' });
  }
};

// Get all business ideas (for admin)
const getAllBusinessIdeas = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;

    const ideas = await BusinessIdea.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BusinessIdea.countDocuments(filter);

    res.json({
      ideas,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching all ideas:', error);
    res.status(500).json({ message: 'Failed to fetch business ideas' });
  }
};

// Update business idea status (for admin)
const updateIdeaStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    const idea = await BusinessIdea.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        reviewedBy: req.userProfile._id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!idea) {
      return res.status(404).json({ message: 'Business idea not found' });
    }

    res.json(idea);
  } catch (error) {
    console.error('Error updating idea status:', error);
    res.status(500).json({ message: 'Failed to update idea status' });
  }
};

// Get business idea statistics
const getIdeaStats = async (req, res) => {
  try {
    const stats = await BusinessIdea.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await BusinessIdea.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalIdeas = await BusinessIdea.countDocuments();

    res.json({
      totalIdeas,
      statusStats: stats,
      categoryStats
    });
  } catch (error) {
    console.error('Error fetching idea stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

// Get active business competition
const getActiveCompetition = async (req, res) => {
  try {
    // Find active competition with deadline in the future
    const activeCompetition = await Competition.findOne({
      isActive: true,
      deadline: { $gt: new Date() }
    }).sort({ deadline: 1 }); // Get the soonest deadline

    if (!activeCompetition) {
      // Return null if no active competition exists
      // Frontend will handle this by showing fallback content
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: activeCompetition
    });
  } catch (error) {
    console.error('Error fetching active competition:', error);
    // Return null on database errors so frontend shows fallback
    res.json({
      success: true,
      data: null
    });
  }
};

// Delete business idea
const deleteBusinessIdea = async (req, res) => {
  try {
    const ideaId = req.params.id;
    const userId = req.userProfile._id;

    const idea = await BusinessIdea.findOne({ _id: ideaId, userId: userId });
    
    if (!idea) {
      return res.status(404).json({ message: 'Business idea not found or you do not have permission to delete it' });
    }

    await BusinessIdea.findByIdAndDelete(ideaId);
    
    res.json({ message: 'Business idea deleted successfully' });
  } catch (error) {
    console.error('Error deleting business idea:', error);
    res.status(500).json({ message: 'Failed to delete business idea' });
  }
};

module.exports = {
  submitBusinessIdea,
  getUserBusinessIdeas,
  getAllBusinessIdeas,
  updateIdeaStatus,
  getIdeaStats,
  getActiveCompetition,
  deleteBusinessIdea
};

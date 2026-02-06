const BusinessIdea = require('../models/businessIdea');
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
      userId: req.user.id || req.user.userId,
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
        reviewedBy: req.user.id || req.user.userId,
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

module.exports = {
  submitBusinessIdea,
  getUserBusinessIdeas,
  getAllBusinessIdeas,
  updateIdeaStatus,
  getIdeaStats
};

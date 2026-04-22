// Enhanced weekly challenge controller with professional week management
const WeeklyChallenge = require('../models/weeklyChallenge');
const WeekManagementService = require('../services/weekManagementService');
const mongoose = require('mongoose');

// Get next available week with professional logic
exports.getNextAvailableWeek = async (req, res) => {
  try {
    const { year, options } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      });
    }
    
    const targetYear = parseInt(year);
    const parsedOptions = options ? JSON.parse(options) : {};
    
    // Validate year
    const validation = WeekManagementService.validateWeek(1, targetYear);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year',
        errors: validation.errors
      });
    }
    
    // Get all existing challenges for the year
    const existingChallenges = await WeeklyChallenge.find({
      year: targetYear
    }).select('weekNumber year status').sort({ weekNumber: 1 });
    
    // Get next available week using professional service
    const nextWeek = WeekManagementService.getNextAvailableWeek(
      existingChallenges, 
      targetYear, 
      parsedOptions
    );
    
    // Get current week info for context
    const currentWeek = WeekManagementService.getCurrentWeekInfo();
    
    res.status(200).json({
      success: true,
      data: {
        ...nextWeek,
        currentWeek,
        totalExistingChallenges: existingChallenges.length,
        existingWeeks: existingChallenges.map(ch => ({
          weekNumber: ch.weekNumber,
          status: ch.status,
          displayName: WeekManagementService.getWeekDisplayName(ch.weekNumber, targetYear, 'withDates')
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting next available week:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting next available week',
      error: error.message
    });
  }
};

// Create weekly challenge with automatic week assignment
exports.createWeeklyChallenge = async (req, res) => {
  try {
    const challengeData = req.body;
    const adminId = req.userProfile._id;
    
    // If weekNumber not provided, assign next available
    if (!challengeData.weekNumber) {
      const targetYear = challengeData.year || new Date().getFullYear();
      
      // Get existing challenges
      const existingChallenges = await WeeklyChallenge.find({
        year: targetYear
      }).select('weekNumber year');
      
      // Get next available week
      const nextWeek = WeekManagementService.getNextAvailableWeek(existingChallenges, targetYear);
      
      if (!nextWeek.isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'No available weeks for this year',
          suggestion: nextWeek.suggestion
        });
      }
      
      challengeData.weekNumber = nextWeek.weekNumber;
      challengeData.year = targetYear;
    }
    
    // Validate week and year
    const validation = WeekManagementService.validateWeek(
      challengeData.weekNumber, 
      challengeData.year
    );
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid week number or year',
        errors: validation.errors
      });
    }
    
    // Check if week already exists
    const existingChallenge = await WeeklyChallenge.findOne({
      weekNumber: challengeData.weekNumber,
      year: challengeData.year
    });
    
    if (existingChallenge) {
      return res.status(400).json({
        success: false,
        message: `Week ${challengeData.weekNumber} for ${challengeData.year} already exists`,
        existingChallenge: {
          _id: existingChallenge._id,
          title: existingChallenge.title,
          status: existingChallenge.status
        }
      });
    }
    
    // Auto-generate dates if not provided
    if (!challengeData.startDate || !challengeData.endDate) {
      const weekRange = WeekManagementService.getWeekRange(
        challengeData.weekNumber, 
        challengeData.year
      );
      challengeData.startDate = challengeData.startDate || weekRange.startDate;
      challengeData.endDate = challengeData.endDate || weekRange.endDate;
    }
    
    // Add metadata
    challengeData.createdBy = adminId;
    challengeData.weekStatus = WeekManagementService.getWeekStatus(
      challengeData.weekNumber, 
      challengeData.year
    );
    
    // Create the challenge
    const weeklyChallenge = new WeeklyChallenge(challengeData);
    await weeklyChallenge.save();
    
    // Populate creator info
    await weeklyChallenge.populate('createdBy', 'username fullName avatar');
    
    res.status(201).json({
      success: true,
      message: 'Weekly challenge created successfully',
      data: {
        ...weeklyChallenge.toObject(),
        displayName: WeekManagementService.getWeekDisplayName(
          weeklyChallenge.weekNumber, 
          weeklyChallenge.year, 
          'withDates'
        )
      }
    });
    
  } catch (error) {
    console.error('Error creating weekly challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating weekly challenge',
      error: error.message
    });
  }
};

// Get weekly challenges with enhanced week information
exports.getAllWeeklyChallenges = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      difficulty,
      year,
      search,
      weekStatus // 'past', 'current', 'upcoming'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (year) query.year = parseInt(year);
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filter by week status if requested
    if (weekStatus) {
      const currentWeek = WeekManagementService.getCurrentWeekInfo();
      const weekQuery = {};
      
      if (weekStatus === 'past') {
        weekQuery.$or = [
          { year: { $lt: currentWeek.year } },
          { year: currentWeek.year, weekNumber: { $lt: currentWeek.weekNumber } }
        ];
      } else if (weekStatus === 'current') {
        weekQuery.year = currentWeek.year;
        weekQuery.weekNumber = currentWeek.weekNumber;
      } else if (weekStatus === 'upcoming') {
        weekQuery.$or = [
          { year: { $gt: currentWeek.year } },
          { year: currentWeek.year, weekNumber: { $gt: currentWeek.weekNumber } }
        ];
      }
      
      Object.assign(query, weekQuery);
    }

    const weeklyChallenges = await WeeklyChallenge.find(query)
      .populate('createdBy', 'username fullName avatar')
      .populate('participants.user', 'username fullName avatar')
      .populate('winners.user', 'username fullName avatar')
      .sort({ year: 1, weekNumber: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await WeeklyChallenge.countDocuments(query);
    
    // Enhance challenges with week management data
    const enhancedChallenges = weeklyChallenges.map(challenge => {
      const challengeObj = challenge.toObject();
      return {
        ...challengeObj,
        displayName: WeekManagementService.getWeekDisplayName(
          challenge.weekNumber, 
          challenge.year, 
          'withDates'
        ),
        weekStatus: WeekManagementService.getWeekStatus(challenge.weekNumber, challenge.year),
        weekRange: WeekManagementService.getWeekRange(challenge.weekNumber, challenge.year)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        weeklyChallenges: enhancedChallenges,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        },
        currentWeek: WeekManagementService.getCurrentWeekInfo()
      }
    });
  } catch (error) {
    console.error('Error fetching weekly challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly challenges',
      error: error.message
    });
  }
};

module.exports = {
  getNextAvailableWeek: exports.getNextAvailableWeek,
  createWeeklyChallenge: exports.createWeeklyChallenge,
  getAllWeeklyChallenges: exports.getAllWeeklyChallenges
};

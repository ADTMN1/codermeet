const WeeklyChallenge = require('../models/weeklyChallenge');
const User = require('../models/user');
const Notification = require('../models/notification');
const mongoose = require('mongoose');

// Automatic status update function
const updateChallengeStatuses = async () => {
  try {
    const now = new Date();
    
    // Find upcoming challenges that should be active
    const upcomingToActive = await WeeklyChallenge.find({
      status: 'upcoming',
      startDate: { $lte: now },
      endDate: { $gt: now }
    });
    
    for (const challenge of upcomingToActive) {
      challenge.status = 'active';
      await challenge.save();
      console.log(`🔄 Challenge "${challenge.title}" automatically changed to ACTIVE`);
    }
    
    // Find active challenges that should be completed
    const activeToCompleted = await WeeklyChallenge.find({
      status: 'active',
      endDate: { $lte: now }
    });
    
    for (const challenge of activeToCompleted) {
      challenge.status = 'completed';
      await challenge.save();
      console.log(`🏁 Challenge "${challenge.title}" automatically changed to COMPLETED`);
    }
    
  } catch (error) {
    console.error('❌ Error updating challenge statuses:', error);
  }
};

// Run status update every 5 minutes
setInterval(updateChallengeStatuses, 5 * 60 * 1000);

// Run once on server start
updateChallengeStatuses();

// Get all weekly challenges
exports.getAllWeeklyChallenges = async (req, res) => {
  try {
    // Run status update before fetching challenges
    await updateChallengeStatuses();
    
    const {
      page = 1,
      limit = 10,
      status,
      category,
      difficulty,
      year,
      search
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

    const weeklyChallenges = await WeeklyChallenge.find(query)
      .populate('createdBy', 'username fullName avatar')
      .populate('participants.user', 'username fullName avatar')
      .populate('winners.user', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await WeeklyChallenge.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        weeklyChallenges,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
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

// Get next available week number for a given year
exports.getNextAvailableWeek = async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year is required'
      });
    }
    
    const targetYear = parseInt(year);
    
    // Get all existing weeks for the year
    const existingChallenges = await WeeklyChallenge.find({
      year: targetYear
    }).select('weekNumber').sort({ weekNumber: 1 });
    
    const existingWeeks = existingChallenges.map(ch => ch.weekNumber);
    
    // Find the first available week (1-52)
    let nextAvailableWeek = 1;
    for (let i = 1; i <= 52; i++) {
      if (!existingWeeks.includes(i)) {
        nextAvailableWeek = i;
        break;
      }
    }
    
    // If all weeks are taken, suggest next year
    if (existingWeeks.includes(nextAvailableWeek)) {
      return res.status(200).json({
        success: true,
        data: {
          nextAvailableWeek: null,
          year: targetYear,
          allWeeksTaken: true,
          suggestion: `All weeks for ${targetYear} are taken. Try year ${targetYear + 1}`,
          nextYear: targetYear + 1
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        nextAvailableWeek,
        year: targetYear,
        allWeeksTaken: false,
        existingWeeks
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

// Check if weekly challenge exists for specific week and year
exports.checkWeeklyChallengeExists = async (req, res) => {
  try {
    const { weekNumber, year } = req.query;
    
    if (!weekNumber || !year) {
      return res.status(400).json({
        success: false,
        message: 'Week number and year are required'
      });
    }
    
    const existingChallenge = await WeeklyChallenge.findOne({
      weekNumber: parseInt(weekNumber),
      year: parseInt(year)
    }).populate('createdBy', 'username fullName avatar')
      .select('title status weekNumber year createdBy createdAt');
    
    res.status(200).json({
      success: true,
      data: {
        exists: !!existingChallenge,
        challenge: existingChallenge
      }
    });
  } catch (error) {
    console.error('Error checking weekly challenge existence:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking weekly challenge existence',
      error: error.message
    });
  }
};

// Get weekly challenge by ID
exports.getWeeklyChallengeById = async (req, res) => {
  try {
    // Run status update before fetching challenge
    await updateChallengeStatuses();
    
    const { id } = req.params;

    const weeklyChallenge = await WeeklyChallenge.findById(id)
      .populate('createdBy', 'username fullName avatar')
      .populate('participants.user', 'username fullName avatar')
      .populate('submissions.user', 'username fullName avatar')
      .populate('winners.user', 'username fullName avatar')
      .populate('submissions.reviewedBy', 'username fullName');

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      data: weeklyChallenge
    });
  } catch (error) {
    console.error('Error fetching weekly challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly challenge',
      error: error.message
    });
  }
};

// Create weekly challenge
exports.createWeeklyChallenge = async (req, res) => {
  try {
    console.log('🔍 Debug - createWeeklyChallenge called');
    console.log('🔍 Debug - req.userProfile:', req.userProfile);
    console.log('🔍 Debug - req.user:', req.user);
    console.log('🔍 Debug - req.body:', req.body);
    
    const challengeData = {
      ...req.body,
      createdBy: req.userProfile._id
    };
    
    console.log('🔍 Debug - challengeData:', challengeData);

    const weeklyChallenge = new WeeklyChallenge(challengeData);
    await weeklyChallenge.save();

    // Populate the created challenge
    await weeklyChallenge.populate('createdBy', 'username fullName avatar');

    // Create notification for admin users about new challenge
    try {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      
      for (const admin of adminUsers) {
        await Notification.createNotification({
          recipient: admin._id,
          sender: req.userProfile._id,
          title: 'New Weekly Challenge Created',
          message: `${weeklyChallenge.title} has been created for ${weeklyChallenge.category}`,
          type: 'challenge',
          metadata: { 
            priority: 'medium',
            challengeId: weeklyChallenge._id,
            category: weeklyChallenge.category
          }
        });
      }
      
      // Emit real-time notifications
      const io = req.app.get('io');
      if (io) {
        for (const admin of adminUsers) {
          io.to(`user_${admin._id}`).emit('new-notification', {
            type: 'challenge_creation',
            title: 'New Weekly Challenge Created',
            message: `${weeklyChallenge.title} has been created for ${weeklyChallenge.category}`,
            priority: 'medium'
          });
        }
      }
    } catch (notificationError) {
      console.error('Error creating challenge notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Weekly challenge created successfully',
      data: weeklyChallenge
    });
  } catch (error) {
    console.error('Error creating weekly challenge:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    
    if (error.code === 11000) {
      // Duplicate key error (week number + year)
      const duplicateField = Object.keys(error.keyPattern)[0];
      const duplicateValue = error.keyValue;
      
      if (duplicateField === 'weekNumber' && duplicateField in error.keyPattern) {
        return res.status(409).json({
          success: false,
          message: `A weekly challenge for week ${duplicateValue.weekNumber} of ${duplicateValue.year} already exists`,
          error: 'DUPLICATE_WEEK',
          weekNumber: duplicateValue.weekNumber,
          year: duplicateValue.year,
          suggestion: 'You can update the existing challenge or choose a different week'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'A duplicate record already exists',
        error: 'DUPLICATE_RECORD',
        duplicateField,
        duplicateValue
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating weekly challenge',
      error: error.message
    });
  }
};

// Update weekly challenge
exports.updateWeeklyChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const weeklyChallenge = await WeeklyChallenge.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username fullName avatar');

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Weekly challenge updated successfully',
      data: weeklyChallenge
    });
  } catch (error) {
    console.error('Error updating weekly challenge:', error);
    if (error.code === 11000) {
      // Duplicate key error (week number + year)
      const duplicateField = Object.keys(error.keyPattern)[0];
      const duplicateValue = error.keyValue;
      
      if (duplicateField === 'weekNumber' && 'year' in error.keyPattern) {
        return res.status(409).json({
          success: false,
          message: `A weekly challenge for week ${duplicateValue.weekNumber} of ${duplicateValue.year} already exists`,
          error: 'DUPLICATE_WEEK',
          weekNumber: duplicateValue.weekNumber,
          year: duplicateValue.year,
          suggestion: 'You can update the existing challenge or choose a different week'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'A duplicate record already exists',
        error: 'DUPLICATE_RECORD',
        duplicateField,
        duplicateValue
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating weekly challenge',
      error: error.message
    });
  }
};

// Delete weekly challenge
exports.deleteWeeklyChallenge = async (req, res) => {
  try {
    const { id } = req.params;

    const weeklyChallenge = await WeeklyChallenge.findByIdAndDelete(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Weekly challenge deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting weekly challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting weekly challenge',
      error: error.message
    });
  }
};

// Join weekly challenge
exports.joinWeeklyChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile._id;

    const weeklyChallenge = await WeeklyChallenge.findById(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    // Check if user is already a participant
    const existingParticipant = weeklyChallenge.participants.find(
      p => p.user.toString() === userId.toString()
    );

    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already participating in this challenge'
      });
    }

    // Check if challenge is full
    if (weeklyChallenge.maxParticipants && 
        weeklyChallenge.currentParticipants >= weeklyChallenge.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'This challenge is already full'
      });
    }

    // Check if challenge is still active for joining
    if (weeklyChallenge.status !== 'upcoming' && weeklyChallenge.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This challenge is not accepting new participants'
      });
    }

    // Add participant
    weeklyChallenge.participants.push({
      user: userId,
      joinedAt: new Date()
    });
    weeklyChallenge.currentParticipants += 1;

    await weeklyChallenge.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined the weekly challenge',
      data: weeklyChallenge
    });
  } catch (error) {
    console.error('Error joining weekly challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining weekly challenge',
      error: error.message
    });
  }
};

// Clear submission for testing
exports.clearSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = '6957ad5161015aa2d862aa3b'; // Test user ID
    
    const weeklyChallenge = await WeeklyChallenge.findById(id);
    
    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }
    
    // Remove user's submission
    weeklyChallenge.submissions = weeklyChallenge.submissions.filter(
      s => s.user.toString() !== userId.toString()
    );
    
    await weeklyChallenge.save();
    
    res.status(200).json({
      success: true,
      message: 'Submission cleared successfully',
      data: {
        remainingSubmissions: weeklyChallenge.submissions.length
      }
    });
  } catch (error) {
    console.error('Error clearing submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing submission',
      error: error.message
    });
  }
};

// Debug endpoint to check user participation
exports.checkUserParticipation = async (req, res) => {
  try {
    const { id } = req.params;
    const weeklyChallenge = await WeeklyChallenge.findById(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    // Get all participants
    const participants = weeklyChallenge.participants.map(p => ({
      userId: p.user,
      joinedAt: p.joinedAt
    }));

    // Get all submissions
    const submissions = weeklyChallenge.submissions.map(s => ({
      userId: s.user,
      submittedAt: s.submittedAt,
      githubUrl: s.githubUrl
    }));

    res.status(200).json({
      success: true,
      data: {
        challenge: {
          title: weeklyChallenge.title,
          status: weeklyChallenge.status,
          totalParticipants: weeklyChallenge.participants.length,
          totalSubmissions: weeklyChallenge.submissions.length
        },
        participants: participants,
        submissions: submissions
      }
    });
  } catch (error) {
    console.error('Error checking user participation:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking user participation',
      error: error.message
    });
  }
};

// Temporary endpoint to fix challenge dates
exports.fixChallengeDates = async (req, res) => {
  try {
    const { id } = req.params;
    const weeklyChallenge = await WeeklyChallenge.findById(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    // Update dates to make it active now
    const now = new Date();
    weeklyChallenge.startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    weeklyChallenge.endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    weeklyChallenge.status = 'active';
    
    await weeklyChallenge.save();

    res.status(200).json({
      success: true,
      message: 'Challenge dates updated successfully',
      data: {
        title: weeklyChallenge.title,
        status: weeklyChallenge.status,
        startDate: weeklyChallenge.startDate,
        endDate: weeklyChallenge.endDate,
        currentDate: now
      }
    });
  } catch (error) {
    console.error('Error fixing challenge dates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing challenge dates',
      error: error.message
    });
  }
};

// Debug endpoint to check challenge status
exports.debugChallengeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const weeklyChallenge = await WeeklyChallenge.findById(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    const now = new Date();
    const shouldBeActive = weeklyChallenge.startDate <= now && weeklyChallenge.endDate > now;

    // Auto-update if needed
    if (shouldBeActive && weeklyChallenge.status !== 'active') {
      weeklyChallenge.status = 'active';
      await weeklyChallenge.save();
    }

    res.status(200).json({
      success: true,
      data: {
        title: weeklyChallenge.title,
        status: weeklyChallenge.status,
        startDate: weeklyChallenge.startDate,
        endDate: weeklyChallenge.endDate,
        currentDate: now,
        shouldBeActive: shouldBeActive,
        updated: shouldBeActive && weeklyChallenge.status === 'active'
      }
    });
  } catch (error) {
    console.error('Error checking challenge status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking challenge status',
      error: error.message
    });
  }
};

// Submit project for weekly challenge
exports.submitWeeklyChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Debug - Request object:', {
      hasUser: !!req.user,
      hasUserProfile: !!req.userProfile,
      userId: req.user?.id || req.user?.userId,
      userProfileId: req.userProfile?._id,
      userProfileEmail: req.userProfile?.email
    });
    
    // For testing without auth, use a default user ID
    let userId;
    if (req.userProfile && req.userProfile._id) {
      userId = req.userProfile._id;
    } else {
      // Test user ID (same as the one in participation data)
      userId = '6957ad5161015aa2d862aa3b';
      console.log('🧪 Using test user ID for debugging:', userId);
    }
    
    const { githubUrl, liveUrl, description, screenshots } = req.body;

    console.log('📝 Submission attempt:', {
      challengeId: id,
      userId: userId,
      githubUrl: githubUrl
    });

    const weeklyChallenge = await WeeklyChallenge.findById(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    // Check if user is a participant
    const isParticipant = weeklyChallenge.participants.some(
      p => p.user.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You must join this challenge before submitting'
      });
    }

    // Check if challenge is still active
    if (weeklyChallenge.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This challenge is not accepting submissions'
      });
    }

    // Check if user has already submitted
    const existingSubmission = weeklyChallenge.submissions.find(
      s => s.user.toString() === userId.toString()
    );

    if (existingSubmission) {
      console.log('🚫 Duplicate submission detected for user:', userId);
      return res.status(400).json({
        success: false,
        message: 'You have already submitted to this challenge'
      });
    }

    // Create submission data in backend (UI handled by backend)
    const submissionData = {
      user: userId,
      submittedAt: new Date(),
      githubUrl: githubUrl || '',
      liveUrl: liveUrl || '',
      description: description || `Project submitted by participant`,
      screenshots: [], // Backend manages screenshots array
      status: 'pending',
      score: 0
    };

    // Add submission
    weeklyChallenge.submissions.push(submissionData);

    await weeklyChallenge.save();

    // Create notification for admin users about new submission
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    
    for (const admin of adminUsers) {
      await Notification.createNotification({
        recipient: admin._id,
        sender: userId,
        title: 'New Challenge Submission',
        message: `New project submitted for weekly challenge: ${weeklyChallenge.title}`,
        type: 'challenge', // Use valid enum value
        metadata: {
          priority: 'medium',
          challengeId: weeklyChallenge._id,
          userId: userId
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project submitted successfully',
      data: weeklyChallenge
    });
  } catch (error) {
    console.error('Error submitting weekly challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting weekly challenge',
      error: error.message
    });
  }
};

// Review submission
exports.reviewWeeklySubmission = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { status, score, reviewComments } = req.body;
    const reviewerId = req.userProfile._id;

    const weeklyChallenge = await WeeklyChallenge.findById(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    const submission = weeklyChallenge.submissions.id(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Update submission
    submission.status = status;
    submission.score = score || 0;
    submission.reviewComments = reviewComments;
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();

    await weeklyChallenge.save();

    res.status(200).json({
      success: true,
      message: 'Submission reviewed successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing submission',
      error: error.message
    });
  }
};

// Announce winners
exports.announceWinners = async (req, res) => {
  try {
    const { id } = req.params;
    const { winners } = req.body; // Array of { userId, rank, score, prizeAmount }

    const weeklyChallenge = await WeeklyChallenge.findById(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    // Clear existing winners
    weeklyChallenge.winners = [];

    // Add new winners
    for (const winnerData of winners) {
      weeklyChallenge.winners.push({
        user: winnerData.userId,
        rank: winnerData.rank,
        score: winnerData.score,
        prizeAmount: winnerData.prizeAmount,
        announcedAt: new Date()
      });
    }

    // Update status to completed
    weeklyChallenge.status = 'completed';

    await weeklyChallenge.save();

    res.status(200).json({
      success: true,
      message: 'Winners announced successfully',
      data: weeklyChallenge
    });
  } catch (error) {
    console.error('Error announcing winners:', error);
    res.status(500).json({
      success: false,
      message: 'Error announcing winners',
      error: error.message
    });
  }
};

// Get user's submission for a weekly challenge
exports.getUserSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile._id;

    const weeklyChallenge = await WeeklyChallenge.findById(id)
      .populate('submissions.user', 'username fullName avatar email');

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    const submission = weeklyChallenge.submissions.find(
      sub => {
        const submissionUserId = sub.user._id ? sub.user._id.toString() : sub.user.toString();
        return submissionUserId === userId.toString();
      }
    );

    if (!submission) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No submission found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: error.message
    });
  }
};

// Get weekly challenge statistics
exports.getWeeklyChallengeStats = async (req, res) => {
  try {
    const stats = await WeeklyChallenge.aggregate([
      {
        $group: {
          _id: null,
          totalWeeklyChallenges: { $sum: 1 },
          draftChallenges: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          upcomingChallenges: {
            $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] }
          },
          activeChallenges: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedChallenges: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalParticipants: { $sum: '$currentParticipants' },
          totalSubmissions: { $sum: { $size: { $ifNull: ['$submissions', []] } } },
          featuredChallenges: {
            $sum: { $cond: ['$isFeatured', 1, 0] }
          },
          totalPrizePool: { $sum: '$prizePool' }
        }
      }
    ]);

    const categoryStats = await WeeklyChallenge.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgParticipants: { $avg: '$currentParticipants' },
          avgSubmissions: { $avg: { $size: { $ifNull: ['$submissions', []] } } }
        }
      }
    ]);

    const difficultyStats = await WeeklyChallenge.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgParticipants: { $avg: '$currentParticipants' },
          avgSubmissions: { $avg: { $size: { $ifNull: ['$submissions', []] } } }
        }
      }
    ]);

    const recentActivity = await WeeklyChallenge.find({
      $or: [
        { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        { 'submissions.submittedAt': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    })
    .select('title status createdAt submissions')
    .sort({ createdAt: -1 })
    .limit(10);

    const result = stats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalChallenges: result.totalWeeklyChallenges || 0,
          draftChallenges: result.draftChallenges || 0,
          upcomingChallenges: result.upcomingChallenges || 0,
          activeChallenges: result.activeChallenges || 0,
          completedChallenges: result.completedChallenges || 0,
          totalParticipants: result.totalParticipants || 0,
          totalSubmissions: result.totalSubmissions || 0,
          featuredChallenges: result.featuredChallenges || 0,
          totalPrizePool: result.totalPrizePool || 0
        },
        byCategory: categoryStats,
        byDifficulty: difficultyStats,
        recentActivity,
        totalGenerated: result.totalWeeklyChallenges || 0
      }
    });
  } catch (error) {
    console.error('Error fetching weekly challenge stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly challenge statistics',
      error: error.message
    });
  }
};

// Get all submissions for a weekly challenge (admin only)
exports.getWeeklyChallengeSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find the weekly challenge and populate submissions
    const challenge = await WeeklyChallenge.findById(id)
      .populate({
        path: 'submissions.user',
        select: 'username fullName avatar email'
      });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    // Filter submissions by status if provided
    let submissions = challenge.submissions || [];
    if (status) {
      submissions = submissions.filter(sub => sub.status === status);
    }

    // Sort by submission date (newest first)
    submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Apply pagination
    const total = submissions.length;
    const paginatedSubmissions = submissions.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      data: paginatedSubmissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching weekly challenge submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly challenge submissions',
      error: error.message
    });
  }
};

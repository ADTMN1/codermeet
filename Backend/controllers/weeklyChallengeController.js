const WeeklyChallenge = require('../models/weeklyChallenge');
const mongoose = require('mongoose');

// Lazy load User to avoid circular dependency
const getUser = () => require('../models/user');
const getNotification = () => require('../models/notification');

// Get all weekly challenges
exports.getAllWeeklyChallenges = async (req, res) => {
  try {
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
      const User = getUser();
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      
      for (const admin of adminUsers) {
        const Notification = getNotification();
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

// Submit project for weekly challenge
exports.submitWeeklyChallenge = async (req, res) => {
  try {
    console.log('🔍 Debug - submitWeeklyChallenge called');
    console.log('🔍 Debug - req.userProfile:', req.userProfile);
    console.log('🔍 Debug - req.user:', req.user);
    console.log('🔍 Debug - req.params:', req.params);
    console.log('🔍 Debug - req.body:', req.body);
    
    const { id } = req.params;
    const userId = req.userProfile._id;
    const { githubUrl, liveUrl, description, screenshots } = req.body;

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

    // Check if challenge is still active for submissions
    if (weeklyChallenge.status !== 'active' && weeklyChallenge.status !== 'upcoming') {
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
      return res.status(400).json({
        success: false,
        message: 'You have already submitted to this challenge'
      });
    }

    // Add submission
    weeklyChallenge.submissions.push({
      user: userId,
      submittedAt: new Date(),
      githubUrl,
      liveUrl,
      description,
      screenshots: screenshots || []
    });

    await weeklyChallenge.save();

    // Create notification for admin users about new submission
    const User = getUser();
    const Notification = getNotification();
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    
    for (const admin of adminUsers) {
      await Notification.createNotification({
          recipient: admin._id,
          sender: userId,
          title: 'New Challenge Submission',
          message: `New project submitted for weekly challenge: ${weeklyChallenge.title}`,
          type: 'challenge',
          metadata: {
            priority: 'medium',
            challengeId: weeklyChallenge._id,
            userId: userId
          }
        });
    }

    // Create notification for the user who submitted
    console.log('🔍 Creating user notification for:', userId);
    try {
      const userNotification = await Notification.createNotification({
        recipient: userId,
        sender: userId,
        title: '🎯 Project Submitted Successfully!',
        message: `Your project for "${weeklyChallenge.title}" has been submitted and is now under review.`,
        type: 'challenge',
        metadata: {
          priority: 'high',
          challengeId: weeklyChallenge._id,
          submissionType: 'weekly_challenge'
        }
      });
      console.log('🔍 User notification created successfully');

      // Emit real-time notification to the user
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('new-notification', {
          type: 'challenge_submission',
          title: '🎯 Project Submitted Successfully!',
          message: `Your project for "${weeklyChallenge.title}" has been submitted and is now under review.`,
          priority: 'high',
          notification: userNotification
        });
        console.log('🔍 Real-time notification emitted to user:', userId);
      }
    } catch (notificationError) {
      console.error('🔍 Error creating user notification:', notificationError);
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

    // Create notification for the user who submitted
    await Notification.createNotification({
      recipient: submission.user,
      sender: reviewerId,
      title: status === 'accepted' ? '🎉 Submission Accepted!' : '📝 Submission Reviewed',
      message: `Your submission for "${weeklyChallenge.title}" has been ${status}${score ? ` with a score of ${score}/100` : ''}.`,
      type: status === 'accepted' ? 'achievement' : 'challenge',
      metadata: {
        challengeId: id,
        submissionId: submissionId,
        status,
        score,
        feedback: reviewComments,
        challengeType: 'weekly'
      }
    });

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
    const adminId = req.userProfile._id;

    const weeklyChallenge = await WeeklyChallenge.findById(id);

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    // Clear existing winners
    weeklyChallenge.winners = [];

    // Add new winners and send notifications
    for (const winnerData of winners) {
      weeklyChallenge.winners.push({
        user: winnerData.userId,
        rank: winnerData.rank,
        score: winnerData.score,
        prizeAmount: winnerData.prizeAmount,
        announcedAt: new Date()
      });

      // Create notification for each winner
      await Notification.createNotification({
        recipient: winnerData.userId,
        sender: adminId,
        title: '🏆 Challenge Winner!',
        message: `Congratulations! You ranked ${winnerData.rank}${winnerData.rank === 1 ? 'st' : winnerData.rank === 2 ? 'nd' : winnerData.rank === 3 ? 'rd' : 'th'} in "${weeklyChallenge.title}"${winnerData.prizeAmount ? ` and won $${winnerData.prizeAmount}` : ''}!`,
        type: 'achievement',
        metadata: {
          challengeId: id,
          rank: winnerData.rank,
          score: winnerData.score,
          prizeAmount: winnerData.prizeAmount,
          challengeType: 'weekly'
        }
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
      return res.status(404).json({
        success: false,
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

// Get individual weekly challenge statistics
exports.getWeeklyChallengeByIdStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid challenge ID format'
      });
    }
    
    const challenge = await WeeklyChallenge.findById(id)
      .populate('participants', 'fullName username')
      .populate('submissions');
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    const stats = {
      participants: challenge.participants?.length || 0,
      teams: challenge.teams?.length || 0,
      submissions: challenge.submissions?.length || 0,
      title: challenge.title,
      status: challenge.status
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly challenge statistics',
      error: error.message
    });
  }
};

// Get weekly challenge leaderboard (challenge-specific rankings)
exports.getWeeklyChallengeLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile?._id || req.user?.id;

    const weeklyChallenge = await WeeklyChallenge.findById(id)
      .populate('submissions.user', 'fullName username avatar email')
      .populate('submissions.reviewedBy', 'fullName username');

    if (!weeklyChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Weekly challenge not found'
      });
    }

    // Process submissions for leaderboard
    const leaderboardEntries = weeklyChallenge.submissions
      .map(submission => {
        const submissionObj = submission.toObject();
        return {
          _id: submissionObj._id,
          userId: submissionObj.user._id,
          userName: submissionObj.user.fullName,
          userUsername: submissionObj.user.username,
          userAvatar: submissionObj.user.avatar,
          totalScore: submissionObj.score || 0,
          rank: 0, // Will be calculated below
          submittedAt: submissionObj.submittedAt,
          reviewedAt: submissionObj.reviewedAt,
          criteriaScores: submissionObj.criteriaScores || [],
          feedback: submissionObj.reviewComments,
          status: submissionObj.status,
          isCurrentUser: userId && submissionObj.user._id.toString() === userId.toString()
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore) // Sort by score descending
      .map((entry, index) => ({
        ...entry,
        rank: index + 1 // Assign rank
      }));

    // Find current user's rank
    const currentUserEntry = leaderboardEntries.find(entry => entry.isCurrentUser);
    const currentUserRank = currentUserEntry ? currentUserEntry.rank : null;

    res.status(200).json({
      success: true,
      data: {
        challengeId: weeklyChallenge._id,
        challengeTitle: weeklyChallenge.title,
        challengeStatus: weeklyChallenge.status,
        evaluationCriteria: weeklyChallenge.scoringCriteria || [],
        totalParticipants: weeklyChallenge.participants?.length || 0,
        totalSubmissions: leaderboardEntries.length,
        leaderboard: leaderboardEntries,
        currentUserRank,
        topThree: leaderboardEntries.slice(0, 3),
        isCompleted: weeklyChallenge.status === 'completed',
        winnersAnnounced: weeklyChallenge.winnerAnnounced || false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly challenge leaderboard',
      error: error.message
    });
  }
};

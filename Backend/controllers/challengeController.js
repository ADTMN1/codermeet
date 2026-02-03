// controllers/challengeController.js
const Challenge = require('../models/challenge');
const User = require('../models/user');

// Create new challenge
exports.createChallenge = async (req, res) => {
  try {
    const challengeData = {
      ...req.body,
      createdBy: req.userProfile?._id || req.user?.id
    };

    const challenge = new Challenge(challengeData);
    await challenge.save();

    await Challenge.populate(challenge, [
      { path: 'createdBy', select: 'fullName username email' },
      { path: 'judges.user', select: 'fullName username' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating challenge',
      error: error.message
    });
  }
};

// Get all challenges (admin view)
exports.getAllChallenges = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      difficulty,
      search 
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Convert to numbers and validate
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const challenges = await Challenge.find(query)
      .populate('createdBy', 'fullName username email')
      .populate('participants.user', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const total = await Challenge.countDocuments(query);

    // Convert Mongoose documents to plain objects to avoid circular references
    const challengesData = challenges.map(challenge => challenge.toObject());

    res.status(200).json({
      success: true,
      data: challengesData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in getAllChallenges:', error);
    console.error('❌ DEBUG: Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching challenges',
      error: error.message
    });
  }
};

// Get challenge by ID
exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', 'fullName username email')
      .populate('participants.user', 'fullName username avatar email')
      .populate('submissions.userId', 'fullName username avatar email')
      .populate('submissions.reviewedBy', 'fullName username')
      .populate('prizes.winner', 'fullName username avatar email')
      .populate('judges.user', 'fullName username email');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching challenge',
      error: error.message
    });
  }
};

// Update challenge
exports.updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName username email');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge updated successfully',
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating challenge',
      error: error.message
    });
  }
};

// Delete challenge
exports.deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting challenge',
      error: error.message
    });
  }
};

// Get individual challenge statistics
exports.getChallengeByIdStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const challenge = await Challenge.findById(id)
      .populate('participants', 'fullName username')
      .populate('submissions');
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
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
      message: 'Error fetching challenge statistics',
      error: error.message
    });
  }
};

// Get challenge statistics
exports.getChallengeStats = async (req, res) => {
  try {
    const stats = await Challenge.aggregate([
      {
        $group: {
          _id: null,
          totalChallenges: { $sum: 1 },
          draftChallenges: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          publishedChallenges: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          activeChallenges: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedChallenges: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalParticipants: { $sum: '$currentParticipants' },
          totalSubmissions: { $sum: { $size: '$submissions' } },
          featuredChallenges: {
            $sum: { $cond: ['$featured', 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Challenge.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgParticipants: { $avg: '$currentParticipants' },
          avgSubmissions: { $avg: { $size: '$submissions' } }
        }
      }
    ]);

    const difficultyStats = await Challenge.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgParticipants: { $avg: '$currentParticipants' },
          avgSubmissions: { $avg: { $size: '$submissions' } }
        }
      }
    ]);

    const recentActivity = await Challenge.find({
      $or: [
        { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        { 'submissions.submittedAt': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    })
    .select('title status createdAt submissions')
    .sort({ createdAt: -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {},
        byCategory: categoryStats,
        byDifficulty: difficultyStats,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching challenge stats',
      error: error.message
    });
  }
};

// Submit project for a challenge
exports.submitProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile?._id || req.user?.id;
    const { githubUrl, description, files } = req.body;

    // Validate required fields
    if (!githubUrl && (!files || files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Either GitHub URL or files are required'
      });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Check if user is registered for this challenge
    const isRegistered = challenge.participants.some(
      participant => participant.user.toString() === userId
    );

    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this challenge to submit a project'
      });
    }

    // Check if user has already submitted
    const existingSubmissionIndex = challenge.submissions.findIndex(
      submission => submission.userId.toString() === userId
    );

    if (existingSubmissionIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a project for this challenge. Resubmission is not allowed.'
      });
    }

    const submissionData = {
      userId: userId,
      content: description || 'Project submission via GitHub URL', // Provide default content
      githubUrl: githubUrl || '',
      description: description || '',
      files: files || [],
      submittedAt: new Date(),
      status: 'pending'
    };

    // Create new submission
    challenge.submissions.push(submissionData);

    await challenge.save();

    // Populate submission data for response
    await Challenge.populate(challenge, {
      path: 'submissions.userId',
      select: 'fullName username email avatar'
    });

    const submission = challenge.submissions.find(
      sub => sub.userId.toString() === userId
    );

    res.status(200).json({
      success: true,
      message: 'Project submitted successfully!',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all submissions across all challenges (admin only)
exports.getAllSubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const challenges = await Challenge.find({})
      .populate('submissions.userId', 'fullName username email avatar')
      .populate('submissions.reviewedBy', 'fullName username');

    let allSubmissions = [];
    
    challenges.forEach(challenge => {
      challenge.submissions.forEach(submission => {
        allSubmissions.push({
          ...submission.toObject(),
          challengeTitle: challenge.title,
          challengeId: challenge._id,
          challengeStatus: challenge.status
        });
      });
    });

    // Filter by status if provided
    if (status) {
      allSubmissions = allSubmissions.filter(sub => sub.status === status);
    }

    // Sort by submission date (newest first)
    allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedSubmissions = allSubmissions.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedSubmissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allSubmissions.length,
        pages: Math.ceil(allSubmissions.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching all submissions',
      error: error.message
    });
  }
};

// Get user's submission for a challenge
exports.getUserSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile?._id || req.user?.id;

    const challenge = await Challenge.findById(id)
      .populate('submissions.userId', 'fullName username email avatar');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    const submission = challenge.submissions.find(
      sub => {
        const submissionUserId = sub.userId._id ? sub.userId._id.toString() : sub.userId.toString();
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

// Check if user is registered for a challenge
exports.checkRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile?._id || req.user?.id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Check if user is in participants list
    const isRegistered = challenge.participants.some(
      participant => participant.user.toString() === userId
    );

    res.status(200).json({
      success: true,
      isRegistered,
      challenge: {
        id: challenge._id,
        title: challenge.title,
        status: challenge.status,
        startDate: challenge.startDate,
        endDate: challenge.endDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking registration',
      error: error.message
    });
  }
};

// Review submission
exports.reviewSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, score, feedback } = req.body;

    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    const submission = challenge.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.status = status;
    submission.score = score;
    submission.feedback = feedback;
    submission.reviewedBy = req.userProfile?._id || req.user?.id;
    submission.reviewedAt = new Date();

    await challenge.save();

    await Challenge.populate(challenge, [
      { path: 'submissions.userId', select: 'fullName username email' },
      { path: 'submissions.reviewedBy', select: 'fullName username' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Submission reviewed successfully',
      data: submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reviewing submission',
      error: error.message
    });
  }
};

// Select winners and award prizes
exports.selectWinners = async (req, res) => {
  try {
    const { winners } = req.body; // [{ position: 1, userId: '...' }, ...]

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Update prize winners
    winners.forEach(winner => {
      const prize = challenge.prizes.find(p => p.position === winner.position);
      if (prize) {
        prize.winner = winner.userId;
        prize.awardedAt = new Date();
      }
    });

    challenge.winnerAnnounced = true;
    challenge.winnerAnnouncedAt = new Date();
    challenge.status = 'completed';

    await challenge.save();

    await Challenge.populate(challenge, [
      { path: 'prizes.winner', select: 'fullName username email avatar' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Winners selected successfully',
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error selecting winners',
      error: error.message
    });
  }
};

// Get all submissions for a challenge
exports.getChallengeSubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const challenge = await Challenge.findById(req.params.id)
      .populate('submissions.userId', 'fullName username email avatar')
      .populate('submissions.reviewedBy', 'fullName username');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    let submissions = challenge.submissions;

    if (status) {
      submissions = submissions.filter(sub => sub.status === status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedSubmissions = submissions.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedSubmissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: submissions.length,
        pages: Math.ceil(submissions.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
};

// Register for challenge
exports.registerForChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile?._id || req.user?.id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Get user to check plan
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a paid plan (Basic or Premium) - Trial users can only view
    if (user.plan === 'Trial') {
      return res.status(403).json({
        success: false,
        message: 'Trial users can only view challenges. Upgrade to Basic or Premium plan to participate.'
      });
    }

    // Check if user is already registered
    const isAlreadyRegistered = challenge.participants.some(
      participant => participant.user.toString() === userId
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this challenge'
      });
    }

    // Check max participants limit
    if (challenge.maxParticipants && challenge.currentParticipants >= challenge.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Challenge has reached maximum participants'
      });
    }

    // Add user to participants
    challenge.participants.push({
      user: userId,
      joinedAt: new Date()
    });

    // Increment current participants count
    challenge.currentParticipants += 1;

    await challenge.save();

    // Populate user data for response
    await challenge.populate('participants.user', 'fullName username email');

    res.status(200).json({
      success: true,
      message: 'Successfully registered for challenge',
      data: {
        challenge: {
          _id: challenge._id,
          title: challenge.title,
          currentParticipants: challenge.currentParticipants,
          maxParticipants: challenge.maxParticipants
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering for challenge',
      error: error.message
    });
  }
};

// Unregister from challenge
exports.unregisterFromChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userProfile?._id || req.user?.id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Remove user from participants
    challenge.participants = challenge.participants.filter(
      participant => participant.user.toString() !== userId
    );

    // Decrement current participants count
    challenge.currentParticipants = Math.max(0, challenge.currentParticipants - 1);

    await challenge.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unregistered from challenge',
      data: {
        challenge: {
          _id: challenge._id,
          title: challenge.title,
          currentParticipants: challenge.currentParticipants,
          maxParticipants: challenge.maxParticipants
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unregistering from challenge',
      error: error.message
    });
  }
};

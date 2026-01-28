// controllers/challengeController.js
const Challenge = require('../models/challenge');
const User = require('../models/user');

// Create new challenge
exports.createChallenge = async (req, res) => {
  try {
    const challengeData = {
      ...req.body,
      createdBy: req.user.id
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
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const challenges = await Challenge.find(query)
      .populate('createdBy', 'fullName username email')
      .populate('participants.user', 'fullName username avatar')
      .populate('submissions.userId', 'fullName username avatar')
      .populate('prizes.winner', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Challenge.countDocuments(query);

    res.status(200).json({
      success: true,
      data: challenges,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
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
    submission.reviewedBy = req.user.id;
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
    const userId = req.user.id;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
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
    const userId = req.user.id;

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

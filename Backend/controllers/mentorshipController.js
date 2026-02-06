const User = require('../models/user');
const MentorshipSession = require('../models/mentorshipSession');
const Mentor = require('../models/mentor');

// Get upcoming mentorship session for the current user
exports.getUpcomingSession = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const upcomingSession = await MentorshipSession.findOne({
      $or: [
        { mentee: userId },
        { mentor: userId }
      ],
      status: 'scheduled',
      scheduledTime: { $gt: new Date() }
    })
    .populate('mentee mentor', 'name username email avatar')
    .sort({ scheduledTime: 1 });

    if (!upcomingSession) {
      return res.json({
        success: true,
        data: null
      });
    }

    // Generate meeting link if not exists
    if (!upcomingSession.meetingLink) {
      upcomingSession.meetingLink = generateMeetingLink(upcomingSession._id);
      await upcomingSession.save();
    }

    res.json({
      success: true,
      data: upcomingSession
    });
  } catch (error) {
    console.error('Error fetching upcoming session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming session'
    });
  }
};

// Get all mentorship sessions for the current user
exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = {
      $or: [
        { mentee: userId },
        { mentor: userId }
      ]
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const sessions = await MentorshipSession.find(query)
      .populate('mentee mentor', 'name username email avatar')
      .sort({ scheduledTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MentorshipSession.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user sessions'
    });
  }
};

// Get available mentors for booking
exports.getAvailableMentors = async (req, res) => {
  try {
    const { expertise, maxPrice, minRating, page = 1, limit = 10 } = req.query;
    
    const filters = {};
    if (expertise) filters.expertise = expertise.split(',');
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (minRating) filters.minRating = parseFloat(minRating);

    const mentors = await Mentor.findAvailable(filters)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Mentor.countDocuments({ status: 'active' });

    res.json({
      success: true,
      data: {
        mentors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching available mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available mentors'
    });
  }
};

// Book a mentorship session
exports.bookSession = async (req, res) => {
  try {
    const { mentorId, topic, description, scheduledTime, duration = 60, sessionType = 'video_call' } = req.body;
    const menteeId = req.user.id;

    // Validate mentor exists and is available
    const mentor = await Mentor.findOne({ user: mentorId, status: 'active' }).populate('user');
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found or unavailable'
      });
    }

    // Check if mentee is trying to book with themselves
    if (mentorId === menteeId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book session with yourself'
      });
    }

    // Validate scheduled time
    const sessionDate = new Date(scheduledTime);
    const now = new Date();
    
    if (sessionDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Session must be scheduled for a future time'
      });
    }

    // Check if time is at least 24 hours in advance
    const minBookingTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (sessionDate < minBookingTime) {
      return res.status(400).json({
        success: false,
        message: 'Sessions must be booked at least 24 hours in advance'
      });
    }

    // Check if mentor is available at the requested time
    if (!mentor.isAvailableAt(sessionDate)) {
      return res.status(400).json({
        success: false,
        message: 'Mentor is not available at the requested time'
      });
    }

    // Check for existing sessions at the same time
    const existingSession = await MentorshipSession.findOne({
      $or: [
        { mentee: menteeId, scheduledTime: sessionDate },
        { mentor: mentorId, scheduledTime: sessionDate }
      ],
      status: { $in: ['pending', 'scheduled'] }
    });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Calculate session price
    const sessionPrice = calculateSessionPrice(mentor, duration, sessionType);

    // Create the session
    const session = new MentorshipSession({
      mentee: menteeId,
      mentor: mentorId,
      topic,
      description,
      scheduledTime: sessionDate,
      duration,
      sessionType,
      payment: {
        amount: sessionPrice,
        status: 'pending'
      },
      reminders: [
        new Date(sessionDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
        new Date(sessionDate.getTime() - 60 * 60 * 1000), // 1 hour before
        new Date(sessionDate.getTime() - 15 * 60 * 1000) // 15 minutes before
      ]
    });

    await session.save();

    // Update mentor stats
    mentor.stats.totalSessions += 1;
    await mentor.save();

    // Send notifications (in a real app, this would send emails/push notifications)
    console.log(`Session booked: ${session._id} between mentee ${menteeId} and mentor ${mentorId}`);

    res.status(201).json({
      success: true,
      message: 'Session booked successfully',
      data: {
        sessionId: session._id,
        paymentAmount: sessionPrice,
        scheduledTime: session.scheduledTime
      }
    });
  } catch (error) {
    console.error('Error booking session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book session'
    });
  }
};

// Cancel a session
exports.cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const session = await MentorshipSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is authorized to cancel
    if (session.mentee.toString() !== userId && session.mentor.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this session'
      });
    }

    // Check if session can be cancelled
    if (!session.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Session cannot be cancelled (less than 24 hours before or already in progress)'
      });
    }

    session.status = 'cancelled';
    session.notes = reason || 'Session cancelled by user';
    await session.save();

    // Process refund if payment was made
    if (session.payment.status === 'paid') {
      session.payment.status = 'refunded';
      await session.save();
      // In a real app, this would trigger actual refund process
      console.log(`Refund processed for session ${sessionId}`);
    }

    res.json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel session'
    });
  }
};

// Join a session
exports.joinSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await MentorshipSession.findById(sessionId)
      .populate('mentee mentor', 'name username email avatar');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is authorized to join
    if (session.mentee._id.toString() !== userId && session.mentor._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to join this session'
      });
    }

    // Check if it's time to join (within 15 minutes of scheduled time)
    const now = new Date();
    const sessionTime = new Date(session.scheduledTime);
    const timeDiff = Math.abs(now - sessionTime);
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    if (minutesDiff > 15 && now < sessionTime) {
      return res.status(400).json({
        success: false,
        message: 'Too early to join session. Please join within 15 minutes of scheduled time.'
      });
    }

    if (now > sessionTime.getTime() + session.duration * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: 'Session has already ended'
      });
    }

    // Generate or get meeting link
    if (!session.meetingLink) {
      session.meetingLink = generateMeetingLink(session._id);
      await session.save();
    }

    // Update session status if not already in progress
    if (session.status === 'scheduled') {
      session.status = 'in_progress';
      await session.save();
    }

    res.json({
      success: true,
      message: 'Joined session successfully',
      data: {
        meetingLink: session.meetingLink,
        session: {
          id: session._id,
          topic: session.topic,
          duration: session.duration,
          mentor: session.mentor,
          mentee: session.mentee,
          scheduledTime: session.scheduledTime
        }
      }
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join session'
    });
  }
};

// Rate a session
exports.rateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const { rating, feedback } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const session = await MentorshipSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user participated in the session
    const isMentee = session.mentee.toString() === userId;
    const isMentor = session.mentor.toString() === userId;

    if (!isMentee && !isMentor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this session'
      });
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed sessions'
      });
    }

    // Update rating based on user role
    if (isMentee) {
      session.rating.menteeRating = rating;
      session.rating.menteeFeedback = feedback || '';
    } else {
      session.rating.mentorRating = rating;
      session.rating.mentorFeedback = feedback || '';
    }

    await session.save();

    // Update mentor's overall rating
    const mentor = await Mentor.findOne({ user: session.mentor });
    if (mentor && isMentee) {
      await mentor.updateRating(rating);
    }

    res.json({
      success: true,
      message: 'Session rated successfully'
    });
  } catch (error) {
    console.error('Error rating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate session'
    });
  }
};

// Get mentorship statistics
exports.getMentorshipStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's mentor profile if they are a mentor
    const mentorProfile = await Mentor.findOne({ user: userId }).populate('user');
    
    // Get session statistics
    const sessionStats = await MentorshipSession.aggregate([
      {
        $match: {
          $or: [
            { mentee: mongoose.Types.ObjectId(userId) },
            { mentor: mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      totalSessions: sessionStats.reduce((sum, stat) => sum + stat.count, 0),
      completedSessions: sessionStats.find(s => s._id === 'completed')?.count || 0,
      cancelledSessions: sessionStats.find(s => s._id === 'cancelled')?.count || 0,
      upcomingSessions: sessionStats.find(s => s._id === 'scheduled')?.count || 0,
      isMentor: !!mentorProfile,
      mentorProfile: mentorProfile ? {
        totalSessions: mentorProfile.stats.totalSessions,
        completedSessions: mentorProfile.stats.completedSessions,
        averageRating: mentorProfile.stats.averageRating,
        totalRatings: mentorProfile.stats.totalRatings
      } : null
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching mentorship stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorship statistics'
    });
  }
};

// Helper functions
function generateMeetingLink(sessionId) {
  // In a real app, this would generate a real video meeting link
  // For now, we'll generate a mock link
  return `https://meet.codermeet.com/session/${sessionId}`;
}

function calculateSessionPrice(mentor, duration, sessionType) {
  const sessionTypePricing = mentor.pricing.sessionTypes.find(
    st => st.type === sessionType && st.duration === duration
  );
  
  if (sessionTypePricing) {
    return sessionTypePricing.price;
  }
  
  // Fallback to hourly rate calculation
  return (mentor.pricing.hourlyRate * duration) / 60;
}

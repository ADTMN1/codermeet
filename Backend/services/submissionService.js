const Submission = require('../models/Submission');
const User = require('../models/user');
const Challenge = require('../models/challenge');
const WeeklyChallenge = require('../models/weeklyChallenge');
const DailyChallenge = require('../models/dailyChallenge');
const Notification = require('../models/notification');

/**
 * Professional Submission Service
 * Handles all submission-related business logic
 * Follows enterprise patterns: single responsibility, dependency injection, error handling
 */

class SubmissionService {
  constructor() {
    this.Submission = Submission;
    this.User = User;
  }

  /**
   * Create a new submission
   * @param {Object} submissionData - Submission data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created submission
   */
  async createSubmission(submissionData, userId) {
    try {
      // Validate challenge exists and is active
      const challenge = await this._getChallengeById(submissionData.challengeId, submissionData.challengeType);
      if (!challenge) {
        throw new Error('Challenge not found');
      }
      
      if (!this._isChallengeActive(challenge)) {
        throw new Error('Challenge is not active for submissions');
      }

      // Check for duplicate submissions (if challenge doesn't allow multiple)
      if (!challenge.allowMultipleSubmissions) {
        const existingSubmission = await this.Submission.findOne({
          userId,
          challengeId: submissionData.challengeId,
          status: { $ne: 'rejected' }
        });
        
        if (existingSubmission) {
          throw new Error('You have already submitted to this challenge');
        }
      }

      // Validate submission content based on challenge type
      this._validateSubmissionContent(submissionData, submissionData.challengeType);

      // Create submission
      const submission = new this.Submission({
        ...submissionData,
        userId,
        submittedAt: new Date()
      });

      await submission.save();

      // Populate user data for response
      await submission.populate('userId', 'fullName username avatar email');

      return {
        success: true,
        data: submission,
        message: 'Submission created successfully'
      };
    } catch (error) {
      console.error('Error creating submission:', error);
      throw new Error(error.message || 'Failed to create submission');
    }
  }

  /**
   * Get all submissions with filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Filtered submissions
   */
  async getAllSubmissions(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        challengeType,
        userId,
        startDate,
        endDate,
        sortBy = 'submittedAt',
        sortOrder = 'desc'
      } = filters;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = { isArchived: { $ne: true } };
      
      if (status && status !== 'all') query.status = status;
      if (challengeType && challengeType !== 'all') query.challengeType = challengeType;
      if (userId) query.userId = userId;
      
      if (startDate || endDate) {
        query.submittedAt = {};
        if (startDate) query.submittedAt.$gte = new Date(startDate);
        if (endDate) query.submittedAt.$lte = new Date(endDate);
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const [submissions, total] = await Promise.all([
        this.Submission.find(query)
          .populate('userId', 'fullName username avatar email')
          .populate('challengeId', 'title category difficulty')
          .populate('reviewedBy', 'fullName username')
          .sort(sort)
          .skip(skip)
          .limit(limitNum),
        this.Submission.countDocuments(query)
      ]);

      // Get weekly challenge submissions if no specific challengeType is requested
      let weeklySubmissions = [];
      if (!challengeType || challengeType === 'all' || challengeType === 'weekly') {
        weeklySubmissions = await this._getAllWeeklyChallengeSubmissions(filters);
      }

      // Combine all submissions
      const allSubmissions = [...submissions, ...weeklySubmissions];

      // Get statistics
      const stats = await this.getSubmissionStats(filters);

      return {
        success: true,
        data: allSubmissions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total + weeklySubmissions.length,
          pages: Math.ceil((total + weeklySubmissions.length) / limitNum),
          hasNext: pageNum * limitNum < (total + weeklySubmissions.length),
          hasPrev: pageNum > 1
        },
        stats
      };
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw new Error(error.message || 'Failed to fetch submissions');
    }
  }

  /**
   * Get all weekly challenge submissions
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Weekly challenge submissions
   */
  async _getAllWeeklyChallengeSubmissions(filters = {}) {
    try {
      const { status, userId } = filters;
      
      const weeklyChallenges = await WeeklyChallenge.find({})
        .populate('submissions.user', 'fullName username avatar email')
        .populate('submissions.reviewedBy', 'fullName username');
      
      let allSubmissions = [];
      
      weeklyChallenges.forEach(challenge => {
        if (challenge.submissions && challenge.submissions.length > 0) {
          const challengeSubmissions = challenge.submissions.map(submission => {
            const submissionObj = submission.toObject();
            return {
              _id: submissionObj._id,
              userId: submissionObj.user,
              challengeId: challenge._id,
              challengeTitle: challenge.title,
              challengeType: 'weekly',
              challengeCategory: challenge.category,
              challengeDifficulty: challenge.difficulty,
              status: submissionObj.status,
              submittedAt: submissionObj.submittedAt,
              githubUrl: submissionObj.githubUrl,
              description: submissionObj.description,
              score: submissionObj.score,
              feedback: submissionObj.reviewComments,
              reviewedBy: submissionObj.reviewedBy,
              reviewedAt: submissionObj.reviewedAt,
              content: submissionObj.content
            };
          });
          
          // Filter by status if provided
          const filteredSubmissions = status 
            ? challengeSubmissions.filter(sub => sub.status === status)
            : challengeSubmissions;
          
          // Filter by userId if provided
          const userFilteredSubmissions = userId
            ? filteredSubmissions.filter(sub => sub.userId._id.toString() === userId)
            : filteredSubmissions;
          
          allSubmissions.push(...userFilteredSubmissions);
        }
      });
      
      // Sort by submittedAt descending
      allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      
      return allSubmissions;
    } catch (error) {
      console.error('Error fetching weekly challenge submissions:', error);
      return [];
    }
  }

  /**
   * Get submission statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Statistics
   */
  async getSubmissionStats(filters = {}) {
    try {
      const stats = await this.Submission.getStats(filters);
      
      // Process the stats to get proper counts
      const processedStats = {
        total: 0,
        byType: {},
        byStatus: {},
        avgScore: 0,
        avgCompletionTime: 0
      };

      if (stats.length > 0) {
        const result = stats[0];
        processedStats.total = result.total;
        processedStats.avgScore = result.avgScore || 0;
        processedStats.avgCompletionTime = result.avgCompletionTime || 0;

        // Process byType
        result.byType.forEach(item => {
          processedStats.byType[item.type] = (processedStats.byType[item.type] || 0) + 1;
        });

        // Process byStatus
        result.byStatus.forEach(item => {
          processedStats.byStatus[item.status] = (processedStats.byStatus[item.status] || 0) + 1;
        });
      }

      return processedStats;
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      throw new Error(error.message || 'Failed to fetch submission stats');
    }
  }

  /**
   * Get submission by ID
   * @param {string} submissionId - Submission ID
   * @returns {Promise<Object>} Submission details
   */
  async getSubmissionById(submissionId) {
    try {
      const submission = await this.Submission.findById(submissionId)
        .populate('userId', 'fullName username avatar email')
        .populate('challengeId', 'title category difficulty')
        .populate('reviewedBy', 'fullName username');

      if (!submission) {
        throw new Error('Submission not found');
      }

      return {
        success: true,
        data: submission
      };
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw new Error(error.message || 'Failed to fetch submission');
    }
  }

  /**
   * Review a submission
   * @param {string} submissionId - Submission ID
   * @param {Object} reviewData - Review data
   * @param {string} reviewerId - Reviewer ID
   * @returns {Promise<Object>} Updated submission
   */
  async reviewSubmission(submissionId, reviewData, reviewerId) {
    try {
      const submission = await this.Submission.findById(submissionId);
      
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Allow re-reviewing submissions (commenting out the restriction)
      // if (submission.status === 'approved' || submission.status === 'rejected') {
      //   throw new Error('Submission has already been reviewed');
      // }

      // Add review to history and update submission directly
      const updatedSubmission = await this.Submission.findByIdAndUpdate(
        submissionId,
        {
          $push: {
            reviewHistory: {
              reviewedBy: reviewerId,
              previousStatus: submission.status,
              newStatus: reviewData.status,
              feedback: reviewData.feedback,
              score: reviewData.score || 0,
              reviewedAt: new Date()
            }
          },
          $set: {
            status: reviewData.status,
            feedback: reviewData.feedback,
            score: reviewData.score || 0,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            lastUpdated: new Date()
          }
        },
        { new: true }
      );

      // Update user points if approved
      if (reviewData.status === 'approved') {
        await this._updateUserPoints(submission.userId, reviewData.score || 0);
      }

      // Send notification to user
      await this._sendReviewNotification(submission.userId, reviewData);

      const finalSubmission = await this.Submission.findById(submissionId)
        .populate('userId', 'fullName username avatar email')
        .populate('challengeId', 'title category difficulty')
        .populate('reviewedBy', 'fullName username');

      return {
        success: true,
        data: finalSubmission,
        message: 'Submission reviewed successfully'
      };
    } catch (error) {
      console.error('Error reviewing submission:', error);
      throw new Error(error.message || 'Failed to review submission');
    }
  }

  /**
   * Get submissions for a specific challenge
   * @param {string} challengeId - Challenge ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Challenge submissions
   */
  async getChallengeSubmissions(challengeId, options = {}) {
    try {
      const submissions = await this.Submission.findByChallenge(challengeId, options);
      
      return {
        success: true,
        data: submissions
      };
    } catch (error) {
      console.error('Error fetching challenge submissions:', error);
      throw new Error(error.message || 'Failed to fetch challenge submissions');
    }
  }

  /**
   * Get submissions by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User submissions
   */
  async getUserSubmissions(userId, options = {}) {
    try {
      const submissions = await this.Submission.findByUser(userId, options);
      
      return {
        success: true,
        data: submissions
      };
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      throw new Error(error.message || 'Failed to fetch user submissions');
    }
  }

  /**
   * Archive a submission
   * @param {string} submissionId - Submission ID
   * @param {string} archivedBy - User ID who is archiving
   * @returns {Promise<Object>} Archived submission
   */
  async archiveSubmission(submissionId, archivedBy) {
    try {
      const submission = await this.Submission.findById(submissionId);
      
      if (!submission) {
        throw new Error('Submission not found');
      }

      await submission.archive(archivedBy);

      return {
        success: true,
        message: 'Submission archived successfully'
      };
    } catch (error) {
      console.error('Error archiving submission:', error);
      throw new Error(error.message || 'Failed to archive submission');
    }
  }

  // Private helper methods

  async _getChallengeById(challengeId, challengeType) {
    switch (challengeType) {
      case 'weekly':
        return await WeeklyChallenge.findById(challengeId);
      case 'daily':
        return await DailyChallenge.findById(challengeId);
      default:
        return await Challenge.findById(challengeId);
    }
  }

  _isChallengeActive(challenge) {
    if (!challenge) return false;
    
    const now = new Date();
    if (challenge.startDate && now < new Date(challenge.startDate)) return false;
    if (challenge.endDate && now > new Date(challenge.endDate)) return false;
    if (challenge.status !== 'published' && challenge.status !== 'active') return false;
    
    return true;
  }

  _validateSubmissionContent(submissionData, challengeType) {
    switch (challengeType) {
      case 'weekly':
        if (!submissionData.content.githubUrl && !submissionData.content.liveUrl) {
          throw new Error('Weekly challenges require either GitHub URL or live URL');
        }
        break;
      case 'daily':
        if (!submissionData.content.code) {
          throw new Error('Daily challenges require code submission');
        }
        break;
      default:
        // For other challenge types, at least one content field is required
        const hasContent = submissionData.content.githubUrl || 
                          submissionData.content.liveUrl || 
                          submissionData.content.code || 
                          submissionData.content.description;
        if (!hasContent) {
          throw new Error('Submission must contain at least one content field');
        }
    }
  }

  async _updateUserPoints(userId, score) {
    // This would integrate with your user points system
    // Implementation depends on your existing points system
    console.log(`Updating points for user ${userId} with score ${score}`);
  }

  async _sendReviewNotification(userId, reviewData) {
    try {
      const statusText = reviewData.status === 'approved' ? 'approved' : 'rejected';
      const title = reviewData.status === 'approved' ? 'Submission Approved!' : 'Submission Reviewed';
      const message = `Your submission has been ${statusText}. ${reviewData.feedback ? `Feedback: ${reviewData.feedback}` : ''}`;
      
      // Create notification in database
      const notification = await Notification.createNotification({
        recipient: userId,
        sender: null, // System notification
        title,
        message,
        type: 'challenge',
        metadata: {
          submissionStatus: reviewData.status,
          score: reviewData.score || 0,
          feedback: reviewData.feedback || '',
          reviewedAt: new Date()
        }
      });
      
      // Get Socket.IO instance and emit real-time notification
      // Note: This assumes Socket.IO is available globally or passed via dependency injection
      try {
        const io = global.io || require('../socket/socketHandler').getIO();
        if (io) {
          const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'fullName username avatar')
            .populate('recipient', 'fullName username avatar');
          
          io.to(`user_${userId}`).emit('new-notification', populatedNotification);
        }
      } catch (socketError) {
        console.log('Socket.IO not available for real-time notification:', socketError.message);
      }
      
      console.log(`Review notification sent to user ${userId}: ${title}`);
    } catch (error) {
      console.error('Error sending review notification:', error);
    }
  }
}

module.exports = new SubmissionService();

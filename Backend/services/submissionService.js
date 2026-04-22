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
        .populate('submissions.reviewedBy', 'fullName username')
        .populate('participants.user', 'fullName username avatar email');
      
      let allSubmissions = [];
      
      weeklyChallenges.forEach(challenge => {
        if (challenge.submissions && challenge.submissions.length > 0) {
          const challengeSubmissions = challenge.submissions.map(submission => {
            const submissionObj = submission.toObject();
            
            // Find the corresponding participant user for this submission
            const participantUser = challenge.participants.find(p => 
              p.user && p.user._id.toString() === submissionObj.user?.toString()
            );
            
            return {
              _id: submissionObj._id,
              userId: participantUser?.user || submissionObj.user, // Use participant user as fallback
              challengeId: challenge._id,
              challengeTitle: challenge.title,
              challengeType: 'weekly',
              challengeCategory: challenge.category,
              challengeDifficulty: challenge.difficulty,
              status: submissionObj.status,
              submittedAt: submissionObj.submittedAt,
              githubUrl: submissionObj.githubUrl,
              liveUrl: submissionObj.liveUrl,
              description: submissionObj.description,
              score: submissionObj.score,
              feedback: submissionObj.reviewComments,
              reviewedBy: submissionObj.reviewedBy,
              reviewedAt: submissionObj.reviewedAt,
              content: submissionObj.content
            };
          });
          
          // Debug: Check if user data is populated
          console.log('Weekly submission user data:', challengeSubmissions[0]?.userId);
          console.log('Weekly submission structure:', JSON.stringify(challengeSubmissions[0], null, 2));
          
          // Filter by status if provided
          const filteredSubmissions = status 
            ? challengeSubmissions.filter(sub => sub.status === status)
            : challengeSubmissions;
          
          // Filter by userId if provided
          const userFilteredSubmissions = userId
            ? filteredSubmissions.filter(sub => sub.userId && sub.userId._id.toString() === userId)
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
      console.log('=== COMPREHENSIVE SUBMISSION REVIEW DEBUGGING ===');
      console.log('1. Method called with:', { 
        submissionId, 
        reviewData: JSON.stringify(reviewData, null, 2), 
        reviewerId 
      });
      console.log('2. Submission ID type:', typeof submissionId);
      console.log('3. Submission ID length:', submissionId?.length);
      console.log('4. ReviewerId type:', typeof reviewerId);
      console.log('5. ReviewerId length:', reviewerId?.length);
      
      // First try to find in main Submission collection
      console.log('6. Searching in main Submission collection...');
      let submission = await this.Submission.findById(submissionId);
      console.log('7. Found in main collection:', !!submission);
      
      // If not found in main collection, try weekly challenge submissions
      if (!submission) {
        console.log('8. Not found in main collection, checking weekly challenges...');
        console.log('9. Query: { "submissions._id": "' + submissionId + '" }');
        
        const weeklyChallenges = await WeeklyChallenge.find({
          'submissions._id': submissionId
        }).populate('submissions.user', 'fullName username avatar email')
          .populate('submissions.reviewedBy', 'fullName username');
        
        console.log('10. Found weekly challenges:', weeklyChallenges.length);
        console.log('11. Weekly challenges details:', weeklyChallenges.map(c => ({
          id: c._id.toString(),
          title: c.title,
          submissionCount: c.submissions?.length || 0,
          hasSubmissions: !!c.submissions,
          submissionsArray: c.submissions ? Array.isArray(c.submissions) : false
        })));
        
        if (weeklyChallenges.length > 0) {
          console.log('12. All submission IDs in weekly challenges:');
          weeklyChallenges.forEach((challenge, index) => {
            if (challenge.submissions && Array.isArray(challenge.submissions)) {
              console.log(`   Challenge ${index + 1} (${challenge.title}):`);
              challenge.submissions.forEach((sub, subIndex) => {
                console.log(`     ${subIndex + 1}. ${sub._id.toString()} (${sub.status || 'no status'})`);
              });
            }
          });
        }
        
        for (const challenge of weeklyChallenges) {
          console.log('13. Checking challenge:', challenge._id.toString(), 'with', challenge.submissions?.length, 'submissions');
          
          // Add null check for submissions array
          if (!challenge.submissions || !Array.isArray(challenge.submissions)) {
            console.log('13a. Challenge has no submissions array or it\'s not an array, skipping...');
            console.log('13b. Type of submissions:', typeof challenge.submissions);
            console.log('13c. Submissions value:', challenge.submissions);
            continue;
          }
          
          const submissionInChallenge = challenge.submissions.find(
            sub => sub._id.toString() === submissionId
          );
          
          console.log('14. Looking for submission ID:', submissionId);
          console.log('15. Found submission in challenge:', !!submissionInChallenge);
          
          if (submissionInChallenge) {
            console.log('16. Found submission in weekly challenge!');
            console.log('17. Submission details:', {
              id: submissionInChallenge._id.toString(),
              status: submissionInChallenge.status,
              score: submissionInChallenge.score,
              user: submissionInChallenge.user?.fullName,
              hasUser: !!submissionInChallenge.user,
              hasReviewedBy: !!submissionInChallenge.reviewedBy
            });
            
            // Update weekly challenge submission
            const submissionIndex = challenge.submissions.findIndex(
              sub => sub._id.toString() === submissionId
            );
            
            console.log('18. Submission index in array:', submissionIndex);
            console.log('19. Total submissions in challenge:', challenge.submissions.length);
            
            if (submissionIndex !== -1) {
              console.log('20. About to update submission at index:', submissionIndex);
              console.log('21. Current submission data:', {
                status: challenge.submissions[submissionIndex].status,
                score: challenge.submissions[submissionIndex].score,
                feedback: challenge.submissions[submissionIndex].reviewComments
              });
              
              // Update the submission in the weekly challenge
              challenge.submissions[submissionIndex] = {
                ...challenge.submissions[submissionIndex],
                status: reviewData.status,
                score: reviewData.score || 0,
                reviewComments: reviewData.feedback,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                rankingCriteria: reviewData.rankingCriteria,
                rank: reviewData.rank
              };
              
              console.log('22. Updated submission data:', {
                status: challenge.submissions[submissionIndex].status,
                score: challenge.submissions[submissionIndex].score,
                feedback: challenge.submissions[submissionIndex].reviewComments,
                rankingCriteria: challenge.submissions[submissionIndex].rankingCriteria,
                rank: challenge.submissions[submissionIndex].rank
              });
              
              console.log('23. About to save weekly challenge...');
              await challenge.save();
              console.log('24. Successfully saved weekly challenge');
              
              // Format the submission to match expected structure
              const updatedSubmission = {
                ...challenge.submissions[submissionIndex].toObject(),
                userId: challenge.submissions[submissionIndex].user,
                reviewedBy: challenge.submissions[submissionIndex].reviewedBy,
                challengeId: challenge._id,
                challengeTitle: challenge.title,
                challengeCategory: challenge.category,
                challengeDifficulty: challenge.difficulty,
                challengeType: 'weekly'
              };
              
              console.log('25. Formatted submission for response:', {
                id: updatedSubmission._id?.toString(),
                status: updatedSubmission.status,
                score: updatedSubmission.score,
                hasUserId: !!updatedSubmission.userId,
                hasChallengeId: !!updatedSubmission.challengeId
              });
              
              // Send notification to user
              console.log('26. About to send notification to user:', updatedSubmission.userId);
              await this._sendReviewNotification(updatedSubmission.userId, reviewData);
              console.log('27. Notification sent successfully');
              
              console.log('=== SUBMISSION REVIEW SUCCESS ===');
              return {
                success: true,
                data: updatedSubmission,
                message: 'Submission reviewed successfully'
              };
            } else {
              console.log('28. ERROR: Submission index not found in array');
            }
          } else {
            console.log('29. Submission not found in this challenge');
          }
        }
        
        console.log('30. Submission not found in any weekly challenge');
      } else {
        console.log('31. Found submission in main collection, proceeding with main collection update');
      }
      
      console.log('32. Final submission check - submission exists:', !!submission);
      console.log('33. Final submission ID:', submission?._id?.toString());
      
      if (!submission) {
        console.log('34. THROWING ERROR: Submission not found anywhere');
        throw new Error('Submission not found');
      }

      // Update main submission collection
      console.log('35. Updating main submission collection...');
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
            lastUpdated: new Date(),
            rankingCriteria: reviewData.rankingCriteria,
            rank: reviewData.rank
          }
        },
        { new: true }
      );
      
      console.log('36. Main submission updated successfully');

      // Update user points if approved
      if (reviewData.status === 'approved') {
        console.log('37. Updating user points...');
        await this._updateUserPoints(submission.userId, reviewData.score || 0);
        console.log('38. User points updated');
      }

      // Send notification to user
      console.log('39. Sending notification to user...');
      await this._sendReviewNotification(submission.userId, reviewData);
      console.log('40. Notification sent');

      const finalSubmission = await this.Submission.findById(submissionId)
        .populate('userId', 'fullName username avatar email')
        .populate('challengeId', 'title category difficulty')
        .populate('reviewedBy', 'fullName username');

      console.log('41. Final submission retrieved:', {
        id: finalSubmission._id?.toString(),
        status: finalSubmission.status,
        score: finalSubmission.score
      });

      console.log('=== SUBMISSION REVIEW SUCCESS (MAIN COLLECTION) ===');
      return {
        success: true,
        data: finalSubmission,
        message: 'Submission reviewed successfully'
      };
    } catch (error) {
      console.error('=== SUBMISSION REVIEW ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== END ERROR DEBUGGING ===');
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

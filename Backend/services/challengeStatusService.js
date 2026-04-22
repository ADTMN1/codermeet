/**
 * Professional Challenge Status Management Service
 * Handles automatic status updates based on dates and business logic
 * Follows enterprise patterns: single responsibility, dependency injection, logging
 */

const WeeklyChallenge = require('../models/weeklyChallenge');
const logger = require('../utils/logger');

class ChallengeStatusService {
  constructor() {
    this.WeeklyChallenge = WeeklyChallenge;
  }

  /**
   * Update challenge status based on current date
   * @param {string} challengeId - Challenge ID
   * @returns {Promise<Object>} Updated challenge
   */
  async updateChallengeStatus(challengeId) {
    try {
      const challenge = await this.WeeklyChallenge.findById(challengeId);
      
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const newStatus = this.calculateStatus(challenge);
      
      if (newStatus !== challenge.status) {
        await this.WeeklyChallenge.updateOne(
          { _id: challengeId },
          { 
            $set: { 
              status: newStatus,
              updatedAt: new Date()
            }
          }
        );

        logger.info(`Challenge status updated: ${challenge.title} from ${challenge.status} to ${newStatus}`);
        
        // Return updated challenge
        const updatedChallenge = await this.WeeklyChallenge.findById(challengeId);
        return {
          success: true,
          data: updatedChallenge,
          previousStatus: challenge.status,
          newStatus: newStatus
        };
      }

      return {
        success: true,
        data: challenge,
        message: 'Status already up to date'
      };
    } catch (error) {
      logger.error(`Error updating challenge status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate the correct status based on dates
   * @param {Object} challenge - Challenge object
   * @returns {string} Correct status
   */
  calculateStatus(challenge) {
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);

    // If challenge was cancelled, keep it cancelled
    if (challenge.status === 'cancelled') {
      return 'cancelled';
    }

    // If end date has passed, challenge is completed
    if (endDate <= now) {
      return 'completed';
    }

    // If start date has passed but end date hasn't, challenge is active
    if (startDate <= now && endDate > now) {
      return 'active';
    }

    // If start date is in future, challenge is upcoming
    if (startDate > now) {
      return 'upcoming';
    }

    // Default to draft if no dates match
    return 'draft';
  }

  /**
   * Update all challenges status (for cron job)
   * @returns {Promise<Object>} Update results
   */
  async updateAllChallengeStatuses() {
    try {
      const challenges = await this.WeeklyChallenge.find({});
      const now = new Date();
      
      let updatedCount = 0;
      const results = [];

      for (const challenge of challenges) {
        const newStatus = this.calculateStatus(challenge);
        
        if (newStatus !== challenge.status) {
          await this.WeeklyChallenge.updateOne(
            { _id: challenge._id },
            { 
              $set: { 
                status: newStatus,
                updatedAt: now
              }
            }
          );

          results.push({
            challengeId: challenge._id,
            title: challenge.title,
            previousStatus: challenge.status,
            newStatus: newStatus
          });

          updatedCount++;
        }
      }

      logger.info(`Updated ${updatedCount} challenge statuses`);

      return {
        success: true,
        totalChallenges: challenges.length,
        updatedCount,
        results
      };
    } catch (error) {
      logger.error(`Error updating all challenge statuses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if challenge is accepting submissions
   * @param {string} challengeId - Challenge ID
   * @returns {Promise<Object>} Submission eligibility
   */
  async checkSubmissionEligibility(challengeId) {
    try {
      const challenge = await this.WeeklyChallenge.findById(challengeId);
      
      if (!challenge) {
        return {
          eligible: false,
          reason: 'Challenge not found'
        };
      }

      const now = new Date();
      const endDate = new Date(challenge.endDate);
      const status = this.calculateStatus(challenge);

      // Check if challenge is in a status that accepts submissions
      const acceptingStatuses = ['active', 'upcoming'];
      const acceptsSubmissions = acceptingStatuses.includes(status);

      // Check if deadline has passed
      const deadlinePassed = endDate <= now;

      if (!acceptsSubmissions) {
        return {
          eligible: false,
          reason: `Challenge status is '${status}' - not accepting submissions`,
          currentStatus: status
        };
      }

      if (deadlinePassed) {
        return {
          eligible: false,
          reason: 'Challenge deadline has passed',
          deadlinePassed: true,
          endDate: endDate
        };
      }

      return {
        eligible: true,
        currentStatus: status,
        timeRemaining: endDate - now
      };
    } catch (error) {
      logger.error(`Error checking submission eligibility: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get challenges with correct status for frontend
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Challenges with updated status
   */
  async getChallengesWithCorrectStatus(filters = {}) {
    try {
      const challenges = await this.WeeklyChallenge.find(filters)
        .populate('createdBy', 'username fullName avatar')
        .populate('participants.user', 'username fullName avatar')
        .populate('submissions.user', 'username fullName avatar');

      // Update status for each challenge before returning
      const challengesWithStatus = challenges.map(challenge => {
        const challengeObj = challenge.toObject();
        challengeObj.calculatedStatus = this.calculateStatus(challenge);
        challengeObj.timeRemaining = this.calculateTimeRemaining(challenge);
        challengeObj.isActive = this.calculateStatus(challenge) === 'active';
        return challengeObj;
      });

      return challengesWithStatus;
    } catch (error) {
      logger.error(`Error getting challenges with correct status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate time remaining in a human-readable format
   * @param {Object} challenge - Challenge object
   * @returns {Object} Time remaining breakdown
   */
  calculateTimeRemaining(challenge) {
    const now = new Date();
    const endDate = new Date(challenge.endDate);
    const timeRemaining = endDate - now;

    if (timeRemaining <= 0) {
      return {
        total: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true
      };
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    return {
      total: timeRemaining,
      days,
      hours,
      minutes,
      seconds,
      expired: false
    };
  }

  /**
   * Start automatic status updates
   * Runs every hour to update expired challenges
   */
  startAutomaticUpdates() {
    const cron = require('node-cron');
    
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      try {
        const result = await this.updateAllChallengeStatuses();
        if (result.updatedCount > 0) {
          logger.info(`🤖 Auto-updated ${result.updatedCount} challenges to correct status`);
        }
      } catch (error) {
        logger.error(`❌ Auto status update failed: ${error.message}`);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    logger.info('🤖 Automatic status updates started (runs every hour)');
    
    // Run once immediately on startup
    this.updateAllChallengeStatuses().catch(error => {
      logger.error(`❌ Initial status update failed: ${error.message}`);
    });
  }
}

module.exports = new ChallengeStatusService();

/**
 * Professional Cron Job Service
 * Handles scheduled tasks for automatic status management
 */

const cron = require('node-cron');
const challengeStatusService = require('./challengeStatusService');
const logger = require('../utils/logger');

class CronJobService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    this.startChallengeStatusUpdates();
    logger.info('Cron jobs started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Update challenge statuses every hour
   */
  startChallengeStatusUpdates() {
    // Run every hour at minute 0
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running automatic challenge status updates...');
        
        const result = await challengeStatusService.updateAllChallengeStatuses();
        
        logger.info(`Challenge status update completed: ${result.updatedCount} challenges updated`);
        
        if (result.results.length > 0) {
          result.results.forEach(update => {
            logger.info(`Challenge "${update.title}" status changed from ${update.previousStatus} to ${update.newStatus}`);
          });
        }
        
      } catch (error) {
        logger.error(`Error in challenge status update cron job: ${error.message}`);
      }
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    this.jobs.set('challengeStatusUpdates', job);
    logger.info('Started challenge status updates cron job (runs every hour)');
  }

  /**
   * Manual trigger for status updates
   */
  async triggerStatusUpdates() {
    try {
      logger.info('Manual trigger: Running challenge status updates...');
      const result = await challengeStatusService.updateAllChallengeStatuses();
      return result;
    } catch (error) {
      logger.error(`Manual status update failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get status of all cron jobs
   */
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        nextDate: job.nextDate()?.toISOString(),
        lastDate: job.lastDate()?.toISOString()
      };
    });
    return status;
  }
}

module.exports = new CronJobService();

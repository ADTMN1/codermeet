/**
 * Notification Cleanup Service
 * 
 * This service runs daily to clean up old read notifications
 * that are older than 4 days.
 */

const Notification = require('../models/notification');
const logger = require('../utils/logger');

class NotificationCleanupService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the cleanup service
   * Runs every 24 hours
   */
  start() {
    if (this.isRunning) {
      logger.info('Notification cleanup service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🧹 Starting notification cleanup service...');

    // Run cleanup immediately on start
    this.cleanupOldNotifications();

    // Schedule cleanup to run every 24 hours (in milliseconds)
    this.intervalId = setInterval(() => {
      this.cleanupOldNotifications();
    }, 24 * 60 * 60 * 1000); // 24 hours

    logger.info('✅ Notification cleanup service started (runs every 24 hours)');
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('🛑 Notification cleanup service stopped');
  }

  /**
   * Clean up old read notifications
   */
  async cleanupOldNotifications() {
    try {
      logger.info('🧹 Cleaning up old read notifications...');
      
      const result = await Notification.cleanupOldReadNotifications();
      
      if (result.deletedCount > 0) {
        logger.info(`✅ Cleaned up ${result.deletedCount} old read notifications`);
      } else {
        logger.info('📭 No old read notifications to clean up');
      }
      
    } catch (error) {
      logger.error('❌ Error cleaning up notifications:', error);
    }
  }

  /**
   * Get cleanup service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCleanup: this.intervalId ? 'in 24 hours' : 'not scheduled'
    };
  }
}

// Create singleton instance
const notificationCleanupService = new NotificationCleanupService();

module.exports = notificationCleanupService;

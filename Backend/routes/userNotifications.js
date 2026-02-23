const express = require('express');
const router = express.Router();
const userNotificationController = require('../controllers/userNotificationController');
const { authenticate } = require('../middlewares/roleBasedAuth');

// Apply authentication to all routes
router.use(authenticate);

/**
 * User Notification Routes
 * Handles notification management for regular users
 */

/**
 * @route   GET /api/user-notifications
 * @desc    Get user notifications with pagination
 * @access  Private
 */
router.get('/', userNotificationController.getUserNotifications);

/**
 * @route   PUT /api/user-notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', userNotificationController.markNotificationAsRead);

/**
 * @route   PUT /api/user-notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', userNotificationController.markAllNotificationsAsRead);

/**
 * @route   DELETE /api/user-notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', userNotificationController.deleteNotification);

module.exports = router;

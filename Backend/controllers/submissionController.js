const submissionService = require('../services/submissionService');
const { authenticate, requireAdmin } = require('../middlewares/roleBasedAuth');


class SubmissionController {
  /**
   * Create a new submission
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createSubmission(req, res) {
    try {
      const userId = req.user.id;
      const submissionData = req.body;
      
      const result = await submissionService.createSubmission(submissionData, userId);
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating submission:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create submission'
      });
    }
  }

  /**
   * Get all submissions with filtering and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllSubmissions(req, res) {
    try {
      const filters = {
        ...req.query,
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        sortBy: req.query.sortBy || 'submittedAt',
        sortOrder: req.query.sortOrder || 'desc'
      };
      
      const result = await submissionService.getAllSubmissions(filters);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch submissions'
      });
    }
  }

  /**
   * Get submission statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSubmissionStats(req, res) {
    try {
      const filters = {
        challengeType: req.query.challengeType,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      
      const stats = await submissionService.getSubmissionStats(filters);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch submission stats'
      });
    }
  }

  /**
   * Get submission by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSubmissionById(req, res) {
    try {
      const { submissionId } = req.params;
      
      const result = await submissionService.getSubmissionById(submissionId);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Submission not found'
      });
    }
  }

  /**
   * Review a submission
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async reviewSubmission(req, res) {
    try {
      const { submissionId } = req.params;
      const reviewData = req.body;
      const reviewerId = req.user.id;
      
      // Validate review data
      if (!reviewData.status || !['approved', 'accepted', 'rejected', 'reviewed'].includes(reviewData.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid review status'
        });
      }
      
      // Normalize status to backend format
      if (reviewData.status === 'accepted') {
        reviewData.status = 'approved';
      }
      
      const result = await submissionService.reviewSubmission(submissionId, reviewData, reviewerId);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error reviewing submission:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to review submission'
      });
    }
  }

  /**
   * Get submissions for a specific challenge
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getChallengeSubmissions(req, res) {
    try {
      const { challengeId } = req.params;
      const options = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
      };
      
      const result = await submissionService.getChallengeSubmissions(challengeId, options);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching challenge submissions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch challenge submissions'
      });
    }
  }

  /**
   * Get submissions by user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserSubmissions(req, res) {
    try {
      const { userId } = req.params;
      const options = {
        challengeType: req.query.challengeType,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
      };
      
      const result = await submissionService.getUserSubmissions(userId, options);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user submissions'
      });
    }
  }

  /**
   * Archive a submission
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async archiveSubmission(req, res) {
    try {
      const { submissionId } = req.params;
      const archivedBy = req.user.id;
      
      const result = await submissionService.archiveSubmission(submissionId, archivedBy);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error archiving submission:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to archive submission'
      });
    }
  }

  /**
   * Bulk review submissions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async bulkReviewSubmissions(req, res) {
    try {
      const { submissions } = req.body; // Array of { submissionId, status, score, feedback }
      const reviewerId = req.user.id;
      
      if (!Array.isArray(submissions) || submissions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid submissions array'
        });
      }
      
      const results = [];
      const errors = [];
      
      for (const submission of submissions) {
        try {
          const result = await submissionService.reviewSubmission(
            submission.submissionId, 
            {
              status: submission.status,
              score: submission.score,
              feedback: submission.feedback
            }, 
            reviewerId
          );
          results.push(result);
        } catch (error) {
          errors.push({
            submissionId: submission.submissionId,
            error: error.message
          });
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          processed: results.length,
          errors: errors.length,
          results,
          errors
        }
      });
    } catch (error) {
      console.error('Error bulk reviewing submissions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk review submissions'
      });
    }
  }

  /**
   * Export submissions data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async exportSubmissions(req, res) {
    try {
      const filters = {
        ...req.query,
        page: 1,
        limit: 10000, // Large limit for export
        sortBy: 'submittedAt',
        sortOrder: 'desc'
      };
      
      const result = await submissionService.getAllSubmissions(filters);
      
      // Convert to CSV format
      const csv = this._convertToCSV(result.data);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=submissions.csv');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting submissions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export submissions'
      });
    }
  }

  /**
   * Get submission analytics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSubmissionAnalytics(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
      
      const filters = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
      
      const stats = await submissionService.getSubmissionStats(filters);
      
      // Get daily submission trends
      const dailyTrends = await submissionService.Submission.aggregate([
        {
          $match: {
            submittedAt: { $gte: startDate, $lte: endDate },
            isArchived: { $ne: true }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
            count: { $sum: 1 },
            avgScore: { $avg: '$score' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      res.status(200).json({
        success: true,
        data: {
          stats,
          trends: dailyTrends,
          period
        }
      });
    } catch (error) {
      console.error('Error fetching submission analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch submission analytics'
      });
    }
  }

  // Private helper methods

  static _convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = [
      'Submission ID',
      'User Name',
      'Challenge Title',
      'Challenge Type',
      'Status',
      'Score',
      'Submitted At',
      'Reviewed At',
      'Feedback'
    ];
    
    const csvRows = [headers.join(',')];
    
    data.forEach(submission => {
      const row = [
        submission._id,
        `"${submission.userId?.fullName || 'N/A'}"`,
        `"${submission.challengeId?.title || 'N/A'}"`,
        submission.challengeType,
        submission.status,
        submission.score,
        submission.submittedAt,
        submission.reviewedAt || '',
        `"${(submission.feedback || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}

module.exports = SubmissionController;

/**
 * Challenge Date Validation Middleware
 * Ensures proper timezone handling and deadline setting
 */

const validateChallengeDates = (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    
    // If endDate is provided, validate it
    if (endDate) {
      const end = new Date(endDate);
      
      // Set end time to 23:59:59 UTC if not already set
      if (end.getHours() !== 23 || end.getMinutes() !== 59 || end.getSeconds() !== 59) {
        // Keep the same date but set time to end of day UTC
        end.setUTCHours(23, 59, 59, 999);
        req.body.endDate = end.toISOString();
      }
    }
    
    // If startDate is provided, validate it
    if (startDate) {
      const start = new Date(startDate);
      
      // Set start time to 00:00:00 UTC if not already set
      if (start.getHours() !== 0 || start.getMinutes() !== 0 || start.getSeconds() !== 0) {
        // Keep the same date but set time to start of day UTC
        start.setUTCHours(0, 0, 0, 0);
        req.body.startDate = start.toISOString();
      }
    }
    
    // Validate date logic
    if (startDate && endDate) {
      const start = new Date(req.body.startDate);
      const end = new Date(req.body.endDate);
      
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date',
          error: 'INVALID_DATE_RANGE'
        });
      }
      
      // Ensure minimum challenge duration (1 day)
      const minDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      if (end - start < minDuration) {
        return res.status(400).json({
          success: false,
          message: 'Challenge must run for at least 1 day',
          error: 'INSUFFICIENT_DURATION'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Date validation error:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid date format',
      error: 'INVALID_DATE_FORMAT'
    });
  }
};

module.exports = { validateChallengeDates };

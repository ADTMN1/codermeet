// Data validation utilities for ranking system

// Validate user data for leaderboard
function validateLeaderboardUser(user) {
  const errors = [];
  
  if (!user._id) {
    errors.push('User ID is required');
  }
  
  if (!user.name && !user.username) {
    errors.push('User name or username is required');
  }
  
  if (typeof user.points !== 'number' || user.points < 0) {
    errors.push('Points must be a non-negative number');
  }
  
  if (typeof user.rank !== 'number' || user.rank < 1) {
    errors.push('Rank must be a positive number');
  }
  
  if (user.previousRank && (typeof user.previousRank !== 'number' || user.previousRank < 1)) {
    errors.push('Previous rank must be a positive number');
  }
  
  if (user.challengesCompleted && (typeof user.challengesCompleted !== 'number' || user.challengesCompleted < 0)) {
    errors.push('Challenges completed must be a non-negative number');
  }
  
  if (user.projectsSubmitted && (typeof user.projectsSubmitted !== 'number' || user.projectsSubmitted < 0)) {
    errors.push('Projects submitted must be a non-negative number');
  }
  
  if (user.streak && (typeof user.streak !== 'number' || user.streak < 0)) {
    errors.push('Streak must be a non-negative number');
  }
  
  if (user.communityScore) {
    const score = parseFloat(user.communityScore);
    if (isNaN(score) || score < 0 || score > 10) {
      errors.push('Community score must be a number between 0 and 10');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate leaderboard stats
function validateLeaderboardStats(stats) {
  const errors = [];
  
  if (typeof stats.totalUsers !== 'number' || stats.totalUsers < 0) {
    errors.push('Total users must be a non-negative number');
  }
  
  if (typeof stats.activeUsers !== 'number' || stats.activeUsers < 0) {
    errors.push('Active users must be a non-negative number');
  }
  
  if (typeof stats.totalPoints !== 'number' || stats.totalPoints < 0) {
    errors.push('Total points must be a non-negative number');
  }
  
  if (typeof stats.averagePoints !== 'number' || stats.averagePoints < 0) {
    errors.push('Average points must be a non-negative number');
  }
  
  if (typeof stats.topScore !== 'number' || stats.topScore < 0) {
    errors.push('Top score must be a non-negative number');
  }
  
  if (stats.activeUsers > stats.totalUsers) {
    errors.push('Active users cannot exceed total users');
  }
  
  if (stats.topScore > stats.totalPoints && stats.totalPoints > 0) {
    errors.push('Top score cannot exceed total points');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate ranking consistency
function validateRankingConsistency(users) {
  const errors = [];
  const ranks = new Set();
  
  for (const user of users) {
    if (!user.rank) {
      errors.push(`User ${user._id || 'unknown'} is missing rank`);
      continue;
    }
    
    if (ranks.has(user.rank)) {
      errors.push(`Duplicate rank ${user.rank} found`);
    }
    ranks.add(user.rank);
    
    // Check if points are sorted correctly according to rank
    const userIndex = users.indexOf(user);
    if (userIndex > 0) {
      const prevUser = users[userIndex - 1];
      if (prevUser.points < user.points) {
        errors.push(`Ranking inconsistency: User ${prevUser.name} (rank ${prevUser.rank}) has fewer points than ${user.name} (rank ${user.rank})`);
      }
    }
  }
  
  // Check for consecutive ranks starting from 1
  const sortedRanks = Array.from(ranks).sort((a, b) => a - b);
  for (let i = 0; i < sortedRanks.length; i++) {
    if (sortedRanks[i] !== i + 1) {
      errors.push(`Missing rank ${i + 1} in ranking sequence`);
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize and validate input parameters
function sanitizeLeaderboardParams(params) {
  const sanitized = {};
  const errors = [];
  
  if (params.limit) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.push('Limit must be a number between 1 and 1000');
    } else {
      sanitized.limit = limit;
    }
  }
  
  if (params.page) {
    const page = parseInt(params.page);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive number');
    } else {
      sanitized.page = page;
    }
  }
  
  if (params.category) {
    const validCategories = ['overall', 'challenges', 'community', 'projects'];
    if (!validCategories.includes(params.category)) {
      errors.push('Invalid category. Must be one of: ' + validCategories.join(', '));
    } else {
      sanitized.category = params.category;
    }
  }
  
  if (params.timeFilter) {
    const validFilters = ['all-time', 'monthly', 'weekly'];
    if (!validFilters.includes(params.timeFilter)) {
      errors.push('Invalid time filter. Must be one of: ' + validFilters.join(', '));
    } else {
      sanitized.timeFilter = params.timeFilter;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

// Validate badge data
function validateBadge(badge) {
  const errors = [];
  
  if (!badge.id) {
    errors.push('Badge ID is required');
  }
  
  if (!badge.name) {
    errors.push('Badge name is required');
  }
  
  if (!badge.description) {
    errors.push('Badge description is required');
  }
  
  if (!badge.icon) {
    errors.push('Badge icon is required');
  }
  
  const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  if (!badge.rarity || !validRarities.includes(badge.rarity)) {
    errors.push('Badge rarity must be one of: ' + validRarities.join(', '));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Main validation function for leaderboard data
function validateLeaderboardData(data) {
  const allErrors = [];
  
  // Validate main structure
  if (!data.users || !Array.isArray(data.users)) {
    allErrors.push('Leaderboard must have a users array');
    return {
      isValid: false,
      errors: allErrors
    };
  }
  
  // Validate each user
  data.users.forEach((user, index) => {
    const userValidation = validateLeaderboardUser(user);
    if (!userValidation.isValid) {
      allErrors.push(...userValidation.errors.map(err => `User ${index + 1}: ${err}`));
    }
  });
  
  // Validate ranking consistency
  const rankingValidation = validateRankingConsistency(data.users);
  if (!rankingValidation.isValid) {
    allErrors.push(...rankingValidation.errors);
  }
  
  // Validate stats if present
  if (data.stats) {
    const statsValidation = validateLeaderboardStats(data.stats);
    if (!statsValidation.isValid) {
      allErrors.push(...statsValidation.errors.map(err => `Stats: ${err}`));
    }
  }
  
  // Validate badges if present
  data.users.forEach((user, userIndex) => {
    if (user.badges && Array.isArray(user.badges)) {
      user.badges.forEach((badge, badgeIndex) => {
        const badgeValidation = validateBadge(badge);
        if (!badgeValidation.isValid) {
          allErrors.push(...badgeValidation.errors.map(err => `User ${userIndex + 1}, Badge ${badgeIndex + 1}: ${err}`));
        }
      });
    }
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

// Validate payment verification data
function validatePaymentVerification(data) {
  const errors = [];
  
  // Validate required fields
  if (!data.transactionId || typeof data.transactionId !== 'string') {
    errors.push('Transaction ID is required and must be a string');
  } else if (data.transactionId.length < 3 || data.transactionId.length > 50) {
    errors.push('Transaction ID must be between 3 and 50 characters');
  } else if (!/^[A-Za-z0-9]+$/.test(data.transactionId)) {
    errors.push('Transaction ID can only contain letters and numbers');
  }
  
  if (!data.amount || typeof data.amount !== 'number') {
    errors.push('Amount is required and must be a number');
  } else if (data.amount < 0 || data.amount > 999999) {
    errors.push('Amount must be between 0 and 999,999');
  }
  
  if (!data.plan || typeof data.plan !== 'string') {
    errors.push('Plan is required and must be a string');
  } else {
    const validPlans = ['trial', 'basic', 'premium'];
    if (!validPlans.includes(data.plan.toLowerCase())) {
      errors.push('Plan must be one of: ' + validPlans.join(', '));
    }
  }
  
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }
  
  if (!data.fullName || typeof data.fullName !== 'string') {
    errors.push('Full name is required and must be a string');
  } else if (data.fullName.length < 2 || data.fullName.length > 100) {
    errors.push('Full name must be between 2 and 100 characters');
  }
  
  // Validate optional fields
  if (data.payerName && typeof data.payerName !== 'string') {
    errors.push('Payer name must be a string');
  } else if (data.payerName && (data.payerName.length < 2 || data.payerName.length > 100)) {
    errors.push('Payer name must be between 2 and 100 characters');
  }
  
  if (data.payeeName && typeof data.payeeName !== 'string') {
    errors.push('Payee name must be a string');
  } else if (data.payeeName && (data.payeeName.length < 2 || data.payeeName.length > 100)) {
    errors.push('Payee name must be between 2 and 100 characters');
  }
  
  if (data.transactionDate && !(data.transactionDate instanceof Date) && !isValidDateString(data.transactionDate)) {
    errors.push('Transaction date must be a valid date');
  }
  
  if (data.currency && typeof data.currency !== 'string') {
    errors.push('Currency must be a string');
  } else if (data.currency) {
    const validCurrencies = ['ETB', 'USD', 'EUR'];
    if (!validCurrencies.includes(data.currency.toUpperCase())) {
      errors.push('Currency must be one of: ' + validCurrencies.join(', '));
    }
  }
  
  // Validate file information
  if (data.originalFileName && typeof data.originalFileName !== 'string') {
    errors.push('Original filename must be a string');
  } else if (data.originalFileName && data.originalFileName.length > 255) {
    errors.push('Original filename cannot exceed 255 characters');
  }
  
  if (data.fileSize && (typeof data.fileSize !== 'number' || data.fileSize < 0 || data.fileSize > 10 * 1024 * 1024)) {
    errors.push('File size must be a number between 0 and 10MB');
  }
  
  if (data.fileHash && typeof data.fileHash !== 'string') {
    errors.push('File hash must be a string');
  } else if (data.fileHash && data.fileHash.length !== 64) {
    errors.push('File hash must be 64 characters (SHA-256)');
  }
  
  // Validate status
  if (data.status && typeof data.status !== 'string') {
    errors.push('Status must be a string');
  } else if (data.status) {
    const validStatuses = ['processing', 'verified', 'rejected', 'manual_review'];
    if (!validStatuses.includes(data.status)) {
      errors.push('Status must be one of: ' + validStatuses.join(', '));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize and validate payment verification request parameters
function sanitizePaymentVerificationRequest(req) {
  const sanitized = {};
  const errors = [];
  
  // Sanitize transaction ID
  if (req.body.transactionId) {
    const transactionId = req.body.transactionId.toString().trim().replace(/[^\w]/g, '');
    if (transactionId.length < 3) {
      errors.push('Transaction ID is too short');
    } else {
      sanitized.transactionId = transactionId;
    }
  }
  
  // Sanitize amount
  if (req.body.amount) {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount < 0 || amount > 999999) {
      errors.push('Invalid amount');
    } else {
      sanitized.amount = amount;
    }
  }
  
  // Sanitize plan
  if (req.body.plan) {
    const plan = req.body.plan.toString().toLowerCase().trim();
    const validPlans = ['trial', 'basic', 'premium'];
    if (!validPlans.includes(plan)) {
      errors.push('Invalid plan');
    } else {
      sanitized.plan = plan;
    }
  }
  
  // Sanitize email
  if (req.body.email) {
    const email = req.body.email.toString().toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    } else {
      sanitized.email = email;
    }
  }
  
  // Sanitize full name
  if (req.body.fullName) {
    const fullName = req.body.fullName.toString().trim();
    if (fullName.length < 2 || fullName.length > 100) {
      errors.push('Full name must be between 2 and 100 characters');
    } else {
      sanitized.fullName = fullName;
    }
  }
  
  // Sanitize boolean fields
  if (req.body.pendingRegistration !== undefined) {
    sanitized.pendingRegistration = req.body.pendingRegistration === 'true' || req.body.pendingRegistration === true;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

// Helper function to validate date strings
function isValidDateString(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Validate file upload
function validateFileUpload(file) {
  const errors = [];
  
  if (!file) {
    errors.push('No file uploaded');
    return { isValid: false, errors };
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('File size cannot exceed 5MB');
  }
  
  // Check file type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    errors.push('Only JPEG, PNG, and WebP images are allowed');
  }
  
  // Check filename
  if (!file.originalname || file.originalname.length > 255) {
    errors.push('Invalid filename');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateLeaderboardUser,
  validateLeaderboardStats,
  validateRankingConsistency,
  sanitizeLeaderboardParams,
  validateBadge,
  validateLeaderboardData,
  validatePaymentVerification,
  sanitizePaymentVerificationRequest,
  validateFileUpload
};

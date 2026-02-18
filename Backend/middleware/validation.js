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
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be a number between 1 and 100');
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

module.exports = {
  validateLeaderboardUser,
  validateLeaderboardStats,
  validateRankingConsistency,
  sanitizeLeaderboardParams,
  validateBadge,
  validateLeaderboardData
};

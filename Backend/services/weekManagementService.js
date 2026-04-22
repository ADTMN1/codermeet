/**
 * Professional Week Management Service
 * Handles week calculation, validation, and assignment for weekly challenges
 */

class WeekManagementService {
  /**
   * Calculate ISO week number from a date
   * @param {Date} date - The date to calculate week for
   * @returns {number} ISO week number (1-53)
   */
  static getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Get week range for a given ISO week
   * @param {number} weekNumber - ISO week number (1-53)
   * @param {number} year - Year
   * @returns {object} { startDate, endDate } ISO dates
   */
  static getWeekRange(weekNumber, year) {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7 - firstDayOfYear.getDay();
    
    const startDate = new Date(year, 0, 1 + daysOffset);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    };
  }

  /**
   * Format date as YYYY-MM-DD
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get current week info
   * @returns {object} Current week information
   */
  static getCurrentWeekInfo() {
    const now = new Date();
    const weekNumber = this.getISOWeekNumber(now);
    const year = now.getFullYear();
    const weekRange = this.getWeekRange(weekNumber, year);
    
    return {
      weekNumber,
      year,
      ...weekRange,
      isCurrentWeek: true
    };
  }

  /**
   * Get next available week with professional validation
   * @param {Array} existingChallenges - Existing challenges array
   * @param {number} targetYear - Target year
   * @param {object} options - Configuration options
   * @returns {object} Next available week info
   */
  static getNextAvailableWeek(existingChallenges, targetYear, options = {}) {
    const {
      allowGaps = true,           // Allow gaps in week sequence
      maxWeeksPerYear = 52,       // Maximum weeks per year
      startFromCurrent = true      // Start from current week
    } = options;

    const existingWeeks = existingChallenges
      .filter(ch => ch.year === targetYear)
      .map(ch => ch.weekNumber)
      .sort((a, b) => a - b);

    const currentWeek = this.getCurrentWeekInfo();
    let startWeek = startFromCurrent ? currentWeek.weekNumber : 1;

    if (!allowGaps) {
      // Find first gap in sequence
      for (let i = startWeek; i <= maxWeeksPerYear; i++) {
        if (!existingWeeks.includes(i)) {
          return {
            weekNumber: i,
            year: targetYear,
            isAvailable: true,
            isGap: existingWeeks.length > 0 && i > Math.max(...existingWeeks),
            weekRange: this.getWeekRange(i, targetYear),
            status: 'available'
          };
        }
      }
    } else {
      // Allow gaps - find next available after highest existing
      const highestExisting = existingWeeks.length > 0 ? Math.max(...existingWeeks) : 0;
      let nextWeek = Math.max(startWeek, highestExisting + 1);
      
      if (nextWeek <= maxWeeksPerYear) {
        return {
          weekNumber: nextWeek,
          year: targetYear,
          isAvailable: true,
          isGap: false,
          weekRange: this.getWeekRange(nextWeek, targetYear),
          status: 'available'
        };
      }
    }

    // All weeks taken
    return {
      weekNumber: null,
      year: targetYear,
      isAvailable: false,
      suggestion: `All weeks for ${targetYear} are taken. Try year ${targetYear + 1}`,
      nextYear: targetYear + 1,
      status: 'year_full'
    };
  }

  /**
   * Validate week number and year
   * @param {number} weekNumber - Week number to validate
   * @param {number} year - Year to validate
   * @returns {object} Validation result
   */
  static validateWeek(weekNumber, year) {
    const errors = [];
    
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) {
      errors.push('Week number must be between 1 and 53');
    }
    
    if (!Number.isInteger(year) || year < 2020 || year > 2030) {
      errors.push('Year must be between 2020 and 2030');
    }
    
    const currentYear = new Date().getFullYear();
    if (year < currentYear - 1) {
      errors.push('Cannot create challenges for past years');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      weekNumber,
      year
    };
  }

  /**
   * Generate week display name
   * @param {number} weekNumber - Week number
   * @param {number} year - Year
   * @param {string} format - Display format ('short', 'long', 'formal')
   * @returns {string} Formatted week name
   */
  static getWeekDisplayName(weekNumber, year, format = 'short') {
    const weekRange = this.getWeekRange(weekNumber, year);
    
    switch (format) {
      case 'short':
        return `Week ${weekNumber}`;
      case 'long':
        return `Week ${weekNumber} (${year})`;
      case 'formal':
        return `Week ${weekNumber} of ${year}`;
      case 'withDates':
        return `Week ${weekNumber} (${weekRange.startDate} - ${weekRange.endDate})`;
      default:
        return `Week ${weekNumber}`;
    }
  }

  /**
   * Get week status based on current date
   * @param {number} weekNumber - Week number
   * @param {number} year - Year
   * @returns {string} Week status ('past', 'current', 'upcoming')
   */
  static getWeekStatus(weekNumber, year) {
    const currentWeek = this.getCurrentWeekInfo();
    
    if (year < currentWeek.year || (year === currentWeek.year && weekNumber < currentWeek.weekNumber)) {
      return 'past';
    } else if (year === currentWeek.year && weekNumber === currentWeek.weekNumber) {
      return 'current';
    } else {
      return 'upcoming';
    }
  }
}

module.exports = WeekManagementService;

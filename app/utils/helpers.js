/**
 * Helpers Utility
 * 
 * Common utility functions used throughout the Calctra platform
 */

const crypto = require('crypto');

/**
 * Generate a unique ID
 * @param {number} length - Length of the ID (default: 16)
 * @returns {string} Unique ID
 */
function generateId(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Format timestamp to human-readable date
 * @param {string} timestamp - ISO timestamp
 * @param {Object} options - Date formatting options
 * @returns {string} Formatted date string
 */
function formatDate(timestamp, options = {}) {
  const date = new Date(timestamp);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format CAL token amount with proper decimal places
 * @param {number} amount - Token amount
 * @param {number} decimals - Decimal places to display (default: 2)
 * @returns {string} Formatted token amount
 */
function formatTokenAmount(amount, decimals = 2) {
  return amount.toFixed(decimals);
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted percentage
 */
function calculatePercentage(value, total, decimals = 2) {
  if (total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} Is valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Solana wallet address format
 * @param {string} address - Wallet address to validate
 * @returns {boolean} Is valid address
 */
function isValidSolanaAddress(address) {
  // Simple format check (more comprehensive validation would require web3 libraries)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Safely parse JSON string
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
function safeJsonParse(jsonString, defaultValue = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Throttle a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  
  return function(...args) {
    const context = this;
    
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Convert bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Human-readable size
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Convert seconds to human-readable time
 * @param {number} seconds - Time in seconds
 * @returns {string} Human-readable time
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/**
 * Get resource utilization level classification
 * @param {number} percentage - Utilization percentage
 * @returns {string} Utilization level (low, medium, high, critical)
 */
function getUtilizationLevel(percentage) {
  if (percentage < 30) return 'low';
  if (percentage < 70) return 'medium';
  if (percentage < 90) return 'high';
  return 'critical';
}

/**
 * Hash sensitive data
 * @param {string} data - Data to hash
 * @returns {string} Hashed data
 */
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  generateId,
  formatDate,
  formatTokenAmount,
  calculatePercentage,
  isValidEmail,
  isValidSolanaAddress,
  deepClone,
  safeJsonParse,
  throttle,
  debounce,
  formatBytes,
  formatDuration,
  getUtilizationLevel,
  hashData
}; 
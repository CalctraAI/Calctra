const logger = require('./logger');
const { getComputationRequests, getAvailableResources, submitMatch } = require('./solanaHelpers');

/**
 * Matching engine for pairing computation requests with available resources
 */
class MatchingEngine {
  constructor() {
    this.isRunning = false;
    this.matchingInterval = null;
    this.scoreThreshold = 0.7; // Minimum score to consider a match valid
  }

  /**
   * Start the matching process
   * @param {number} intervalMs - Interval in milliseconds for matching cycles
   */
  start(intervalMs = 60000) {
    if (this.isRunning) {
      logger.warn('Matching engine is already running');
      return;
    }
    
    logger.info('Starting matching engine');
    this.isRunning = true;
    
    // Run initial matching cycle
    this.runMatchingCycle();
    
    // Set up regular interval for matching
    this.matchingInterval = setInterval(() => {
      this.runMatchingCycle();
    }, intervalMs);
  }

  /**
   * Stop the matching process
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Matching engine is not running');
      return;
    }
    
    logger.info('Stopping matching engine');
    clearInterval(this.matchingInterval);
    this.isRunning = false;
  }

  /**
   * Run a single matching cycle
   */
  async runMatchingCycle() {
    try {
      logger.info('Running matching cycle');
      
      // Get pending computation requests
      const requests = await getComputationRequests('pending');
      if (requests.length === 0) {
        logger.info('No pending computation requests found');
        return;
      }
      
      // Get available resources
      const resources = await getAvailableResources();
      if (resources.length === 0) {
        logger.info('No available resources found');
        return;
      }
      
      logger.info(`Found ${requests.length} requests and ${resources.length} resources`);
      
      // Match requests with resources
      const matches = this.findOptimalMatches(requests, resources);
      
      // Submit matches to blockchain
      for (const match of matches) {
        try {
          const txSignature = await submitMatch(match.request.id, match.resource.id);
          logger.info(`Match submitted successfully: ${txSignature}`);
          logger.metric('matches_submitted', 1);
        } catch (error) {
          logger.error(`Failed to submit match: ${error.message}`);
        }
      }
      
      logger.info(`Matching cycle completed: ${matches.length} matches found`);
      logger.metric('matching_cycle_completed', 1);
      
    } catch (error) {
      logger.error(`Error in matching cycle: ${error.message}`);
      logger.metric('matching_cycle_error', 1);
    }
  }

  /**
   * Find optimal matches between requests and resources
   * @param {Array} requests - Computation requests
   * @param {Array} resources - Available resources
   * @return {Array} Optimal matches
   */
  findOptimalMatches(requests, resources) {
    const matches = [];
    const assignedResources = new Set();
    
    // Sort requests by priority (higher priority first)
    const sortedRequests = [...requests].sort((a, b) => b.priority - a.priority);
    
    for (const request of sortedRequests) {
      let bestMatch = null;
      let bestScore = this.scoreThreshold;
      
      // Find best resource for this request
      for (const resource of resources) {
        // Skip already assigned resources
        if (assignedResources.has(resource.id)) continue;
        
        const score = this.calculateMatchScore(request, resource);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = resource;
        }
      }
      
      // If a good match was found, record it
      if (bestMatch) {
        matches.push({
          request,
          resource: bestMatch,
          score: bestScore
        });
        assignedResources.add(bestMatch.id);
        logger.info(`Matched request ${request.id} with resource ${bestMatch.id}, score: ${bestScore.toFixed(2)}`);
      } else {
        logger.info(`No suitable resource found for request ${request.id}`);
      }
    }
    
    return matches;
  }

  /**
   * Calculate a match score between a request and a resource
   * @param {Object} request - Computation request
   * @param {Object} resource - Available resource
   * @return {number} Score between 0 and 1
   */
  calculateMatchScore(request, resource) {
    // Check if resource meets minimum requirements
    if (resource.cpuCores < request.minCpuCores ||
        resource.memoryGB < request.minMemoryGB ||
        resource.storageGB < request.minStorageGB) {
      return 0;
    }
    
    // Calculate individual component scores
    const cpuScore = Math.min(resource.cpuCores / request.optimalCpuCores, 1.5);
    const memoryScore = Math.min(resource.memoryGB / request.optimalMemoryGB, 1.5);
    const storageScore = Math.min(resource.storageGB / request.optimalStorageGB, 1.5);
    
    // Calculate overall score with weighted components
    const weights = { cpu: 0.4, memory: 0.4, storage: 0.2 };
    const weightedScore = 
      weights.cpu * cpuScore + 
      weights.memory * memoryScore + 
      weights.storage * storageScore;
    
    // Normalize to 0-1 range
    const normalizedScore = Math.min(weightedScore, 1);
    
    return normalizedScore;
  }
}

module.exports = new MatchingEngine(); 
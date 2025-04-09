const { Connection, PublicKey } = require('@solana/web3.js');
const { getComputationRequests, getAvailableResources } = require('../utils/solanaHelpers');
const logger = require('../utils/logger');

/**
 * Resource Matching Service
 * 
 * This service is responsible for matching computation requests with available resources.
 * It implements an AI-driven algorithm that considers various factors like hardware specifications,
 * price, location, reputation, etc. to find the optimal match.
 */
class MatchingService {
  constructor(config) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.programId = new PublicKey(config.matchingProgramId);
    this.maxBatchSize = config.maxBatchSize || 50;
    this.matchingInterval = config.matchingInterval || 60000; // 1 minute
    this.isRunning = false;
    this.metrics = {
      totalMatched: 0,
      totalFailed: 0,
      avgMatchTime: 0,
      lastRunTimestamp: null,
    };
  }

  /**
   * Start the matching service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Matching service is already running');
      return;
    }

    logger.info('Starting resource matching service');
    this.isRunning = true;
    this.runMatchingCycle();
  }

  /**
   * Stop the matching service
   */
  stop() {
    logger.info('Stopping resource matching service');
    this.isRunning = false;
  }

  /**
   * Run a single matching cycle
   */
  async runMatchingCycle() {
    if (!this.isRunning) return;

    try {
      logger.info('Starting matching cycle');
      const startTime = Date.now();

      // Get pending computation requests
      const pendingRequests = await getComputationRequests(this.connection, this.programId, 'pending');
      logger.info(`Found ${pendingRequests.length} pending requests`);

      if (pendingRequests.length === 0) {
        logger.info('No pending requests to process');
        this.scheduleNextCycle();
        return;
      }

      // Get available resources
      const availableResources = await getAvailableResources(this.connection, this.programId);
      logger.info(`Found ${availableResources.length} available resources`);

      if (availableResources.length === 0) {
        logger.info('No available resources');
        this.scheduleNextCycle();
        return;
      }

      // Process requests in batches
      const batchesToProcess = Math.ceil(pendingRequests.length / this.maxBatchSize);
      let totalMatched = 0;

      for (let i = 0; i < batchesToProcess; i++) {
        const batchStart = i * this.maxBatchSize;
        const batchEnd = Math.min((i + 1) * this.maxBatchSize, pendingRequests.length);
        const batch = pendingRequests.slice(batchStart, batchEnd);

        logger.info(`Processing batch ${i + 1}/${batchesToProcess} with ${batch.length} requests`);
        const matchedCount = await this.processBatch(batch, availableResources);
        totalMatched += matchedCount;
      }

      // Update metrics
      const endTime = Date.now();
      const cycleTime = endTime - startTime;
      this.metrics.totalMatched += totalMatched;
      this.metrics.lastRunTimestamp = endTime;
      this.metrics.avgMatchTime = (this.metrics.avgMatchTime + cycleTime) / 2;

      logger.info(`Matching cycle completed. Matched ${totalMatched} requests in ${cycleTime}ms`);
    } catch (error) {
      logger.error('Error in matching cycle:', error);
      this.metrics.totalFailed++;
    } finally {
      this.scheduleNextCycle();
    }
  }

  /**
   * Process a batch of requests
   * @param {Array} batch - Array of computation requests
   * @param {Array} resources - Array of available resources
   * @returns {Number} - Number of successfully matched requests
   */
  async processBatch(batch, resources) {
    let matchedCount = 0;

    for (const request of batch) {
      try {
        const matchedResource = this.findOptimalMatch(request, resources);
        
        if (matchedResource) {
          const success = await this.executeMatch(request, matchedResource);
          if (success) {
            matchedCount++;
            // Remove the matched resource from available resources
            resources = resources.filter(r => r.id !== matchedResource.id);
          }
        } else {
          logger.info(`No suitable resource found for request ${request.id}`);
        }
      } catch (error) {
        logger.error(`Error processing request ${request.id}:`, error);
      }
    }

    return matchedCount;
  }

  /**
   * Find the optimal match for a request
   * @param {Object} request - Computation request
   * @param {Array} resources - Available resources
   * @returns {Object|null} - The best matching resource or null if no match found
   */
  findOptimalMatch(request, resources) {
    // Filter resources that meet basic requirements
    let candidates = resources.filter(resource => {
      return (
        resource.cpuCores >= request.minCpuCores &&
        resource.memoryGB >= request.minMemoryGB &&
        resource.storageGB >= request.minStorageGB &&
        (!request.needsGpu || (resource.gpuType && resource.gpuMemoryGB >= request.minGpuMemoryGB)) &&
        resource.pricePerHour <= request.maxPricePerHour &&
        resource.reputationScore >= request.minReputation &&
        resource.available === true
      );
    });

    if (candidates.length === 0) {
      return null;
    }

    // Calculate score for each candidate
    candidates = candidates.map(resource => {
      // Base score starts at 100
      let score = 100;

      // Price factor: lower price = higher score
      const priceFactor = 1 - (resource.pricePerHour / request.maxPricePerHour);
      score += priceFactor * 30; // Price has high weight (30%)

      // Resource factor: more resources = higher score, but avoid excessive over-provisioning
      const cpuFactor = Math.min(resource.cpuCores / request.minCpuCores, 2) - 1;
      const memoryFactor = Math.min(resource.memoryGB / request.minMemoryGB, 2) - 1;
      const storageFactor = Math.min(resource.storageGB / request.minStorageGB, 2) - 1;
      score += (cpuFactor + memoryFactor + storageFactor) * 5; // Resource has medium weight (15%)

      // Reputation factor: higher reputation = higher score
      const reputationFactor = (resource.reputationScore - request.minReputation) / (10 - request.minReputation);
      score += reputationFactor * 20; // Reputation has medium-high weight (20%)

      // Location preference
      if (request.preferredLocation === resource.location) {
        score += 15; // Location match bonus (15%)
      }

      // GPU specific bonus if needed
      if (request.needsGpu && resource.gpuType) {
        const gpuFactor = Math.min(resource.gpuMemoryGB / request.minGpuMemoryGB, 2) - 1;
        score += gpuFactor * 10; // GPU bonus (10%)
      }

      return { ...resource, matchScore: score };
    });

    // Sort by match score and return the best match
    candidates.sort((a, b) => b.matchScore - a.matchScore);
    return candidates[0];
  }

  /**
   * Execute the match between a request and a resource
   * @param {Object} request - Computation request
   * @param {Object} resource - Matched resource
   * @returns {Boolean} - Whether the match was successful
   */
  async executeMatch(request, resource) {
    try {
      // In a real implementation, this would create a transaction to call the smart contract
      logger.info(`Matching request ${request.id} with resource ${resource.id} (score: ${resource.matchScore.toFixed(2)})`);
      
      // For demo, we'll simulate a successful match
      return true;
    } catch (error) {
      logger.error(`Error executing match:`, error);
      return false;
    }
  }

  /**
   * Schedule the next matching cycle
   */
  scheduleNextCycle() {
    if (this.isRunning) {
      setTimeout(() => this.runMatchingCycle(), this.matchingInterval);
    }
  }

  /**
   * Get service metrics
   * @returns {Object} - Service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isRunning: this.isRunning,
    };
  }
}

module.exports = MatchingService; 
/**
 * Computation Model
 * 
 * Manages computation jobs on the Calctra platform
 */

const { generateId } = require('../utils/helpers');
const solanaClient = require('../utils/solana_client');
const privacyComputing = require('../utils/privacy_computing');
const qualityVerification = require('../utils/quality_verification');

class Computation {
  /**
   * Create a new computation job
   * @param {Object} jobData - Computation job data
   * @param {string} jobData.userId - User ID who created the job
   * @param {string} jobData.name - Job name
   * @param {string} jobData.description - Job description
   * @param {Object} jobData.requirements - Computational requirements
   * @param {Object} jobData.dataSource - Data source information
   * @param {number} jobData.budget - Maximum budget in CAL tokens
   */
  constructor(jobData) {
    this.id = jobData.id || generateId();
    this.userId = jobData.userId;
    this.name = jobData.name;
    this.description = jobData.description || '';
    this.requirements = jobData.requirements || {};
    this.dataSource = jobData.dataSource || {};
    this.budget = jobData.budget || 0;
    this.status = jobData.status || 'pending'; // pending, matching, running, completed, failed
    this.createdAt = jobData.createdAt || new Date().toISOString();
    this.updatedAt = jobData.updatedAt || new Date().toISOString();
    this.startedAt = jobData.startedAt || null;
    this.completedAt = jobData.completedAt || null;
    this.providerId = jobData.providerId || null;
    this.results = jobData.results || null;
    this.logs = jobData.logs || [];
    this.cost = jobData.cost || null;
    this.verificationStatus = jobData.verificationStatus || null;
    this.transactionId = jobData.transactionId || null;
  }

  /**
   * Save computation job to database
   * @returns {Promise<Computation>} Updated computation job
   */
  async save() {
    try {
      this.updatedAt = new Date().toISOString();
      // Save to database implementation
      // ...
      return this;
    } catch (error) {
      console.error('Error saving computation job:', error);
      throw error;
    }
  }

  /**
   * Submit job to the matching system
   * @returns {Promise<Computation>} Updated computation job
   */
  async submit() {
    try {
      // Check if user has sufficient tokens
      const hasBalance = await this.checkUserBalance();
      if (!hasBalance) {
        throw new Error('Insufficient token balance');
      }

      // Update status
      this.status = 'matching';
      await this.save();

      // Submit to matching system
      // ...

      return this;
    } catch (error) {
      console.error('Error submitting computation job:', error);
      this.status = 'failed';
      this.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Submission failed: ${error.message}`
      });
      await this.save();
      throw error;
    }
  }

  /**
   * Check if user has sufficient token balance
   * @returns {Promise<boolean>} Has sufficient balance
   */
  async checkUserBalance() {
    try {
      const userBalance = await solanaClient.getUserTokenBalance(this.userId);
      return userBalance >= this.budget;
    } catch (error) {
      console.error('Error checking user balance:', error);
      return false;
    }
  }

  /**
   * Start computation job execution
   * @param {string} providerId - Resource provider ID
   * @returns {Promise<Computation>} Updated computation job
   */
  async start(providerId) {
    try {
      this.status = 'running';
      this.startedAt = new Date().toISOString();
      this.providerId = providerId;
      this.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Computation started with provider ${providerId}`
      });

      // Lock tokens in escrow
      this.transactionId = await solanaClient.createEscrow(
        this.userId,
        providerId,
        this.budget,
        this.id
      );

      return await this.save();
    } catch (error) {
      console.error('Error starting computation job:', error);
      this.status = 'failed';
      this.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Start failed: ${error.message}`
      });
      await this.save();
      throw error;
    }
  }

  /**
   * Apply privacy-preserving techniques to the computation
   * @returns {Promise<Computation>} Updated computation job
   */
  async applyPrivacyTechniques() {
    try {
      // Apply privacy-preserving techniques from the utility
      await privacyComputing.applyToJob(this);
      
      this.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Privacy-preserving techniques applied'
      });
      
      return await this.save();
    } catch (error) {
      console.error('Error applying privacy techniques:', error);
      this.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Privacy application failed: ${error.message}`
      });
      await this.save();
      throw error;
    }
  }

  /**
   * Set computation results
   * @param {Object} results - Computation results
   * @param {number} finalCost - Final cost in CAL tokens
   * @returns {Promise<Computation>} Updated computation job
   */
  async setResults(results, finalCost) {
    try {
      this.results = results;
      this.cost = finalCost;
      this.status = 'completed';
      this.completedAt = new Date().toISOString();
      this.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Computation completed with cost ${finalCost} CAL`
      });
      
      // Verify results
      await this.verifyResults();
      
      return await this.save();
    } catch (error) {
      console.error('Error setting computation results:', error);
      this.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Setting results failed: ${error.message}`
      });
      await this.save();
      throw error;
    }
  }

  /**
   * Verify computation results
   * @returns {Promise<Computation>} Updated computation job
   */
  async verifyResults() {
    try {
      // Use quality verification utility
      const verificationResult = await qualityVerification.verifyComputation(
        this.id,
        this.results
      );
      
      this.verificationStatus = verificationResult;
      
      // If verification passes, release funds from escrow
      if (verificationResult.status === 'verified') {
        await solanaClient.releaseEscrow(
          this.transactionId,
          this.cost
        );
      }
      
      return await this.save();
    } catch (error) {
      console.error('Error verifying results:', error);
      this.verificationStatus = {
        status: 'failed',
        error: error.message
      };
      await this.save();
      throw error;
    }
  }

  /**
   * Handle computation job failure
   * @param {string} reason - Failure reason
   * @returns {Promise<Computation>} Updated computation job
   */
  async fail(reason) {
    try {
      this.status = 'failed';
      this.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Computation failed: ${reason}`
      });
      
      // Return funds to user if job failed
      if (this.transactionId) {
        await solanaClient.cancelEscrow(this.transactionId);
      }
      
      return await this.save();
    } catch (error) {
      console.error('Error handling computation failure:', error);
      throw error;
    }
  }

  /**
   * Find computation job by ID
   * @param {string} id - Computation job ID
   * @returns {Promise<Computation|null>} Computation job or null
   */
  static async findById(id) {
    try {
      // Implementation to find computation by ID
      // ...
      return null;
    } catch (error) {
      console.error('Error finding computation by ID:', error);
      throw error;
    }
  }

  /**
   * Find computation jobs by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array<Computation>>} Array of computation jobs
   */
  static async findByUser(userId) {
    try {
      // Implementation to find computations by user ID
      // ...
      return [];
    } catch (error) {
      console.error('Error finding computations by user:', error);
      throw error;
    }
  }
}

module.exports = Computation; 
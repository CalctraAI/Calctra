/**
 * Resource Model
 * 
 * Manages computational resources on the Calctra platform
 */

const { generateId } = require('../utils/helpers');
const solanaClient = require('../utils/solana_client');

class Resource {
  /**
   * Create a new computational resource
   * @param {Object} resourceData - Resource data
   * @param {string} resourceData.providerId - Provider user ID
   * @param {string} resourceData.name - Resource name
   * @param {Object} resourceData.specifications - Hardware specifications
   * @param {Object} resourceData.pricing - Pricing information
   * @param {Array} resourceData.capabilities - Resource capabilities
   */
  constructor(resourceData) {
    this.id = resourceData.id || generateId();
    this.providerId = resourceData.providerId;
    this.name = resourceData.name;
    this.description = resourceData.description || '';
    this.specifications = resourceData.specifications || {};
    this.pricing = resourceData.pricing || {
      basePrice: 0,
      pricingModel: 'hourly' // hourly, per-task, usage-based
    };
    this.capabilities = resourceData.capabilities || [];
    this.status = resourceData.status || 'offline'; // offline, available, busy
    this.availability = resourceData.availability || {
      schedule: 'always', // always, custom
      customHours: []
    };
    this.performance = resourceData.performance || {
      successRate: 100,
      averageCompletionTime: 0,
      totalComputations: 0
    };
    this.location = resourceData.location || {
      region: 'unknown',
      latency: {}
    };
    this.createdAt = resourceData.createdAt || new Date().toISOString();
    this.updatedAt = resourceData.updatedAt || new Date().toISOString();
    this.lastOnline = resourceData.lastOnline || null;
    this.totalEarnings = resourceData.totalEarnings || 0;
    this.reputation = resourceData.reputation || 0;
    this.publicKey = resourceData.publicKey || null;
    this.verified = resourceData.verified || false;
  }

  /**
   * Save resource to database
   * @returns {Promise<Resource>} Updated resource
   */
  async save() {
    try {
      this.updatedAt = new Date().toISOString();
      // Save to database implementation
      // ...
      return this;
    } catch (error) {
      console.error('Error saving resource:', error);
      throw error;
    }
  }

  /**
   * Register resource on the blockchain
   * @returns {Promise<Resource>} Updated resource with registration info
   */
  async register() {
    try {
      // Register resource on the blockchain
      const transactionId = await solanaClient.registerResource(
        this.providerId,
        {
          resourceId: this.id,
          specifications: this.specifications,
          pricing: this.pricing,
          capabilities: this.capabilities
        }
      );
      
      // Update status
      this.status = 'available';
      this.lastOnline = new Date().toISOString();
      
      return await this.save();
    } catch (error) {
      console.error('Error registering resource:', error);
      throw error;
    }
  }

  /**
   * Update resource status
   * @param {string} status - New status (offline, available, busy)
   * @returns {Promise<Resource>} Updated resource
   */
  async updateStatus(status) {
    try {
      if (!['offline', 'available', 'busy'].includes(status)) {
        throw new Error('Invalid status');
      }
      
      this.status = status;
      
      if (status !== 'offline') {
        this.lastOnline = new Date().toISOString();
      }
      
      // Update status on blockchain
      await solanaClient.updateResourceStatus(this.id, status);
      
      return await this.save();
    } catch (error) {
      console.error('Error updating resource status:', error);
      throw error;
    }
  }

  /**
   * Update resource pricing
   * @param {Object} pricingData - New pricing data
   * @returns {Promise<Resource>} Updated resource
   */
  async updatePricing(pricingData) {
    try {
      this.pricing = {
        ...this.pricing,
        ...pricingData
      };
      
      // Update pricing on blockchain
      await solanaClient.updateResourcePricing(this.id, this.pricing);
      
      return await this.save();
    } catch (error) {
      console.error('Error updating resource pricing:', error);
      throw error;
    }
  }

  /**
   * Update resource specifications
   * @param {Object} specifications - New specifications
   * @returns {Promise<Resource>} Updated resource
   */
  async updateSpecifications(specifications) {
    try {
      this.specifications = {
        ...this.specifications,
        ...specifications
      };
      
      // Update specifications on blockchain
      await solanaClient.updateResourceSpecifications(this.id, this.specifications);
      
      return await this.save();
    } catch (error) {
      console.error('Error updating resource specifications:', error);
      throw error;
    }
  }

  /**
   * Update resource availability
   * @param {Object} availability - New availability settings
   * @returns {Promise<Resource>} Updated resource
   */
  async updateAvailability(availability) {
    try {
      this.availability = {
        ...this.availability,
        ...availability
      };
      
      return await this.save();
    } catch (error) {
      console.error('Error updating resource availability:', error);
      throw error;
    }
  }

  /**
   * Record computation completion
   * @param {string} computationId - Computation ID
   * @param {number} completionTime - Time taken to complete (ms)
   * @param {boolean} success - Whether computation was successful
   * @param {number} earnings - Earnings from computation (CAL tokens)
   * @returns {Promise<Resource>} Updated resource
   */
  async recordCompletion(computationId, completionTime, success, earnings) {
    try {
      // Update performance metrics
      this.performance.totalComputations += 1;
      
      if (success) {
        const newSuccessRate = (
          (this.performance.successRate * (this.performance.totalComputations - 1)) + 100
        ) / this.performance.totalComputations;
        
        this.performance.successRate = parseFloat(newSuccessRate.toFixed(2));
      } else {
        const newSuccessRate = (
          (this.performance.successRate * (this.performance.totalComputations - 1))
        ) / this.performance.totalComputations;
        
        this.performance.successRate = parseFloat(newSuccessRate.toFixed(2));
      }
      
      // Update average completion time
      const totalTime = (
        this.performance.averageCompletionTime * (this.performance.totalComputations - 1)
      ) + completionTime;
      
      this.performance.averageCompletionTime = totalTime / this.performance.totalComputations;
      
      // Update earnings
      this.totalEarnings += earnings;
      
      // Update status if busy
      if (this.status === 'busy') {
        this.status = 'available';
      }
      
      return await this.save();
    } catch (error) {
      console.error('Error recording computation completion:', error);
      throw error;
    }
  }

  /**
   * Verify resource
   * @returns {Promise<Resource>} Updated resource
   */
  async verify() {
    try {
      this.verified = true;
      return await this.save();
    } catch (error) {
      console.error('Error verifying resource:', error);
      throw error;
    }
  }

  /**
   * Find resource by ID
   * @param {string} id - Resource ID
   * @returns {Promise<Resource|null>} Resource or null
   */
  static async findById(id) {
    try {
      // Implementation to find resource by ID
      // ...
      return null;
    } catch (error) {
      console.error('Error finding resource by ID:', error);
      throw error;
    }
  }

  /**
   * Find resources by provider ID
   * @param {string} providerId - Provider ID
   * @returns {Promise<Array<Resource>>} Array of resources
   */
  static async findByProvider(providerId) {
    try {
      // Implementation to find resources by provider ID
      // ...
      return [];
    } catch (error) {
      console.error('Error finding resources by provider:', error);
      throw error;
    }
  }

  /**
   * Find available resources matching requirements
   * @param {Object} requirements - Resource requirements
   * @returns {Promise<Array<Resource>>} Array of matching resources
   */
  static async findMatching(requirements) {
    try {
      // Implementation to find resources matching requirements
      // ...
      return [];
    } catch (error) {
      console.error('Error finding matching resources:', error);
      throw error;
    }
  }
}

module.exports = Resource; 
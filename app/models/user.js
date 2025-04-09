/**
 * User Model
 * 
 * Handles user data, authentication, and profile management for the Calctra platform
 */

const { generateId } = require('../utils/helpers');
const solanaClient = require('../utils/solana_client');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.walletAddress - Solana wallet address
   * @param {string} userData.username - Optional username
   * @param {string} userData.email - Optional email
   * @param {Object} userData.profile - Optional profile data
   */
  constructor(userData) {
    this.id = userData.id || generateId();
    this.walletAddress = userData.walletAddress;
    this.username = userData.username || null;
    this.email = userData.email || null;
    this.profile = userData.profile || {};
    this.createdAt = userData.createdAt || new Date().toISOString();
    this.updatedAt = userData.updatedAt || new Date().toISOString();
    this.lastLogin = userData.lastLogin || null;
    this.reputation = userData.reputation || 0;
    this.resourceProvider = userData.resourceProvider || false;
    this.computationUser = userData.computationUser || false;
    this.tokenBalance = userData.tokenBalance || 0;
  }

  /**
   * Authenticate user with wallet
   * @param {string} signature - Signed message signature
   * @param {string} message - Original message that was signed
   * @returns {Promise<boolean>} Authentication result
   */
  async authenticate(signature, message) {
    try {
      const isValid = await solanaClient.verifySignature(
        this.walletAddress,
        signature,
        message
      );
      
      if (isValid) {
        this.lastLogin = new Date().toISOString();
        // Update user in database
        await this.save();
      }
      
      return isValid;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  /**
   * Save user to database
   * @returns {Promise<User>} Updated user
   */
  async save() {
    try {
      this.updatedAt = new Date().toISOString();
      // Save to database implementation
      // ...
      return this;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - New profile data
   * @returns {Promise<User>} Updated user
   */
  async updateProfile(profileData) {
    try {
      this.profile = {
        ...this.profile,
        ...profileData
      };
      return await this.save();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Register as resource provider
   * @param {Object} resourceData - Resource provider data
   * @returns {Promise<User>} Updated user
   */
  async registerAsProvider(resourceData) {
    try {
      this.resourceProvider = true;
      this.resourceData = {
        ...this.resourceData,
        ...resourceData
      };
      return await this.save();
    } catch (error) {
      console.error('Error registering as provider:', error);
      throw error;
    }
  }

  /**
   * Get user's token balance
   * @returns {Promise<number>} Token balance
   */
  async getTokenBalance() {
    try {
      const balance = await solanaClient.getTokenBalance(this.walletAddress);
      this.tokenBalance = balance;
      return balance;
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  /**
   * Get user's computation history
   * @returns {Promise<Array>} Computation history
   */
  async getComputationHistory() {
    try {
      // Implementation to fetch computation history
      // ...
      return [];
    } catch (error) {
      console.error('Error fetching computation history:', error);
      throw error;
    }
  }

  /**
   * Get user's resource provision history
   * @returns {Promise<Array>} Resource provision history
   */
  async getProvisionHistory() {
    try {
      // Implementation to fetch resource provision history
      // ...
      return [];
    } catch (error) {
      console.error('Error fetching provision history:', error);
      throw error;
    }
  }

  /**
   * Find user by wallet address
   * @param {string} walletAddress - Solana wallet address
   * @returns {Promise<User|null>} User or null
   */
  static async findByWallet(walletAddress) {
    try {
      // Implementation to find user by wallet
      // ...
      return null;
    } catch (error) {
      console.error('Error finding user by wallet:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>} User or null
   */
  static async findById(id) {
    try {
      // Implementation to find user by ID
      // ...
      return null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
}

module.exports = User; 
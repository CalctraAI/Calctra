/**
 * API Routes
 * 
 * Handles all API endpoints for the Calctra platform
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Resource = require('../models/resource');
const Computation = require('../models/computation');
const solanaClient = require('../utils/solana_client');
const { isValidSolanaAddress } = require('../utils/helpers');

// --- User & Authentication Routes ---

/**
 * Get user by wallet address
 */
router.get('/users/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Solana wallet address' 
      });
    }
    
    const user = await User.findByWallet(walletAddress);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        profile: user.profile,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        reputation: user.reputation,
        resourceProvider: user.resourceProvider,
        computationUser: user.computationUser
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Create or update user
 */
router.post('/users', async (req, res) => {
  try {
    const { walletAddress, username, email, profile } = req.body;
    
    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Solana wallet address' 
      });
    }
    
    // Check if user exists
    let user = await User.findByWallet(walletAddress);
    
    if (user) {
      // Update existing user
      if (username) user.username = username;
      if (email) user.email = email;
      if (profile) user.profile = { ...user.profile, ...profile };
      
      user.updatedAt = new Date().toISOString();
      await user.save();
    } else {
      // Create new user
      user = new User({
        walletAddress,
        username,
        email,
        profile
      });
      
      await user.save();
    }
    
    return res.status(200).json({ 
      success: true, 
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        profile: user.profile,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Get user balance
 */
router.get('/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Solana wallet address' 
      });
    }
    
    const balance = await solanaClient.getTokenBalance(walletAddress);
    
    return res.status(200).json({ 
      success: true, 
      balance
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// --- Resource Routes ---

/**
 * Get all available resources
 */
router.get('/resources/available', async (req, res) => {
  try {
    // Query parameters for filtering
    const { minCores, minMemory, minStorage, gpu, capability } = req.query;
    
    // Build query object
    const query = { status: 'available' };
    
    if (minCores) {
      query['specifications.cpu.cores'] = { $gte: parseInt(minCores) };
    }
    
    if (minMemory) {
      query['specifications.memory'] = { $gte: parseInt(minMemory) };
    }
    
    if (minStorage) {
      query['specifications.storage'] = { $gte: parseInt(minStorage) };
    }
    
    if (gpu === 'true') {
      query['specifications.gpu'] = { $ne: null };
    }
    
    if (capability) {
      query.capabilities = capability;
    }
    
    // Find matching resources
    const resources = await Resource.findMatching(query);
    
    return res.status(200).json({ 
      success: true, 
      resources
    });
  } catch (error) {
    console.error('Error getting available resources:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Get resources by provider
 */
router.get('/resources/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    if (!isValidSolanaAddress(providerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid provider ID' 
      });
    }
    
    const resources = await Resource.findByProvider(providerId);
    
    return res.status(200).json({ 
      success: true, 
      resources
    });
  } catch (error) {
    console.error('Error getting provider resources:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Register new resource
 */
router.post('/resources', async (req, res) => {
  try {
    const { 
      providerId, 
      name, 
      description, 
      specifications, 
      pricing, 
      capabilities 
    } = req.body;
    
    if (!isValidSolanaAddress(providerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid provider ID' 
      });
    }
    
    // Validate required fields
    if (!name || !specifications || !pricing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Create resource
    const resource = new Resource({
      providerId,
      name,
      description,
      specifications,
      pricing,
      capabilities
    });
    
    // Register on blockchain
    await resource.register();
    
    return res.status(201).json({ 
      success: true, 
      resource: {
        id: resource.id,
        providerId: resource.providerId,
        name: resource.name,
        status: resource.status
      }
    });
  } catch (error) {
    console.error('Error registering resource:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Update resource status
 */
router.put('/resources/:resourceId/status', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { status } = req.body;
    
    if (!['offline', 'available', 'busy'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }
    
    const resource = await Resource.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }
    
    await resource.updateStatus(status);
    
    return res.status(200).json({ 
      success: true, 
      resource: {
        id: resource.id,
        status: resource.status
      }
    });
  } catch (error) {
    console.error('Error updating resource status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// --- Computation Routes ---

/**
 * Get computations by user
 */
router.get('/computations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!isValidSolanaAddress(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    const computations = await Computation.findByUser(userId);
    
    return res.status(200).json({ 
      success: true, 
      computations
    });
  } catch (error) {
    console.error('Error getting user computations:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Get computations by provider
 */
router.get('/computations/provider/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    if (!isValidSolanaAddress(providerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid provider ID' 
      });
    }
    
    // Find all computations with the given provider ID
    const computations = await Computation.find({ providerId });
    
    return res.status(200).json({ 
      success: true, 
      computations
    });
  } catch (error) {
    console.error('Error getting provider computations:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Submit new computation
 */
router.post('/computations', async (req, res) => {
  try {
    const { 
      userId, 
      name, 
      description, 
      requirements, 
      dataSource, 
      budget, 
      priority 
    } = req.body;
    
    if (!isValidSolanaAddress(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // Validate required fields
    if (!name || !requirements || !dataSource || !budget) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Check user balance
    const balance = await solanaClient.getTokenBalance(userId);
    
    if (balance < budget) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient token balance' 
      });
    }
    
    // Create computation job
    const computation = new Computation({
      userId,
      name,
      description,
      requirements,
      dataSource,
      budget,
      priority
    });
    
    // Submit to matching system
    await computation.submit();
    
    return res.status(201).json({ 
      success: true, 
      computation: {
        id: computation.id,
        status: computation.status
      }
    });
  } catch (error) {
    console.error('Error submitting computation:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Get computation by ID
 */
router.get('/computations/:computationId', async (req, res) => {
  try {
    const { computationId } = req.params;
    
    const computation = await Computation.findById(computationId);
    
    if (!computation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Computation not found' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      computation
    });
  } catch (error) {
    console.error('Error getting computation:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Cancel computation
 */
router.put('/computations/:computationId/cancel', async (req, res) => {
  try {
    const { computationId } = req.params;
    
    const computation = await Computation.findById(computationId);
    
    if (!computation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Computation not found' 
      });
    }
    
    // Check if computation can be cancelled
    if (!['pending', 'matching'].includes(computation.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel computation in current state' 
      });
    }
    
    await computation.fail('Cancelled by user');
    
    return res.status(200).json({ 
      success: true, 
      computation: {
        id: computation.id,
        status: computation.status
      }
    });
  } catch (error) {
    console.error('Error cancelling computation:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * Provider API: Update computation status
 */
router.put('/provider/computations/:computationId/status', async (req, res) => {
  try {
    const { computationId } = req.params;
    const { providerId, status, results, cost } = req.body;
    
    if (!isValidSolanaAddress(providerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid provider ID' 
      });
    }
    
    const computation = await Computation.findById(computationId);
    
    if (!computation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Computation not found' 
      });
    }
    
    // Check if provider is assigned to this computation
    if (computation.providerId !== providerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access to computation' 
      });
    }
    
    // Update status based on provider's request
    if (status === 'completed') {
      if (!results || !cost) {
        return res.status(400).json({ 
          success: false, 
          message: 'Results and cost required for completion' 
        });
      }
      
      await computation.setResults(results, cost);
    } else if (status === 'failed') {
      const reason = req.body.reason || 'Provider reported failure';
      await computation.fail(reason);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status update' 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      computation: {
        id: computation.id,
        status: computation.status
      }
    });
  } catch (error) {
    console.error('Error updating computation status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// --- Provider Earnings Routes ---

/**
 * Get provider earnings
 */
router.get('/earnings/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    if (!isValidSolanaAddress(providerId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid provider ID' 
      });
    }
    
    // Find resources owned by provider
    const resources = await Resource.findByProvider(providerId);
    
    // Calculate total earnings
    let totalEarnings = 0;
    let pendingEarnings = 0;
    const earningsHistory = [];
    
    resources.forEach(resource => {
      totalEarnings += resource.totalEarnings || 0;
      
      // Add completed jobs to history
      // This is a simplified version - in a real system, you would
      // have a more robust earnings tracking system
    });
    
    // Find ongoing computations for pending earnings calculation
    const ongoingComputations = await Computation.find({
      providerId,
      status: 'running'
    });
    
    ongoingComputations.forEach(computation => {
      pendingEarnings += computation.budget || 0;
    });
    
    return res.status(200).json({ 
      success: true, 
      total: totalEarnings,
      pending: pendingEarnings,
      history: earningsHistory
    });
  } catch (error) {
    console.error('Error getting provider earnings:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router; 
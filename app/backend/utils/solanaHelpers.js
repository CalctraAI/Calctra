const { Connection, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { Keypair } = require('@solana/web3.js');
const logger = require('./logger');

// Configuration should be loaded from environment variables in production
const config = {
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  programId: process.env.PROGRAM_ID || '7rcCBu6sfRQGBmptXveMJg1xJYiedXcuq9CCmLwYYbVN',
  keypairPath: process.env.KEYPAIR_PATH || './keypair.json'
};

// Initialize Solana connection
const connection = new Connection(config.rpcUrl, 'confirmed');
let payer;

try {
  const keypairData = require(config.keypairPath);
  payer = Keypair.fromSecretKey(new Uint8Array(keypairData));
} catch (error) {
  logger.error(`Error loading keypair: ${error.message}`);
  // In production, you might want to exit the process here
  // process.exit(1);
}

const programId = new PublicKey(config.programId);

/**
 * Fetch pending computation requests from the blockchain
 * @param {string} status - Status filter for requests ('pending', 'matched', 'completed')
 * @return {Promise<Array>} Array of computation requests
 */
async function getComputationRequests(status = 'pending') {
  try {
    logger.info(`Fetching computation requests with status: ${status}`);
    
    // In a real implementation, this would query the Solana program
    // for computation requests with the specified status
    
    // Placeholder implementation
    const requests = [
      {
        id: 'req-1',
        userId: 'user-123',
        description: 'Genomic sequence analysis',
        minCpuCores: 8,
        minMemoryGB: 16,
        minStorageGB: 100,
        optimalCpuCores: 16,
        optimalMemoryGB: 32,
        optimalStorageGB: 200,
        priority: 2,
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 'req-2',
        userId: 'user-456',
        description: 'Climate model simulation',
        minCpuCores: 16,
        minMemoryGB: 64,
        minStorageGB: 500,
        optimalCpuCores: 32,
        optimalMemoryGB: 128,
        optimalStorageGB: 1000,
        priority: 3,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter by status if provided
    const filteredRequests = requests.filter(req => req.status === status);
    
    logger.info(`Found ${filteredRequests.length} computation requests`);
    logger.metric('requests_fetched', filteredRequests.length);
    
    return filteredRequests;
  } catch (error) {
    logger.error(`Error fetching computation requests: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch available resources from the blockchain
 * @return {Promise<Array>} Array of available resources
 */
async function getAvailableResources() {
  try {
    logger.info('Fetching available resources');
    
    // In a real implementation, this would query the Solana program
    // for available computational resources
    
    // Placeholder implementation
    const resources = [
      {
        id: 'res-1',
        providerId: 'provider-123',
        cpuCores: 16,
        memoryGB: 64,
        storageGB: 500,
        gpuType: 'none',
        location: 'us-west',
        availableUntil: new Date(Date.now() + 86400000).toISOString(),
        pricePerHour: 1.5,
        status: 'available'
      },
      {
        id: 'res-2',
        providerId: 'provider-456',
        cpuCores: 32,
        memoryGB: 128,
        storageGB: 1000,
        gpuType: 'NVIDIA A100',
        location: 'us-east',
        availableUntil: new Date(Date.now() + 86400000).toISOString(),
        pricePerHour: 4.5,
        status: 'available'
      },
      {
        id: 'res-3',
        providerId: 'provider-789',
        cpuCores: 8,
        memoryGB: 32,
        storageGB: 250,
        gpuType: 'none',
        location: 'eu-central',
        availableUntil: new Date(Date.now() + 86400000).toISOString(),
        pricePerHour: 0.8,
        status: 'available'
      }
    ];
    
    logger.info(`Found ${resources.length} available resources`);
    logger.metric('resources_fetched', resources.length);
    
    return resources;
  } catch (error) {
    logger.error(`Error fetching available resources: ${error.message}`);
    throw error;
  }
}

/**
 * Submit a match between a computation request and a resource to the blockchain
 * @param {string} requestId - ID of the computation request
 * @param {string} resourceId - ID of the resource
 * @return {Promise<string>} Transaction signature
 */
async function submitMatch(requestId, resourceId) {
  try {
    logger.info(`Submitting match: Request ${requestId} with Resource ${resourceId}`);
    
    // In a real implementation, this would submit a transaction to the Solana program
    // to record the match and trigger necessary on-chain state updates
    
    // Placeholder implementation
    const txSignature = `${Math.random().toString(36).substring(2, 15)}`;
    
    // Simulate a delay for blockchain confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`Match submitted with transaction signature: ${txSignature}`);
    return txSignature;
  } catch (error) {
    logger.error(`Error submitting match: ${error.message}`);
    throw error;
  }
}

/**
 * Create a new computation request on the blockchain
 * @param {Object} requestData - Request data
 * @return {Promise<string>} Request ID
 */
async function createComputationRequest(requestData) {
  try {
    logger.info('Creating new computation request');
    
    // In a real implementation, this would submit a transaction to the Solana program
    
    // Placeholder implementation
    const requestId = `req-${Date.now().toString(36)}`;
    
    // Simulate a delay for blockchain confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`Computation request created with ID: ${requestId}`);
    return requestId;
  } catch (error) {
    logger.error(`Error creating computation request: ${error.message}`);
    throw error;
  }
}

/**
 * Register a new resource on the blockchain
 * @param {Object} resourceData - Resource data
 * @return {Promise<string>} Resource ID
 */
async function registerResource(resourceData) {
  try {
    logger.info('Registering new resource');
    
    // In a real implementation, this would submit a transaction to the Solana program
    
    // Placeholder implementation
    const resourceId = `res-${Date.now().toString(36)}`;
    
    // Simulate a delay for blockchain confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`Resource registered with ID: ${resourceId}`);
    return resourceId;
  } catch (error) {
    logger.error(`Error registering resource: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getComputationRequests,
  getAvailableResources,
  submitMatch,
  createComputationRequest,
  registerResource
}; 
/**
 * Solana Client Utility
 * Handles interaction with the Solana blockchain for the Calctra platform
 */

const { Connection, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

/**
 * SolanaClient provides utility methods for interacting with Solana blockchain
 * and Calctra's smart contracts
 */
class SolanaClient {
    /**
     * Initialize the Solana client
     * @param {string} rpcUrl - The Solana RPC URL to connect to
     * @param {string} programId - The Calctra program ID on Solana
     * @param {string} tokenMintAddress - The CAL token mint address
     */
    constructor(rpcUrl, programId, tokenMintAddress) {
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.programId = new PublicKey(programId);
        this.tokenMintAddress = new PublicKey(tokenMintAddress);
    }

    /**
     * Get the Calctra token (CAL) details
     * @param {Object} wallet - The wallet to use for transactions
     * @returns {Promise<Object>} Token details
     */
    async getTokenDetails(wallet) {
        try {
            const token = new Token(
                this.connection,
                this.tokenMintAddress,
                TOKEN_PROGRAM_ID,
                wallet
            );

            const tokenInfo = await token.getMintInfo();
            return {
                decimals: tokenInfo.decimals,
                supply: tokenInfo.supply.toString(),
                isInitialized: tokenInfo.isInitialized,
                mintAuthority: tokenInfo.mintAuthority ? tokenInfo.mintAuthority.toBase58() : null,
                freezeAuthority: tokenInfo.freezeAuthority ? tokenInfo.freezeAuthority.toBase58() : null
            };
        } catch (error) {
            console.error('Error getting token details:', error);
            throw error;
        }
    }

    /**
     * Get the user's CAL token balance
     * @param {PublicKey} owner - The owner's public key
     * @returns {Promise<number>} Token balance
     */
    async getTokenBalance(owner) {
        try {
            const token = new Token(
                this.connection,
                this.tokenMintAddress,
                TOKEN_PROGRAM_ID,
                owner
            );

            const userTokenAccount = await token.getOrCreateAssociatedAccountInfo(owner);
            const balance = await this.connection.getTokenAccountBalance(userTokenAccount.address);
            
            return balance.value.uiAmount;
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw error;
        }
    }

    /**
     * Register a computational resource on the Calctra platform
     * @param {Object} wallet - The wallet to use for transactions
     * @param {Object} resourceDetails - Details of the resource to register
     * @returns {Promise<string>} Transaction signature
     */
    async registerResource(wallet, resourceDetails) {
        try {
            // Construct instruction data for the register_resource instruction
            const dataLayout = {
                resourceType: resourceDetails.resourceType,
                computationPower: BigInt(resourceDetails.computationPower),
                availableMemory: BigInt(resourceDetails.availableMemory),
                location: resourceDetails.location,
                pricePerUnit: BigInt(resourceDetails.pricePerUnit)
            };
            
            // Call the resource registration instruction
            // This is a simplified representation - actual implementation would use Borsh serialization
            const instructionData = Buffer.from(JSON.stringify(dataLayout));
            
            const transaction = this._createTransaction(wallet.publicKey, 'registerResource', instructionData);
            const signature = await sendAndConfirmTransaction(this.connection, transaction, [wallet]);
            
            return signature;
        } catch (error) {
            console.error('Error registering resource:', error);
            throw error;
        }
    }

    /**
     * Submit a computation request on the Calctra platform
     * @param {Object} wallet - The wallet to use for transactions
     * @param {Object} requestDetails - Details of the computation request
     * @returns {Promise<string>} Transaction signature
     */
    async submitComputationRequest(wallet, requestDetails) {
        try {
            // Construct instruction data for the submit_computation_request instruction
            const dataLayout = {
                computationType: requestDetails.computationType,
                requiredPower: BigInt(requestDetails.requiredPower),
                requiredMemory: BigInt(requestDetails.requiredMemory),
                maxPricePerUnit: BigInt(requestDetails.maxPricePerUnit),
                preferredLocation: requestDetails.preferredLocation || null,
                durationEstimate: BigInt(requestDetails.durationEstimate)
            };
            
            // Call the computation request instruction
            // This is a simplified representation - actual implementation would use Borsh serialization
            const instructionData = Buffer.from(JSON.stringify(dataLayout));
            
            const transaction = this._createTransaction(wallet.publicKey, 'submitComputationRequest', instructionData);
            const signature = await sendAndConfirmTransaction(this.connection, transaction, [wallet]);
            
            return signature;
        } catch (error) {
            console.error('Error submitting computation request:', error);
            throw error;
        }
    }

    /**
     * Match a resource with a computation request
     * @param {Object} wallet - The wallet to use for transactions
     * @param {string} requestId - ID of the computation request
     * @param {string} resourceId - ID of the resource to match
     * @returns {Promise<string>} Transaction signature
     */
    async matchResource(wallet, requestId, resourceId) {
        try {
            // Construct instruction data
            const dataLayout = {
                requestId: BigInt(requestId),
                resourceId: BigInt(resourceId)
            };
            
            // Call the match resource instruction
            const instructionData = Buffer.from(JSON.stringify(dataLayout));
            
            const transaction = this._createTransaction(wallet.publicKey, 'matchResource', instructionData);
            const signature = await sendAndConfirmTransaction(this.connection, transaction, [wallet]);
            
            return signature;
        } catch (error) {
            console.error('Error matching resource:', error);
            throw error;
        }
    }

    /**
     * Complete a computation task
     * @param {Object} wallet - The wallet to use for transactions
     * @param {string} requestId - ID of the computation request
     * @param {number} actualDuration - Actual duration of the computation
     * @param {boolean} success - Whether the computation was successful
     * @returns {Promise<string>} Transaction signature
     */
    async completeComputation(wallet, requestId, actualDuration, success) {
        try {
            // Construct instruction data
            const dataLayout = {
                requestId: BigInt(requestId),
                actualDuration: BigInt(actualDuration),
                success: success
            };
            
            // Call the complete computation instruction
            const instructionData = Buffer.from(JSON.stringify(dataLayout));
            
            const transaction = this._createTransaction(wallet.publicKey, 'completeComputation', instructionData);
            const signature = await sendAndConfirmTransaction(this.connection, transaction, [wallet]);
            
            return signature;
        } catch (error) {
            console.error('Error completing computation:', error);
            throw error;
        }
    }

    /**
     * Get all available resources
     * @returns {Promise<Array>} List of available resources
     */
    async getAvailableResources() {
        try {
            // This is a simplified implementation
            // In a real application, we would query program accounts of the resource_account type
            
            // Mock implementation for development
            const accounts = await this.connection.getProgramAccounts(this.programId, {
                filters: [
                    {
                        dataSize: 200, // Approximate size of ResourceAccount
                    }
                ]
            });
            
            return accounts.map(account => {
                // Parse account data (simplified)
                const data = account.account.data;
                
                // In a real implementation, we would deserialize the account data properly
                // This is just a placeholder
                return {
                    pubkey: account.pubkey.toBase58(),
                    data: "Resource data would be deserialized here"
                };
            });
        } catch (error) {
            console.error('Error getting available resources:', error);
            throw error;
        }
    }

    /**
     * Get computation requests for a user
     * @param {PublicKey} userPublicKey - The user's public key
     * @returns {Promise<Array>} List of computation requests
     */
    async getUserComputationRequests(userPublicKey) {
        try {
            // This is a simplified implementation
            // In a real application, we would query program accounts of the computation_request type
            // filtered by the requester field
            
            // Mock implementation for development
            const accounts = await this.connection.getProgramAccounts(this.programId, {
                filters: [
                    {
                        dataSize: 200, // Approximate size of ComputationRequest
                    },
                    {
                        memcmp: {
                            offset: 8 + 8, // Skip discriminator and request_id
                            bytes: userPublicKey.toBase58()
                        }
                    }
                ]
            });
            
            return accounts.map(account => {
                // Parse account data (simplified)
                const data = account.account.data;
                
                // In a real implementation, we would deserialize the account data properly
                // This is just a placeholder
                return {
                    pubkey: account.pubkey.toBase58(),
                    data: "Computation request data would be deserialized here"
                };
            });
        } catch (error) {
            console.error('Error getting user computation requests:', error);
            throw error;
        }
    }

    /**
     * Create a transaction with the given instruction
     * @private
     * @param {PublicKey} payer - The transaction payer
     * @param {string} instruction - The instruction name
     * @param {Buffer} data - The instruction data
     * @returns {Transaction} The constructed transaction
     */
    _createTransaction(payer, instruction, data) {
        // In a real implementation, this would construct proper Solana instructions
        // This is a simplified placeholder
        const transaction = new Transaction();
        
        // Add a system program instruction as a placeholder
        // In a real implementation, we would add the actual program instruction
        transaction.add({
            keys: [
                { pubkey: payer, isSigner: true, isWritable: true }
            ],
            programId: this.programId,
            data: data
        });
        
        return transaction;
    }
}

module.exports = SolanaClient; 
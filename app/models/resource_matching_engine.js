/**
 * Resource Matching Engine for Calctra
 * 
 * This implements the intelligent resource matching algorithm described in the Calctra whitepaper.
 * It uses a multi-dimensional matching strategy to optimize resource allocation.
 */

class ResourceMatchingEngine {
    constructor() {
        this.matchFactors = {
            COMPUTATIONAL_POWER: { weight: 0.25 },
            RESPONSE_TIME: { weight: 0.15 },
            COST_EFFICIENCY: { weight: 0.20 },
            GEOGRAPHIC_PROXIMITY: { weight: 0.10 },
            ENERGY_CONSUMPTION: { weight: 0.15 },
            HISTORICAL_RELIABILITY: { weight: 0.15 }
        };
    }

    /**
     * Find the optimal resource allocation for a computation demand
     * @param {Object} computationDemand - The computation request details
     * @param {Array} availableResources - List of available computational resources
     * @returns {Object} The optimal resource allocation
     */
    matchResources(computationDemand, availableResources) {
        if (!availableResources || availableResources.length === 0) {
            return { success: false, message: "No available resources" };
        }

        // Filter resources that meet minimum requirements
        const eligibleResources = this._filterEligibleResources(computationDemand, availableResources);
        
        if (eligibleResources.length === 0) {
            return { 
                success: false, 
                message: "No resources meet the minimum requirements" 
            };
        }

        // Score each eligible resource
        const scoredResources = eligibleResources.map(resource => {
            const score = this._calculateMatchScore(computationDemand, resource);
            return { resource, score };
        });

        // Sort resources by score (descending)
        scoredResources.sort((a, b) => b.score - a.score);

        // Return the optimal allocation
        return {
            success: true,
            allocation: {
                resource: scoredResources[0].resource,
                score: scoredResources[0].score,
                alternatives: scoredResources.slice(1, 3) // Next best alternatives
            }
        };
    }

    /**
     * Filter resources that meet the minimum requirements of the computation demand
     * @private
     */
    _filterEligibleResources(computationDemand, availableResources) {
        return availableResources.filter(resource => {
            // Check if resource meets minimum computational power requirement
            if (resource.computationPower < computationDemand.requiredPower) {
                return false;
            }

            // Check if resource meets minimum memory requirement
            if (resource.availableMemory < computationDemand.requiredMemory) {
                return false;
            }

            // Check if resource price is within budget
            if (resource.pricePerUnit > computationDemand.maxPricePerUnit) {
                return false;
            }

            // Check if resource is active and available
            if (!resource.isActive) {
                return false;
            }

            return true;
        });
    }

    /**
     * Calculate the match score between a computation demand and a resource
     * @private
     */
    _calculateMatchScore(demand, resource) {
        let totalScore = 0;

        // Computational Power Score
        const powerScore = this._calculatePowerScore(demand, resource);
        totalScore += powerScore * this.matchFactors.COMPUTATIONAL_POWER.weight;

        // Cost Efficiency Score
        const costScore = this._calculateCostScore(demand, resource);
        totalScore += costScore * this.matchFactors.COST_EFFICIENCY.weight;

        // Geographic Proximity Score
        const locationScore = this._calculateLocationScore(demand, resource);
        totalScore += locationScore * this.matchFactors.GEOGRAPHIC_PROXIMITY.weight;

        // Response Time Score (estimated)
        const responseScore = this._calculateResponseTimeScore(resource);
        totalScore += responseScore * this.matchFactors.RESPONSE_TIME.weight;

        // Energy Consumption Score
        const energyScore = this._calculateEnergyScore(resource);
        totalScore += energyScore * this.matchFactors.ENERGY_CONSUMPTION.weight;

        // Historical Reliability Score
        const reliabilityScore = this._calculateReliabilityScore(resource);
        totalScore += reliabilityScore * this.matchFactors.HISTORICAL_RELIABILITY.weight;

        return totalScore;
    }

    /**
     * Calculate score for computational power match
     * @private
     */
    _calculatePowerScore(demand, resource) {
        // A perfect match is when the resource provides exactly what's needed
        // Too much power is wasteful, too little is insufficient
        const ratio = resource.computationPower / demand.requiredPower;
        
        // Optimal ratio is between 1.0 and 1.5
        if (ratio < 1.0) return 0; // Insufficient power
        if (ratio <= 1.5) return 1.0; // Optimal range
        
        // Diminishing returns for excess capacity
        return 1.0 - Math.min(0.5, (ratio - 1.5) / 8);
    }

    /**
     * Calculate score for cost efficiency
     * @private
     */
    _calculateCostScore(demand, resource) {
        if (resource.pricePerUnit > demand.maxPricePerUnit) return 0;
        
        // Lower price gets higher score
        return 1.0 - (resource.pricePerUnit / demand.maxPricePerUnit);
    }

    /**
     * Calculate score for geographic proximity
     * @private
     */
    _calculateLocationScore(demand, resource) {
        // If no preferred location is specified, return neutral score
        if (!demand.preferredLocation) return 0.5;
        
        // Simple implementation: exact match = 1.0, otherwise use regional proximity
        if (demand.preferredLocation === resource.location) return 1.0;
        
        // Regional proximity could be calculated based on a lookup table or geo distance
        // Simplified implementation returns a default value
        return 0.3;
    }

    /**
     * Calculate score for response time
     * @private
     */
    _calculateResponseTimeScore(resource) {
        // This could be based on historical data, current load, network latency, etc.
        // Simplified implementation uses resource's reputation as a proxy
        return Math.min(1.0, resource.reputationScore / 10);
    }

    /**
     * Calculate score for energy efficiency
     * @private
     */
    _calculateEnergyScore(resource) {
        // This would typically use data about the resource's energy consumption
        // Simplified implementation returns a default value based on resource type
        switch (resource.resourceType.toLowerCase()) {
            case 'green': return 1.0;
            case 'efficient': return 0.8;
            case 'standard': return 0.5;
            case 'legacy': return 0.2;
            default: return 0.5;
        }
    }

    /**
     * Calculate score for historical reliability
     * @private
     */
    _calculateReliabilityScore(resource) {
        // Use reputation score as a proxy for reliability
        // Normalized to a 0-1 scale
        return Math.min(1.0, Math.max(0, resource.reputationScore / 10));
    }
}

module.exports = ResourceMatchingEngine; 
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatBytes, formatTokenAmount } from '../../utils/helpers';

/**
 * ResourceProvider Component
 * 
 * Handles resource provider registration, management, and monitoring
 */
const ResourceProvider = () => {
  const wallet = useWallet();
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    description: '',
    specifications: {
      cpu: {
        cores: 4,
        speed: 2.5
      },
      memory: 8,
      storage: 500,
      gpu: null
    },
    pricing: {
      basePrice: 10,
      pricingModel: 'hourly'
    },
    capabilities: []
  });
  const [earnings, setEarnings] = useState({
    total: 0,
    pending: 0,
    history: []
  });

  // Load provider resources
  useEffect(() => {
    if (wallet.connected) {
      loadResources();
      loadEarnings();
    }
  }, [wallet.connected]);

  const loadResources = async () => {
    try {
      setLoadingResources(true);
      // API call to fetch provider's resources
      const response = await fetch(`/api/resources/provider/${wallet.publicKey.toString()}`);
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const loadEarnings = async () => {
    try {
      // API call to fetch provider's earnings
      const response = await fetch(`/api/earnings/${wallet.publicKey.toString()}`);
      const data = await response.json();
      setEarnings(data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setNewResource(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setNewResource(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSpecChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [hardware, field] = name.split('.');
      setNewResource(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [hardware]: {
            ...prev.specifications[hardware],
            [field]: value
          }
        }
      }));
    } else {
      setNewResource(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [name]: value
        }
      }));
    }
  };

  const handleCapabilityToggle = (capability) => {
    setNewResource(prev => {
      const capabilities = [...prev.capabilities];
      
      if (capabilities.includes(capability)) {
        return {
          ...prev,
          capabilities: capabilities.filter(c => c !== capability)
        };
      } else {
        return {
          ...prev,
          capabilities: [...capabilities, capability]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      // API call to register a new resource
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newResource,
          providerId: wallet.publicKey.toString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Resource registered successfully');
        loadResources();
        
        // Reset form
        setNewResource({
          name: '',
          description: '',
          specifications: {
            cpu: {
              cores: 4,
              speed: 2.5
            },
            memory: 8,
            storage: 500,
            gpu: null
          },
          pricing: {
            basePrice: 10,
            pricingModel: 'hourly'
          },
          capabilities: []
        });
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error registering resource:', error);
      alert('Failed to register resource. Please try again later.');
    }
  };

  const updateResourceStatus = async (resourceId, status) => {
    try {
      // API call to update resource status
      const response = await fetch(`/api/resources/${resourceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadResources();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating resource status:', error);
      alert('Failed to update resource status. Please try again later.');
    }
  };

  // Render loading state
  if (loadingResources) {
    return (
      <div className="resource-provider-container loading">
        <h2>Resource Provider Dashboard</h2>
        <div className="loading-spinner">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="resource-provider-container">
      <h2>Resource Provider Dashboard</h2>
      
      {!wallet.connected ? (
        <div className="wallet-connect-prompt">
          <p>Please connect your wallet to manage your computational resources</p>
        </div>
      ) : (
        <>
          <div className="earnings-summary">
            <h3>Earnings Summary</h3>
            <div className="earnings-cards">
              <div className="earnings-card">
                <h4>Total Earnings</h4>
                <p className="earnings-amount">{formatTokenAmount(earnings.total)} CAL</p>
              </div>
              <div className="earnings-card">
                <h4>Pending Payments</h4>
                <p className="earnings-amount">{formatTokenAmount(earnings.pending)} CAL</p>
              </div>
            </div>
          </div>
          
          <div className="resources-list">
            <h3>Your Resources</h3>
            {resources.length === 0 ? (
              <p>You haven't registered any computational resources yet.</p>
            ) : (
              <div className="resources-grid">
                {resources.map(resource => (
                  <div key={resource.id} className={`resource-card status-${resource.status}`}>
                    <div className="resource-header">
                      <h4>{resource.name}</h4>
                      <span className={`status-badge ${resource.status}`}>
                        {resource.status}
                      </span>
                    </div>
                    
                    <div className="resource-specs">
                      <p>CPU: {resource.specifications.cpu.cores} cores @ {resource.specifications.cpu.speed} GHz</p>
                      <p>Memory: {resource.specifications.memory} GB</p>
                      <p>Storage: {formatBytes(resource.specifications.storage * 1024 * 1024 * 1024)}</p>
                      {resource.specifications.gpu && (
                        <p>GPU: {resource.specifications.gpu}</p>
                      )}
                    </div>
                    
                    <div className="resource-pricing">
                      <p>Base Price: {formatTokenAmount(resource.pricing.basePrice)} CAL per {resource.pricing.pricingModel}</p>
                    </div>
                    
                    <div className="resource-capabilities">
                      <p>Capabilities:</p>
                      <ul>
                        {resource.capabilities.map(capability => (
                          <li key={capability}>{capability}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="resource-performance">
                      <p>Success Rate: {resource.performance.successRate}%</p>
                      <p>Total Computations: {resource.performance.totalComputations}</p>
                    </div>
                    
                    <div className="resource-actions">
                      {resource.status === 'offline' ? (
                        <button 
                          onClick={() => updateResourceStatus(resource.id, 'available')}
                          className="btn btn-primary"
                        >
                          Set Available
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateResourceStatus(resource.id, 'offline')}
                          className="btn btn-secondary"
                        >
                          Set Offline
                        </button>
                      )}
                      <button className="btn btn-outline">Edit Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="register-resource">
            <h3>Register New Resource</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Resource Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newResource.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newResource.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              
              <h4>Hardware Specifications</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cpu.cores">CPU Cores</label>
                  <input
                    type="number"
                    id="cpu.cores"
                    name="cpu.cores"
                    value={newResource.specifications.cpu.cores}
                    onChange={handleSpecChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="cpu.speed">CPU Speed (GHz)</label>
                  <input
                    type="number"
                    id="cpu.speed"
                    name="cpu.speed"
                    value={newResource.specifications.cpu.speed}
                    onChange={handleSpecChange}
                    step="0.1"
                    min="0.1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="memory">Memory (GB)</label>
                  <input
                    type="number"
                    id="memory"
                    name="memory"
                    value={newResource.specifications.memory}
                    onChange={handleSpecChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="storage">Storage (GB)</label>
                  <input
                    type="number"
                    id="storage"
                    name="storage"
                    value={newResource.specifications.storage}
                    onChange={handleSpecChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="gpu">GPU (optional)</label>
                <input
                  type="text"
                  id="gpu"
                  name="gpu"
                  value={newResource.specifications.gpu || ''}
                  onChange={handleSpecChange}
                  placeholder="e.g. NVIDIA RTX 3080"
                />
              </div>
              
              <h4>Pricing</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pricing.basePrice">Base Price (CAL)</label>
                  <input
                    type="number"
                    id="pricing.basePrice"
                    name="pricing.basePrice"
                    value={newResource.pricing.basePrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="pricing.pricingModel">Pricing Model</label>
                  <select
                    id="pricing.pricingModel"
                    name="pricing.pricingModel"
                    value={newResource.pricing.pricingModel}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="per-task">Per Task</option>
                    <option value="usage-based">Usage Based</option>
                  </select>
                </div>
              </div>
              
              <h4>Capabilities</h4>
              
              <div className="capabilities-checkboxes">
                {['Machine Learning', 'Data Processing', 'Scientific Simulation', 
                  'Rendering', 'Encryption', 'Blockchain', 'Web Hosting'].map(capability => (
                  <div key={capability} className="checkbox-group">
                    <input
                      type="checkbox"
                      id={`capability-${capability}`}
                      checked={newResource.capabilities.includes(capability)}
                      onChange={() => handleCapabilityToggle(capability)}
                    />
                    <label htmlFor={`capability-${capability}`}>{capability}</label>
                  </div>
                ))}
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Register Resource</button>
                <button type="button" className="btn btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ResourceProvider; 
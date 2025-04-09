import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatTokenAmount, formatDuration } from '../../utils/helpers';

/**
 * ComputationRequest Component
 * 
 * Handles user interface for submitting computation requests
 */
const ComputationRequest = () => {
  const wallet = useWallet();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [availableResources, setAvailableResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [activeJobs, setActiveJobs] = useState([]);
  const [jobHistory, setJobHistory] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  
  const [newJob, setNewJob] = useState({
    name: '',
    description: '',
    requirements: {
      minCores: 4,
      minMemory: 8,
      minStorage: 10,
      gpu: false,
      estimatedDuration: 60 // minutes
    },
    dataSource: {
      type: 'upload', // upload, url, ipfs
      url: '',
      privacy: 'encrypted'
    },
    budget: 10,
    priority: 'normal' // low, normal, high
  });
  
  // Load user data when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      loadTokenBalance();
      loadAvailableResources();
      loadJobs();
    }
  }, [wallet.connected]);
  
  const loadTokenBalance = async () => {
    try {
      setLoadingBalance(true);
      // API call to fetch user's token balance
      const response = await fetch(`/api/balance/${wallet.publicKey.toString()}`);
      const data = await response.json();
      setTokenBalance(data.balance || 0);
    } catch (error) {
      console.error('Error loading token balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };
  
  const loadAvailableResources = async () => {
    try {
      setLoadingResources(true);
      // API call to fetch available computational resources
      const response = await fetch('/api/resources/available');
      const data = await response.json();
      setAvailableResources(data.resources || []);
    } catch (error) {
      console.error('Error loading available resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };
  
  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      // API call to fetch user's jobs
      const response = await fetch(`/api/computations/user/${wallet.publicKey.toString()}`);
      const data = await response.json();
      
      // Split jobs into active and history
      const active = [];
      const history = [];
      
      (data.computations || []).forEach(job => {
        if (['pending', 'matching', 'running'].includes(job.status)) {
          active.push(job);
        } else {
          history.push(job);
        }
      });
      
      setActiveJobs(active);
      setJobHistory(history);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setNewJob(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setNewJob(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleRequirementChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    setNewJob(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [name]: finalValue
      }
    }));
  };
  
  const handleDataSourceChange = (e) => {
    const { name, value } = e.target;
    
    setNewJob(prev => ({
      ...prev,
      dataSource: {
        ...prev.dataSource,
        [name]: value
      }
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (tokenBalance < newJob.budget) {
      alert('Insufficient token balance');
      return;
    }
    
    try {
      // API call to submit computation job
      const response = await fetch('/api/computations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newJob,
          userId: wallet.publicKey.toString()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Computation job submitted successfully');
        loadJobs();
        loadTokenBalance();
        
        // Reset form
        setNewJob({
          name: '',
          description: '',
          requirements: {
            minCores: 4,
            minMemory: 8,
            minStorage: 10,
            gpu: false,
            estimatedDuration: 60
          },
          dataSource: {
            type: 'upload',
            url: '',
            privacy: 'encrypted'
          },
          budget: 10,
          priority: 'normal'
        });
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error submitting computation job:', error);
      alert('Failed to submit computation job. Please try again later.');
    }
  };
  
  const cancelJob = async (jobId) => {
    try {
      // API call to cancel computation job
      const response = await fetch(`/api/computations/${jobId}/cancel`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Job cancelled successfully');
        loadJobs();
        loadTokenBalance();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('Failed to cancel job. Please try again later.');
    }
  };
  
  // Render loading state
  if (loadingJobs && loadingResources) {
    return (
      <div className="computation-request-container loading">
        <h2>Computation Request</h2>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="computation-request-container">
      <h2>Computation Request</h2>
      
      {!wallet.connected ? (
        <div className="wallet-connect-prompt">
          <p>Please connect your wallet to request computational resources</p>
        </div>
      ) : (
        <>
          <div className="token-balance">
            <h3>Your CAL Token Balance</h3>
            <p className="balance-amount">{formatTokenAmount(tokenBalance)} CAL</p>
          </div>
          
          <div className="active-jobs">
            <h3>Active Computation Jobs</h3>
            {activeJobs.length === 0 ? (
              <p>You don't have any active computation jobs.</p>
            ) : (
              <div className="jobs-list">
                {activeJobs.map(job => (
                  <div key={job.id} className={`job-card status-${job.status}`}>
                    <div className="job-header">
                      <h4>{job.name}</h4>
                      <span className={`status-badge ${job.status}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="job-details">
                      <p>{job.description}</p>
                      <p>Budget: {formatTokenAmount(job.budget)} CAL</p>
                      {job.startedAt && (
                        <p>Started: {new Date(job.startedAt).toLocaleString()}</p>
                      )}
                    </div>
                    
                    <div className="job-actions">
                      {['pending', 'matching'].includes(job.status) && (
                        <button 
                          onClick={() => cancelJob(job.id)}
                          className="btn btn-secondary"
                        >
                          Cancel Job
                        </button>
                      )}
                      <button className="btn btn-outline">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="request-computation">
            <h3>Request New Computation</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Job Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newJob.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newJob.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              
              <h4>Computational Requirements</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="minCores">Minimum CPU Cores</label>
                  <input
                    type="number"
                    id="minCores"
                    name="minCores"
                    value={newJob.requirements.minCores}
                    onChange={handleRequirementChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="minMemory">Minimum Memory (GB)</label>
                  <input
                    type="number"
                    id="minMemory"
                    name="minMemory"
                    value={newJob.requirements.minMemory}
                    onChange={handleRequirementChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="minStorage">Storage Required (GB)</label>
                  <input
                    type="number"
                    id="minStorage"
                    name="minStorage"
                    value={newJob.requirements.minStorage}
                    onChange={handleRequirementChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="estimatedDuration">Est. Duration (minutes)</label>
                  <input
                    type="number"
                    id="estimatedDuration"
                    name="estimatedDuration"
                    value={newJob.requirements.estimatedDuration}
                    onChange={handleRequirementChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="gpu"
                  name="gpu"
                  checked={newJob.requirements.gpu}
                  onChange={handleRequirementChange}
                />
                <label htmlFor="gpu">GPU Required</label>
              </div>
              
              <h4>Data Source</h4>
              
              <div className="form-group">
                <label htmlFor="type">Data Source Type</label>
                <select
                  id="type"
                  name="type"
                  value={newJob.dataSource.type}
                  onChange={handleDataSourceChange}
                  required
                >
                  <option value="upload">File Upload</option>
                  <option value="url">Remote URL</option>
                  <option value="ipfs">IPFS</option>
                </select>
              </div>
              
              {newJob.dataSource.type !== 'upload' && (
                <div className="form-group">
                  <label htmlFor="url">Data Source URL</label>
                  <input
                    type="text"
                    id="url"
                    name="url"
                    value={newJob.dataSource.url}
                    onChange={handleDataSourceChange}
                    placeholder="https:// or ipfs://"
                    required={newJob.dataSource.type !== 'upload'}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="privacy">Privacy Level</label>
                <select
                  id="privacy"
                  name="privacy"
                  value={newJob.dataSource.privacy}
                  onChange={handleDataSourceChange}
                  required
                >
                  <option value="encrypted">Encrypted (Default)</option>
                  <option value="confidential">Confidential</option>
                  <option value="public">Public</option>
                </select>
              </div>
              
              <h4>Budget and Priority</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="budget">Budget (CAL Tokens)</label>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={newJob.budget}
                    onChange={handleInputChange}
                    min="1"
                    max={tokenBalance}
                    required
                  />
                  <small>Your balance: {formatTokenAmount(tokenBalance)} CAL</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={newJob.priority}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="low">Low (Cheaper)</option>
                    <option value="normal">Normal</option>
                    <option value="high">High (Faster)</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <h4>Available Resources ({availableResources.length})</h4>
                <div className="available-resources-summary">
                  {loadingResources ? (
                    <p>Loading available resources...</p>
                  ) : availableResources.length === 0 ? (
                    <p>No resources currently available. Try again later.</p>
                  ) : (
                    <p>
                      {availableResources.length} resources available matching your requirements. 
                      Estimated cost range: {formatTokenAmount(Math.min(...availableResources.map(r => r.pricing.basePrice)))} - 
                      {formatTokenAmount(Math.max(...availableResources.map(r => r.pricing.basePrice)))} CAL
                    </p>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!wallet.connected || availableResources.length === 0 || tokenBalance < newJob.budget}
                >
                  Submit Computation Request
                </button>
                <button type="button" className="btn btn-outline">Cancel</button>
              </div>
            </form>
          </div>
          
          <div className="job-history">
            <h3>Job History</h3>
            {jobHistory.length === 0 ? (
              <p>You don't have any completed computation jobs.</p>
            ) : (
              <div className="jobs-list">
                {jobHistory.map(job => (
                  <div key={job.id} className={`job-card status-${job.status}`}>
                    <div className="job-header">
                      <h4>{job.name}</h4>
                      <span className={`status-badge ${job.status}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="job-details">
                      <p>Completed: {new Date(job.completedAt).toLocaleString()}</p>
                      <p>Cost: {formatTokenAmount(job.cost)} CAL</p>
                      <p>Duration: {formatDuration(job.duration)}</p>
                    </div>
                    
                    <div className="job-actions">
                      <button className="btn btn-outline">View Results</button>
                      <button className="btn btn-outline">Download Data</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ComputationRequest; 
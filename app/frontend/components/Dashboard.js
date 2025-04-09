import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatTokenAmount } from '../../utils/helpers';
import ResourceProvider from './ResourceProvider';
import ComputationRequest from './ComputationRequest';

/**
 * Dashboard Component
 * 
 * Main dashboard interface for the Calctra platform
 */
const Dashboard = () => {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [platformMetrics, setPlatformMetrics] = useState({
    activeResources: 0,
    completedComputations: 0,
    activeComputations: 0,
    totalProviders: 0
  });
  
  // Load user data when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      loadUserData();
      loadTokenBalance();
      loadPlatformMetrics();
    } else {
      setUser(null);
      setTokenBalance(0);
    }
  }, [wallet.connected]);
  
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Attempt to fetch existing user
      const response = await fetch(`/api/users/${wallet.publicKey.toString()}`);
      
      if (response.status === 200) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 404) {
        // Create new user if not found
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress: wallet.publicKey.toString()
          })
        });
        
        const createData = await createResponse.json();
        setUser(createData.user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadTokenBalance = async () => {
    try {
      const response = await fetch(`/api/balance/${wallet.publicKey.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTokenBalance(data.balance);
      }
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
  };
  
  const loadPlatformMetrics = async () => {
    try {
      // In a real implementation, this would be an API call
      // For now, using mock data
      setPlatformMetrics({
        activeResources: 156,
        completedComputations: 1432,
        activeComputations: 73,
        totalProviders: 89
      });
    } catch (error) {
      console.error('Error loading platform metrics:', error);
    }
  };
  
  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Render welcome screen if not connected
  if (!wallet.connected) {
    return (
      <div className="dashboard-container welcome">
        <div className="welcome-message">
          <h1>Welcome to Calctra</h1>
          <p>Connect your wallet to access the decentralized scientific computing platform</p>
          
          <div className="platform-metrics">
            <div className="metric-card">
              <h3>{platformMetrics.activeResources}</h3>
              <p>Active Resources</p>
            </div>
            <div className="metric-card">
              <h3>{platformMetrics.completedComputations}</h3>
              <p>Computations Completed</p>
            </div>
            <div className="metric-card">
              <h3>{platformMetrics.totalProviders}</h3>
              <p>Resource Providers</p>
            </div>
          </div>
          
          <div className="connect-prompt">
            <p>Please connect your Solana wallet to continue</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (loading) {
    return (
      <div className="dashboard-container loading">
        <div className="loading-spinner">Loading user data...</div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Calctra Dashboard</h1>
        <div className="user-info">
          <div className="wallet-info">
            <p>Connected: {wallet.publicKey.toString().substring(0, 6)}...{wallet.publicKey.toString().substring(wallet.publicKey.toString().length - 4)}</p>
            <p className="balance">{formatTokenAmount(tokenBalance)} CAL</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-navigation">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'provider' ? 'active' : ''}`}
            onClick={() => handleTabChange('provider')}
          >
            Resource Provider
          </button>
          <button 
            className={`nav-tab ${activeTab === 'computation' ? 'active' : ''}`}
            onClick={() => handleTabChange('computation')}
          >
            Request Computation
          </button>
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            Settings
          </button>
        </div>
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="welcome-banner">
              <h2>Welcome{user && user.username ? `, ${user.username}` : ''}!</h2>
              <p>Access decentralized scientific computing resources or provide your own computational power to the network</p>
            </div>
            
            <div className="overview-cards">
              <div className="overview-card">
                <h3>Your Computations</h3>
                <div className="card-content">
                  <p>Track your active and completed computation jobs</p>
                  <button 
                    className="btn-primary"
                    onClick={() => handleTabChange('computation')}
                  >
                    Request Computation
                  </button>
                </div>
              </div>
              
              <div className="overview-card">
                <h3>Your Resources</h3>
                <div className="card-content">
                  <p>Manage your computational resources and track earnings</p>
                  <button 
                    className="btn-primary"
                    onClick={() => handleTabChange('provider')}
                  >
                    Manage Resources
                  </button>
                </div>
              </div>
            </div>
            
            <div className="platform-metrics">
              <h3>Platform Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h4>{platformMetrics.activeResources}</h4>
                  <p>Active Resources</p>
                </div>
                <div className="metric-card">
                  <h4>{platformMetrics.activeComputations}</h4>
                  <p>Active Computations</p>
                </div>
                <div className="metric-card">
                  <h4>{platformMetrics.completedComputations}</h4>
                  <p>Completed Computations</p>
                </div>
                <div className="metric-card">
                  <h4>{platformMetrics.totalProviders}</h4>
                  <p>Total Providers</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'provider' && (
          <ResourceProvider />
        )}
        
        {activeTab === 'computation' && (
          <ComputationRequest />
        )}
        
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>User Settings</h2>
            
            <div className="profile-settings">
              <h3>Profile Settings</h3>
              <form>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input 
                    type="text" 
                    id="username" 
                    value={user ? user.username || '' : ''} 
                    placeholder="Enter a username"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email (Optional)</label>
                  <input 
                    type="email" 
                    id="email" 
                    value={user ? user.email || '' : ''} 
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
            
            <div className="wallet-settings">
              <h3>Wallet Information</h3>
              <p><strong>Address:</strong> {wallet.publicKey.toString()}</p>
              <p><strong>CAL Balance:</strong> {formatTokenAmount(tokenBalance)} CAL</p>
              
              <div className="wallet-actions">
                <button className="btn-outline">Get Test Tokens</button>
                <button className="btn-outline">View on Explorer</button>
              </div>
            </div>
            
            <div className="notification-settings">
              <h3>Notification Settings</h3>
              <div className="checkbox-group">
                <input type="checkbox" id="email-notifications" />
                <label htmlFor="email-notifications">Email Notifications</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="computation-updates" checked />
                <label htmlFor="computation-updates">Computation Updates</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="resource-updates" checked />
                <label htmlFor="resource-updates">Resource Updates</label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 
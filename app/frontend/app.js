/**
 * Calctra Platform Frontend Application
 * Main JavaScript for UI interactions and blockchain connectivity
 */

// DOM Elements
const connectWalletBtn = document.getElementById('connect-wallet-btn');
const resourceForm = document.getElementById('resource-registration-form');
const computationForm = document.getElementById('computation-request-form');
const buyTokenBtn = document.getElementById('buy-token-btn');
const stakeTokenBtn = document.getElementById('stake-token-btn');

// State
let walletConnected = false;
let currentAccount = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Calctra platform initialized');
    
    // Initialize placeholder images with text
    document.getElementById('logo-placeholder').textContent = 'CALCTRA';
    document.getElementById('hero-placeholder').textContent = 'SCIENTIFIC COMPUTING';
    document.getElementById('token-placeholder').textContent = 'CAL';
    document.getElementById('footer-logo-placeholder').textContent = 'CALCTRA';
    
    // Check if wallet is already connected
    checkWalletConnection();
    
    // Attach event listeners
    attachEventListeners();
});

/**
 * Attach event listeners to interactive elements
 */
function attachEventListeners() {
    // Wallet connection
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', handleWalletConnection);
    }
    
    // Resource registration form
    if (resourceForm) {
        resourceForm.addEventListener('submit', handleResourceRegistration);
    }
    
    // Computation request form
    if (computationForm) {
        computationForm.addEventListener('submit', handleComputationRequest);
    }
    
    // Token actions
    if (buyTokenBtn) {
        buyTokenBtn.addEventListener('click', handleBuyToken);
    }
    
    if (stakeTokenBtn) {
        stakeTokenBtn.addEventListener('click', handleStakeToken);
    }
}

/**
 * Check if wallet is already connected
 */
async function checkWalletConnection() {
    try {
        // Check if Phantom wallet is installed
        const isPhantomInstalled = window.solana && window.solana.isPhantom;
        
        if (!isPhantomInstalled) {
            console.log('Phantom wallet is not installed');
            connectWalletBtn.textContent = 'Install Phantom';
            connectWalletBtn.addEventListener('click', () => {
                window.open('https://phantom.app/', '_blank');
            });
            return;
        }
        
        // Try to connect to the wallet
        const response = await window.solana.connect({ onlyIfTrusted: true });
        currentAccount = response.publicKey.toString();
        walletConnected = true;
        
        // Update UI
        updateWalletUI();
        
    } catch (error) {
        console.log('Wallet auto-connection failed', error);
    }
}

/**
 * Handle wallet connection button click
 */
async function handleWalletConnection() {
    try {
        if (walletConnected) {
            // Disconnect wallet
            await window.solana.disconnect();
            walletConnected = false;
            currentAccount = null;
        } else {
            // Connect wallet
            const response = await window.solana.connect();
            currentAccount = response.publicKey.toString();
            walletConnected = true;
        }
        
        // Update UI
        updateWalletUI();
        
    } catch (error) {
        console.error('Error connecting to wallet:', error);
        showNotification('Error connecting to wallet. Please try again.', 'error');
    }
}

/**
 * Update UI based on wallet connection state
 */
function updateWalletUI() {
    if (walletConnected && currentAccount) {
        connectWalletBtn.textContent = `Connected: ${currentAccount.slice(0, 4)}...${currentAccount.slice(-4)}`;
        connectWalletBtn.classList.add('connected');
        
        // Enable form submissions
        if (resourceForm) resourceForm.classList.add('wallet-connected');
        if (computationForm) computationForm.classList.add('wallet-connected');
        
        // Enable token actions
        if (buyTokenBtn) buyTokenBtn.disabled = false;
        if (stakeTokenBtn) stakeTokenBtn.disabled = false;
    } else {
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.classList.remove('connected');
        
        // Disable form submissions
        if (resourceForm) resourceForm.classList.remove('wallet-connected');
        if (computationForm) computationForm.classList.remove('wallet-connected');
        
        // Disable token actions
        if (buyTokenBtn) buyTokenBtn.disabled = true;
        if (stakeTokenBtn) stakeTokenBtn.disabled = true;
    }
}

/**
 * Handle resource registration form submission
 * @param {Event} event - Form submission event
 */
async function handleResourceRegistration(event) {
    event.preventDefault();
    
    if (!walletConnected) {
        showNotification('Please connect your wallet first', 'warning');
        return;
    }
    
    // Get form values
    const resourceType = document.getElementById('resource-type').value;
    const computationPower = document.getElementById('computation-power').value;
    const availableMemory = document.getElementById('available-memory').value;
    const location = document.getElementById('location').value;
    const pricePerUnit = document.getElementById('price-per-unit').value;
    const availability = document.getElementById('availability').value;
    
    // Validate form
    if (!resourceType || !computationPower || !availableMemory || !location || !pricePerUnit) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }
    
    // Show loading state
    const submitBtn = resourceForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;
    
    try {
        // Mock contract call - in production, this would call the actual Solana contract
        await mockContractCall('registerResource', {
            resourceType,
            computationPower,
            availableMemory,
            location,
            pricePerUnit,
            availability
        });
        
        // Show success notification
        showNotification('Resource registered successfully!', 'success');
        
        // Reset form
        resourceForm.reset();
        
    } catch (error) {
        console.error('Error registering resource:', error);
        showNotification('Error registering resource. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

/**
 * Handle computation request form submission
 * @param {Event} event - Form submission event
 */
async function handleComputationRequest(event) {
    event.preventDefault();
    
    if (!walletConnected) {
        showNotification('Please connect your wallet first', 'warning');
        return;
    }
    
    // Get form values
    const computationType = document.getElementById('computation-type').value;
    const requiredPower = document.getElementById('required-power').value;
    const requiredMemory = document.getElementById('required-memory').value;
    const maxPrice = document.getElementById('max-price').value;
    const preferredLocation = document.getElementById('preferred-location').value;
    const durationEstimate = document.getElementById('duration-estimate').value;
    
    // Validate form
    if (!computationType || !requiredPower || !requiredMemory || !maxPrice || !durationEstimate) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }
    
    // Show loading state
    const submitBtn = computationForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Mock contract call - in production, this would call the actual Solana contract
        await mockContractCall('submitComputationRequest', {
            computationType,
            requiredPower,
            requiredMemory,
            maxPrice,
            preferredLocation,
            durationEstimate
        });
        
        // Show success notification
        showNotification('Computation request submitted successfully!', 'success');
        
        // Reset form
        computationForm.reset();
        
    } catch (error) {
        console.error('Error submitting computation request:', error);
        showNotification('Error submitting request. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

/**
 * Handle buy token button click
 */
function handleBuyToken() {
    if (!walletConnected) {
        showNotification('Please connect your wallet first', 'warning');
        return;
    }
    
    // In a real application, this would open a token purchase interface
    showNotification('Token purchase functionality will be available in the next release', 'info');
}

/**
 * Handle stake token button click
 */
function handleStakeToken() {
    if (!walletConnected) {
        showNotification('Please connect your wallet first', 'warning');
        return;
    }
    
    // In a real application, this would open a token staking interface
    showNotification('Token staking functionality will be available in the next release', 'info');
}

/**
 * Mock contract call for development purposes
 * @param {string} method - Contract method to call
 * @param {Object} params - Parameters for the contract call
 * @returns {Promise} - Resolves after a delay to simulate contract call
 */
function mockContractCall(method, params) {
    console.log(`Calling contract method: ${method}`, params);
    
    // Simulate contract call delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true, txId: 'mock-tx-' + Math.random().toString(36).substr(2, 9) });
        }, 1500);
    });
}

/**
 * Show notification to the user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    notification.appendChild(closeBtn);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
}

.notification {
    margin-bottom: 10px;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
    animation: slide-in 0.3s ease-out forwards;
}

.notification.success {
    background-color: #10B981;
    color: white;
}

.notification.error {
    background-color: #EF4444;
    color: white;
}

.notification.warning {
    background-color: #FBBF24;
    color: #1F2937;
}

.notification.info {
    background-color: #3B82F6;
    color: white;
}

.notification-close {
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    color: inherit;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.7;
}

.notification-close:hover {
    opacity: 1;
}

.notification.fade-out {
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.3s, transform 0.3s;
}

@keyframes slide-in {
    from {
        opacity: 0;
        transform: translateX(40px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
`;

document.head.appendChild(style);
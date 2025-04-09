/**
 * Calctra Server
 * 
 * Main application server for the Calctra platform
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./api/routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// API Routes
app.use('/api', apiRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Catch-all route to return the frontend for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Calctra server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  
  // Initialize resource matching engine
  initializeMatchingEngine();
});

/**
 * Initialize the resource matching engine
 * Sets up background processes for matching computations with resources
 */
function initializeMatchingEngine() {
  const matchingEngine = require('./models/resource_matching_engine');
  
  // Start the matching process
  matchingEngine.startMatchingProcess();
  
  console.log('Resource matching engine initialized');
}

// Handle unexpected errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // In production, you might want to restart the process or notify administrators
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to restart the process or notify administrators
}); 
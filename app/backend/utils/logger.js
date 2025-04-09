const winston = require('winston');
const { format } = winston;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  metric: 5
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  metric: 'cyan'
};

// Assign colors to levels
winston.addColors(colors);

// Custom format for console output
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.colorize({ all: true }),
  format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for file output (without colors)
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  format.json()
);

// Configure the Winston logger
const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'matching-engine' },
  transports: [
    // Write logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: fileFormat 
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: fileFormat 
    }),
    // Write metrics to metrics.log
    new winston.transports.File({ 
      filename: 'logs/metrics.log', 
      level: 'metric',
      format: fileFormat 
    })
  ]
});

// Add console output in development environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Add a metric method for logging metrics
logger.metric = function(metricName, value, tags = {}) {
  this.log('metric', `METRIC ${metricName}=${value}`, { 
    metric: metricName, 
    value, 
    tags,
    timestamp: new Date().toISOString() 
  });
};

module.exports = logger; 
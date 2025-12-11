const morgan = require('morgan');
const logger = require('../config/logger');

// Custom token for user info
morgan.token('user', (req) => {
  return req.user ? req.user.username : 'guest';
});

// Custom token for response time in seconds
morgan.token('response-time-sec', (req, res) => {
  const responseTime = res._startTime 
    ? (Date.now() - res._startTime) / 1000 
    : 0;
  return responseTime.toFixed(3);
});

// Development format
const devFormat = ':method :url :status :response-time ms - :user';

// Production format (JSON)
const prodFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time ms',
  user: ':user',
  ip: ':remote-addr',
  userAgent: ':user-agent'
});

const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  {
    stream: logger.stream,
    skip: (req) => {
      // Skip logging for static files
      return req.url.match(/\.(css|js|jpg|png|gif|ico|svg|woff|woff2)$/);
    }
  }
);

module.exports = requestLogger;

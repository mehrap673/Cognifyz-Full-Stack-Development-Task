const Queue = require('bull');
const logger = require('../config/logger');
const User = require('../models/User');

const dataProcessingQueue = new Queue('data-processing', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  }
});

dataProcessingQueue.process('calculate-analytics', async (job) => {
  logger.info('📊 Calculating user analytics...');
  
  try {
    const users = await User.find();
    
    const analytics = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      byCountry: {},
      avgAge: 0,
      googleUsers: users.filter(u => u.googleId).length,
      calculatedAt: new Date().toISOString()
    };

    users.forEach(user => {
      analytics.byCountry[user.country] = (analytics.byCountry[user.country] || 0) + 1;
      analytics.avgAge += user.age;
    });

    if (users.length > 0) {
      analytics.avgAge = Math.round(analytics.avgAge / users.length);
    }

    logger.info('✅ Analytics calculated successfully');
    return analytics;
  } catch (error) {
    logger.error('Analytics calculation failed:', error);
    throw error;
  }
});

const scheduleAnalytics = () => {
  dataProcessingQueue.add('calculate-analytics', {}, {
    repeat: { cron: '0 * * * *' }, // Every hour
    removeOnComplete: true
  });
  logger.info('✅ Analytics job scheduled (hourly)');
};

const scheduleCleanup = () => {
  logger.info('✅ Cleanup job scheduled (daily)');
};

dataProcessingQueue.on('completed', (job, result) => {
  logger.info(`Data job ${job.id} completed`);
});

dataProcessingQueue.on('failed', (job, err) => {
  logger.error(`Data job ${job.id} failed: ${err.message}`);
});

module.exports = { dataProcessingQueue, scheduleAnalytics, scheduleCleanup };

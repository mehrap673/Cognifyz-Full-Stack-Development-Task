const Queue = require('bull');
const logger = require('../config/logger');

const emailQueue = new Queue('email-queue', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  }
});

emailQueue.process(async (job) => {
  const { to, subject, body, type } = job.data;
  logger.info(`📧 Processing email: ${type} to ${to}`);
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  logger.info(`✅ Email sent: ${subject} to ${to}`);
  return { success: true, sentAt: new Date().toISOString() };
});

const sendEmail = async (emailData) => {
  try {
    const job = await emailQueue.add(emailData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true
    });
    logger.info(`Email job ${job.id} queued`);
    return job;
  } catch (error) {
    logger.error('Failed to queue email:', error);
    throw error;
  }
};

emailQueue.on('completed', (job, result) => {
  logger.info(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} failed: ${err.message}`);
});

module.exports = { emailQueue, sendEmail };

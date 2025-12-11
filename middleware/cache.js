const redisClient = require('../config/redis');
const logger = require('../config/logger');

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        logger.info(`Cache HIT: ${key}`);
        const data = JSON.parse(cachedData);
        return res.json({ ...data, cached: true, cacheKey: key });
      }

      logger.info(`Cache MISS: ${key}`);
      const originalJson = res.json.bind(res);

      res.json = function(data) {
        redisClient.setex(key, duration, JSON.stringify(data))
          .catch(err => logger.error('Cache set error:', err));
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

const clearCache = async (pattern = '*') => {
  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info(`Cleared ${keys.length} cache entries`);
    }
    return keys.length;
  } catch (error) {
    logger.error('Clear cache error:', error);
    throw error;
  }
};

module.exports = { cacheMiddleware, clearCache };

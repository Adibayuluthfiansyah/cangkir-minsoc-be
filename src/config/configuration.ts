export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;

      // production
      if (process.env.NODE_ENV === 'production' && !secret) {
        throw new Error(
          'CRITICAL: JWT_SECRET is required in production environment. ' +
            "Generate one using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
        );
      }
      // development
      if (!secret) {
        console.warn(' WARNING: Using default JWT_SECRET. This is insecure!');
        return 'your_super_secret_jwt_key_for_development_only';
      }

      return secret;
    })(),
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  whatsapp: {
    adminNumber: process.env.ADMIN_WHATSAPP || '628123456789',
  },

  booking: {
    minHours: parseInt(process.env.MIN_BOOKING_HOURS || '1', 10),
    maxHours: parseInt(process.env.MAX_BOOKING_HOURS || '8', 10),
    advanceDays: parseInt(process.env.BOOKING_ADVANCE_DAYS || '30', 10),
    cancellationHours: parseInt(process.env.CANCELLATION_HOURS || '24', 10),
  },

  throttle: {
    ttl: 60000,
    limit: 10,
  },
});

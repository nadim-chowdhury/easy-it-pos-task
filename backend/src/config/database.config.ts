import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  // Connection pooling configuration
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '60000', 10),
    evict: parseInt(process.env.DB_POOL_EVICT || '1000', 10),
  },
  // Connection timeout
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000', 10),
  // Query timeout
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),
}));

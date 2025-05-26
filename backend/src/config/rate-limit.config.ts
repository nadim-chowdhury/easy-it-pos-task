import { registerAs } from '@nestjs/config';

export default registerAs('rateLimit', () => ({
  ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10), // 1 minute
  limit: parseInt(process.env.RATE_LIMIT_MAX || '60', 10), // 60 requests per minute
  skipIf: process.env.RATE_LIMIT_SKIP_IF || undefined,
  skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
  skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true',
}));

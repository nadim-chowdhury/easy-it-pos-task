import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const rateLimitConfig = this.configService.get('rateLimit');
    const limit = rateLimitConfig?.limit || 60;
    const ttl = rateLimitConfig?.ttl || 60000;

    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `rate_limit:${clientIp}`;

    // Clean up expired entries
    this.cleanupExpiredEntries(now);

    const clientData = this.requests.get(key);

    if (!clientData) {
      // First request from this IP
      this.requests.set(key, { count: 1, resetTime: now + ttl });
      this.setHeaders(res, limit, limit - 1, Math.ceil(ttl / 1000));
      next();
      return;
    }

    if (now > clientData.resetTime) {
      // Reset window has passed
      this.requests.set(key, { count: 1, resetTime: now + ttl });
      this.setHeaders(res, limit, limit - 1, Math.ceil(ttl / 1000));
      next();
      return;
    }

    if (clientData.count >= limit) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      this.setHeaders(res, limit, 0, retryAfter);
      res.status(429).json({
        success: false,
        message: 'Too many requests',
        error: 'Rate limit exceeded',
        retryAfter,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Increment counter
    clientData.count++;
    const remaining = Math.max(0, limit - clientData.count);
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);

    this.setHeaders(res, limit, remaining, retryAfter);
    next();
  }

  private setHeaders(
    res: Response,
    limit: number,
    remaining: number,
    retryAfter: number,
  ) {
    res.set({
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': retryAfter.toString(),
    });
  }

  private cleanupExpiredEntries(now: number) {
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

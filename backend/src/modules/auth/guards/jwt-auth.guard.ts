import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    this.logger.debug('=== JwtAuthGuard.canActivate ===');

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    this.logger.debug(
      `Authorization header: ${authHeader ? authHeader.substring(0, 30) + '...' : 'NOT PRESENT'}`,
    );

    if (!authHeader) {
      this.logger.error('No Authorization header found');
      throw new UnauthorizedException('No authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.error('Authorization header does not start with Bearer');
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const token = authHeader.substring(7);
    if (!token || token.trim() === '') {
      this.logger.error('Empty token after Bearer prefix');
      throw new UnauthorizedException('Empty token');
    }

    this.logger.debug(
      'Token extracted successfully, proceeding with validation',
    );

    // Add custom logic here if needed
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    this.logger.debug('=== JwtAuthGuard.handleRequest ===');
    this.logger.debug(`Error: ${err ? err.message : 'None'}`);
    this.logger.debug(`User: ${user ? JSON.stringify(user, null, 2) : 'None'}`);
    this.logger.debug(`Info: ${info ? JSON.stringify(info, null, 2) : 'None'}`);

    // Log the request details for debugging
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Request URL: ${request.url}`);
    this.logger.debug(`Request method: ${request.method}`);

    if (err) {
      this.logger.error(`Authentication error: ${err.message}`);
      if (err.stack) {
        this.logger.error(`Error stack: ${err.stack}`);
      }
      throw err;
    }

    if (!user) {
      this.logger.error('No user returned from JWT strategy');
      if (info) {
        this.logger.error(`JWT Info: ${JSON.stringify(info)}`);

        // Handle specific JWT errors
        if (info.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Token has expired');
        } else if (info.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid token format');
        } else if (info.name === 'NotBeforeError') {
          throw new UnauthorizedException('Token not active yet');
        } else {
          throw new UnauthorizedException(
            `Token validation failed: ${info.message || 'Unknown error'}`,
          );
        }
      }
      throw new UnauthorizedException('Invalid token');
    }

    this.logger.debug('Authentication successful, returning user');
    return user;
  }
}

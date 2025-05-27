import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'your-secret-key';

    console.log('=== JWT Strategy Constructor ===');
    console.log(`JWT Secret exists: ${!!jwtSecret}`);
    console.log(`JWT Secret length: ${jwtSecret?.length || 0}`);
    console.log(`JWT Secret: ${jwtSecret}`); // Remove this in production!

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      // Add these options for better debugging
      algorithms: ['HS256'], // Specify the algorithm explicitly
      passReqToCallback: false, // Keep it simple for now
    });
  }

  async validate(payload: any) {
    this.logger.debug('=== JWT Strategy Validate ===');
    this.logger.debug(`Raw payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      // Check if payload has required fields
      if (!payload) {
        this.logger.error('Payload is null or undefined');
        throw new UnauthorizedException('Invalid token payload');
      }

      // Log all payload properties
      this.logger.debug(`Payload keys: ${payload}`);
      this.logger.debug(`Payload.sub: ${payload.sub}`);
      this.logger.debug(`Payload.userId: ${payload.userId}`);
      this.logger.debug(`Payload.email: ${payload.email}`);
      this.logger.debug(`Payload.iat: ${payload.iat}`);
      this.logger.debug(`Payload.exp: ${payload.exp}`);

      // Check token expiration manually (just for debugging)
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = payload.exp - now;
        this.logger.debug(`Token expires in ${timeUntilExpiry} seconds`);

        if (timeUntilExpiry <= 0) {
          this.logger.error('Token has expired');
          throw new UnauthorizedException('Token has expired');
        }
      }

      // Call your existing AuthService validateUser method
      this.logger.debug('Calling AuthService.validateUser...');

      const user = await this.authService.validateUser(payload);

      this.logger.debug(
        `AuthService.validateUser result: ${JSON.stringify(user, null, 2)}`,
      );

      if (!user) {
        this.logger.error('AuthService.validateUser returned null/undefined');
        throw new UnauthorizedException('User validation failed');
      }

      // Ensure user object has required properties
      if (!user.id || !user.email) {
        this.logger.error('User object missing required properties');
        this.logger.error(`User object: ${JSON.stringify(user)}`);
        throw new UnauthorizedException('Invalid user data');
      }

      this.logger.debug(
        `User validated successfully: ${user.email || user.username} (${user.role})`,
      );

      return user;
    } catch (error) {
      this.logger.error(`Validation error: ${error.message}`);
      this.logger.error(`Error name: ${error.name}`);
      this.logger.error(`Stack trace: ${error.stack}`);

      // Re-throw the error to be handled by the guard
      throw error;
    }
  }
}

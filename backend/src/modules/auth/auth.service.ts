import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, name, password, username } = registerDto;

    try {
      // Check if user already exists (email or username)
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new ConflictException('User with this email already exists');
        }
        if (existingUser.username === username) {
          throw new ConflictException('User with this username already exists');
        }
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user with all required fields
      const user = await this.prisma.user.create({
        data: {
          email,
          username,
          name,
          password: hashedPassword,
          role: 'CASHIER',
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Generate JWT token with consistent payload structure
      const payload = {
        sub: user.id, // Standard JWT subject claim
        userId: user.id, // Custom claim for backward compatibility
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000), // Issued at time
      };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User registered: ${user.name} (${user.email})`);

      return {
        user,
        token,
        message: 'User registered successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error('Error registering user', {
        message: errorMessage,
        stack: errorStack,
      });

      throw new BadRequestException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          isActive: true,
          password: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token with consistent payload structure
      const payload = {
        sub: user.id, // Standard JWT subject claim
        userId: user.id, // Custom claim for backward compatibility
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000), // Issued at time
      };
      const token = this.jwtService.sign(payload);

      this.logger.log(`User logged in: ${user.name}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        token,
        message: 'Login successful',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error('Error during login', {
        message: errorMessage,
        stack: errorStack,
      });

      throw new BadRequestException('Login failed');
    }
  }

  async validateUser(payload: any) {
    this.logger.debug(
      `Validating user with payload: ${JSON.stringify(payload)}`,
    );

    // Use sub (standard) or userId (custom) claim
    const userId = payload.sub || payload.userId;

    if (!userId) {
      this.logger.error('No user ID found in token payload');
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      this.logger.error(`User not found for ID: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      this.logger.error(`User account inactive: ${user.email}`);
      throw new UnauthorizedException('Account is inactive');
    }

    this.logger.debug(`User validated successfully: ${user.email}`);
    return user;
  }
}

import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account with email, username, name and password. Email and username must be unique.',
  })
  @ApiBody({
    description: 'User registration data',
    examples: {
      example1: {
        summary: 'Standard registration',
        description: 'Example of a typical user registration',
        value: {
          email: 'john.doe@example.com',
          username: 'johndoe',
          name: 'John Doe',
          password: 'SecurePass123!',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@example.com',
          username: 'johndoe',
          name: 'John Doe',
          role: 'CASHIER',
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message: 'User registered successfully',
      },
    },
  })
  @ApiConflictResponse({
    description: 'User with this email or username already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'User with this email already exists',
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/auth/register',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'email must be a valid email',
          'password must be longer than or equal to 6 characters',
          'name should not be empty',
        ],
        error: 'Bad Request',
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/auth/register',
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description:
      'Too many registration attempts. Maximum 5 requests per minute allowed.',
    schema: {
      example: {
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/auth/register',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns user information and JWT token for subsequent requests.',
  })
  @ApiBody({
    description: 'User login credentials',
    examples: {
      example1: {
        summary: 'Standard login',
        description: 'Example of user login with email and password',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePass123!',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: AuthResponseDto,
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@example.com',
          username: 'johndoe',
          name: 'John Doe',
          role: 'CASHIER',
          isActive: true,
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message: 'Login successful',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account',
    schema: {
      examples: {
        'Invalid credentials': {
          summary: 'Wrong email or password',
          value: {
            statusCode: 401,
            message: 'Invalid credentials',
            timestamp: '2024-01-15T10:30:00.000Z',
            path: '/auth/login',
          },
        },
        'Inactive account': {
          summary: 'Account is deactivated',
          value: {
            statusCode: 401,
            message: 'Account is inactive',
            timestamp: '2024-01-15T10:30:00.000Z',
            path: '/auth/login',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or login failed',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'email must be a valid email',
          'password should not be empty',
        ],
        error: 'Bad Request',
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/auth/login',
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description:
      'Too many login attempts. Maximum 10 requests per minute allowed.',
    schema: {
      example: {
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
        timestamp: '2024-01-15T10:30:00.000Z',
        path: '/auth/login',
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }
}

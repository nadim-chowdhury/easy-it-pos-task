import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    super({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: configService.get('database.url'),
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully', 'PrismaService');

      // Enable query logging in development
      if (process.env.NODE_ENV === 'development') {
        (this as any).$on('query', (e: Prisma.QueryEvent) => {
          this.logger.debug(`Query: ${e.query}`, 'PrismaService');
          this.logger.debug(`Duration: ${e.duration}ms`, 'PrismaService');
        });
      }
    } catch (error) {
      this.logger.error(
        'Failed to connect to database',
        error.stack,
        'PrismaService',
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected', 'PrismaService');
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

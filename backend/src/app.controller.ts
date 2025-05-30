import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Welcome message' })
  @ApiResponse({
    status: 200,
    description: 'Returns welcome message',
    schema: {
      type: 'string',
      example:
        'Hello World! I am Nadim Chowdhury, a Full Stack Developer from Bangladesh. Visit my portfolio at https://nadim.vercel.app',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('info')
  @ApiOperation({ summary: 'API Information' })
  @ApiResponse({
    status: 200,
    description: 'Returns API information',
  })
  getInfo() {
    return {
      name: 'POS System API',
      version: '1.0.0',
      description: 'Point of Sale System REST API',
      author: 'Nadim Chowdhury',
      portfolio: 'https://nadim.vercel.app',
      documentation: '/api/docs',
      health: '/health',
    };
  }
}

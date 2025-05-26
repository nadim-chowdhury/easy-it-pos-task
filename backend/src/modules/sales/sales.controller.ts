import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../products/dto/pagination.dto';

@ApiTags('Sales Management')
@Controller('sales')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({
  description: 'Unauthorized - Invalid or missing JWT token',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 401 },
      message: { type: 'string', example: 'Unauthorized' },
      error: { type: 'string', example: 'Unauthorized' },
    },
  },
})
@ApiInternalServerErrorResponse({
  description: 'Internal server error',
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: 500 },
      message: { type: 'string', example: 'Internal server error' },
      error: { type: 'string', example: 'Internal Server Error' },
    },
  },
})
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a new sale transaction',
    description: `
      Process a complete sale transaction including:
      - Stock validation and reduction
      - Tax and discount calculations
      - Payment processing
      - Receipt generation
      
      This endpoint handles the complete checkout process for a POS system.
    `,
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiBody({
    type: CreateSaleDto,
    description: 'Sale transaction details',
    examples: {
      'Single Item Sale': {
        value: {
          items: [
            {
              productId: '123e4567-e89b-12d3-a456-426614174000',
              quantity: 2,
            },
          ],
          paymentMethod: 'CASH',
          discount: 10,
          tax: 8.5,
          notes: 'Customer requested gift wrapping',
        },
      },
      'Multiple Items Sale': {
        value: {
          items: [
            {
              productId: '123e4567-e89b-12d3-a456-426614174000',
              quantity: 1,
            },
            {
              productId: '987fcdeb-51a4-43d2-b890-123456789abc',
              quantity: 3,
            },
          ],
          paymentMethod: 'CREDIT_CARD',
          discount: 0,
          tax: 7.25,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Sale transaction completed successfully',
    type: SaleResponseDto,
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        saleNumber: 'SAL-20241201-0001',
        totalAmount: 150.0,
        tax: 12.75,
        discount: 15.0,
        finalAmount: 147.75,
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        notes: 'Customer requested gift wrapping',
        createdAt: '2024-12-01T10:30:00Z',
        updatedAt: '2024-12-01T10:30:00Z',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          username: 'cashier01',
          email: 'cashier@example.com',
        },
        items: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            quantity: 2,
            unitPrice: 75.0,
            total: 150.0,
            product: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Premium T-Shirt',
              code: 'TSH-001',
              price: 75.0,
            },
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid sale data or insufficient stock',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Insufficient stock for Premium T-Shirt. Available: 5, Required: 10',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async create(
    @Body() createSaleDto: CreateSaleDto,
    @Request() req,
  ): Promise<SaleResponseDto> {
    return this.salesService.create(createSaleDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Retrieve all sales with pagination and sorting',
    description: `
      Get a paginated list of all sales transactions with advanced filtering options.
      Supports sorting by various fields and customizable page sizes.
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'finalAmount', 'saleNumber'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @ApiOkResponse({
    description: 'Sales retrieved successfully with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/SaleResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 245 },
            totalPages: { type: 'number', example: 25 },
          },
        },
      },
    },
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.salesService.findAll(paginationDto);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get today's sales summary and recent transactions",
    description: `
      Retrieve a comprehensive summary of today's sales performance including:
      - Total sales count
      - Total revenue
      - Average order value
      - List of recent transactions (last 10)
    `,
  })
  @ApiOkResponse({
    description: "Today's sales summary retrieved successfully",
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            salesCount: { type: 'number', example: 42 },
            totalRevenue: { type: 'number', example: 3250.75 },
            averageOrderValue: { type: 'number', example: 77.4 },
          },
        },
        recentSales: {
          type: 'array',
          items: { $ref: '#/components/schemas/SaleResponseDto' },
          maxItems: 10,
        },
      },
    },
  })
  async getTodaySales() {
    return this.salesService.getTodaySales();
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get comprehensive sales analytics and insights',
    description: `
      Generate detailed sales analytics including:
      - Revenue metrics and trends
      - Top-selling products
      - Payment method breakdown
      - Tax and discount analysis
      
      Supports different time periods for analysis.
    `,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    type: String,
    description: 'Analytics time period',
    example: 'day',
    enum: ['day', 'week', 'month'],
  })
  @ApiOkResponse({
    description: 'Sales analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string', example: 'day' },
        totalSales: { type: 'number', example: 156 },
        totalRevenue: { type: 'number', example: 12450.5 },
        averageOrderValue: { type: 'number', example: 79.81 },
        totalTax: { type: 'number', example: 1058.54 },
        totalDiscount: { type: 'number', example: 245.75 },
        topProducts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string', example: 'Premium T-Shirt' },
                  code: { type: 'string', example: 'TSH-001' },
                  price: { type: 'number', example: 75.0 },
                },
              },
              quantitySold: { type: 'number', example: 45 },
              totalRevenue: { type: 'number', example: 3375.0 },
            },
          },
        },
        paymentMethodBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string', example: 'CASH' },
              count: { type: 'number', example: 78 },
              revenue: { type: 'number', example: 6225.25 },
            },
          },
        },
      },
    },
  })
  async getAnalytics(
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.salesService.getAnalytics(period);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get detailed information for a specific sale',
    description: `
      Retrieve complete details of a single sale transaction including:
      - All sale items with product details
      - Payment information
      - User who processed the sale
      - Timestamps and status
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Unique sale identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Sale details retrieved successfully',
    type: SaleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sale not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Sale not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Validation failed (uuid is expected)',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SaleResponseDto> {
    return this.salesService.findOne(id);
  }

  @Get(':id/receipt')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Generate receipt data for a sale',
    description: `
      Generate formatted receipt data for printing or digital display.
      Includes company information, sale details, and formatting for thermal printers.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Sale ID to generate receipt for',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Receipt data generated successfully',
    schema: {
      type: 'object',
      properties: {
        sale: { $ref: '#/components/schemas/SaleResponseDto' },
        receiptData: {
          type: 'object',
          properties: {
            companyName: { type: 'string', example: 'POS System' },
            address: { type: 'string', example: '123 Business Street' },
            phone: { type: 'string', example: '+1 (555) 123-4567' },
            email: { type: 'string', example: 'info@possystem.com' },
            website: { type: 'string', example: 'www.possystem.com' },
            receiptNumber: { type: 'string', example: 'SAL-20241201-0001' },
            dateTime: { type: 'string', format: 'date-time' },
            cashier: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string', example: 'cashier01' },
                email: { type: 'string', example: 'cashier@example.com' },
              },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Sale not found for receipt generation',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Sale not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async getReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.getReceipt(id);
  }
}

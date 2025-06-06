import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsUUID,
  IsEmail,
  IsDateString,
  IsPositive,
  MinLength,
  MaxLength,
} from 'class-validator';

export class ProductSummaryDto {
  @ApiProperty({
    description: 'Unique product identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Premium Cotton T-Shirt',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Product code/SKU',
    example: 'TSH-001',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Product unit price',
    example: 29.99,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;
}

export class SaleItemResponseDto {
  @ApiProperty({
    description: 'Unique sale item identifier',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Quantity of the product sold',
    example: 2,
    type: 'integer',
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Unit price of the product at the time of sale',
    example: 29.99,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unitPrice: number;

  @ApiProperty({
    description: 'Total price for this line item (quantity × unit price)',
    example: 59.98,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  total: number;

  @ApiProperty({
    description: 'Product information at the time of sale',
    type: ProductSummaryDto,
  })
  product: ProductSummaryDto;
}

export class UserSummaryDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: '456e7890-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Username of the cashier/user',
    example: 'cashier01',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'cashier@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;
}

export class SaleResponseDto {
  @ApiProperty({
    description: 'Unique sale transaction identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Human-readable sale number for tracking and receipts',
    example: 'SAL-20241201-0001',
    pattern: '^SAL-\\d{8}-\\d{4}$',
  })
  @IsString()
  saleNumber: string;

  @ApiProperty({
    description: 'Total amount before applying tax and discount',
    example: 150.0,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    description: 'Tax amount calculated and applied',
    example: 12.75,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tax: number;

  @ApiProperty({
    description: 'Discount amount applied to the sale',
    example: 15.0,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount: number;

  @ApiProperty({
    description: 'Final amount charged to customer (total - discount + tax)',
    example: 147.75,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalAmount: number;

  @ApiProperty({
    description: 'Payment method used for the transaction',
    example: 'CASH',
    enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'],
  })
  @IsEnum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'])
  paymentMethod: string;

  @ApiProperty({
    description: 'Current status of the sale transaction',
    example: 'COMPLETED',
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
  })
  @IsEnum(['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'])
  status: string;

  @ApiPropertyOptional({
    description: 'Additional notes or comments about the sale',
    example: 'Customer requested gift wrapping',
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({
    description: 'Timestamp when the sale was created',
    example: '2024-12-01T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the sale was last updated',
    example: '2024-12-01T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  updatedAt: Date;

  @ApiProperty({
    description: 'Information about the user who processed the sale',
    type: UserSummaryDto,
  })
  user: UserSummaryDto;

  @ApiProperty({
    description: 'Name of the customer',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({
    description: 'Phone number of the customer',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  customerPhone: string;

  @ApiProperty({
    description: 'Amount received from customer',
    example: '150.00',
    type: 'string',
    format: 'decimal',
  })
  @IsString()
  amountReceived: string;

  @ApiProperty({
    description: 'Change amount returned to customer',
    example: '2.25',
    type: 'string',
    format: 'decimal',
  })
  @IsString()
  changeAmount: string;

  @ApiProperty({
    description: 'Detailed list of all items included in the sale',
    type: [SaleItemResponseDto],
    isArray: true,
  })
  items: SaleItemResponseDto[];
}

// Additional DTOs for analytics and reports
export class SalesSummaryDto {
  @ApiProperty({
    description: 'Total number of sales transactions',
    example: 42,
    type: 'integer',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  salesCount: number;

  @ApiProperty({
    description: 'Total revenue generated',
    example: 3250.75,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalRevenue: number;

  @ApiProperty({
    description: 'Average value per sale transaction',
    example: 77.4,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  averageOrderValue: number;
}

export class TodaySalesResponseDto {
  @ApiProperty({
    description: "Summary statistics for today's sales",
    type: SalesSummaryDto,
  })
  summary: SalesSummaryDto;

  @ApiProperty({
    description: 'List of recent sales (up to 10 most recent)',
    type: [SaleResponseDto],
    maxItems: 10,
    isArray: true,
  })
  recentSales: SaleResponseDto[];
}

export class TopProductDto {
  @ApiProperty({
    description: 'Product information',
    type: ProductSummaryDto,
  })
  product: ProductSummaryDto;

  @ApiProperty({
    description: 'Total quantity sold during the period',
    example: 45,
    type: 'integer',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantitySold: number;

  @ApiProperty({
    description: 'Total revenue generated by this product',
    example: 1347.55,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalRevenue: number;
}

export class PaymentMethodBreakdownDto {
  @ApiProperty({
    description: 'Payment method name',
    example: 'CASH',
    enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'],
  })
  @IsEnum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'])
  method: string;

  @ApiProperty({
    description: 'Number of transactions using this payment method',
    example: 78,
    type: 'integer',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  count: number;

  @ApiProperty({
    description: 'Total revenue from this payment method',
    example: 6225.25,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  revenue: number;
}

export class SalesAnalyticsDto {
  @ApiProperty({
    description: 'Analysis period',
    example: 'day',
    enum: ['day', 'week', 'month'],
  })
  @IsEnum(['day', 'week', 'month'])
  period: string;

  @ApiProperty({
    description: 'Total number of sales in the period',
    example: 156,
    type: 'integer',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalSales: number;

  @ApiProperty({
    description: 'Total revenue in the period',
    example: 12450.5,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalRevenue: number;

  @ApiProperty({
    description: 'Average order value in the period',
    example: 79.81,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  averageOrderValue: number;

  @ApiProperty({
    description: 'Total tax collected in the period',
    example: 1058.54,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalTax: number;

  @ApiProperty({
    description: 'Total discounts given in the period',
    example: 245.75,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalDiscount: number;

  @ApiProperty({
    description: 'Top-selling products in the period',
    type: [TopProductDto],
    maxItems: 10,
    isArray: true,
  })
  topProducts: TopProductDto[];

  @ApiProperty({
    description: 'Breakdown of sales by payment method',
    type: [PaymentMethodBreakdownDto],
    isArray: true,
  })
  paymentMethodBreakdown: PaymentMethodBreakdownDto[];
}

// Receipt DTOs
export class ReceiptDataDto {
  @ApiProperty({
    description: 'Company/store name',
    example: 'POS System',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  companyName: string;

  @ApiProperty({
    description: 'Company address',
    example: '123 Business Street, City, State 12345',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiProperty({
    description: 'Company phone number',
    example: '+1 (555) 123-4567',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'Company email address',
    example: 'info@possystem.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Company website URL',
    example: 'www.possystem.com',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  website: string;

  @ApiProperty({
    description: 'Receipt number (same as sale number)',
    example: 'SAL-20241201-0001',
    pattern: '^SAL-\\d{8}-\\d{4}$',
  })
  @IsString()
  receiptNumber: string;

  @ApiProperty({
    description: 'Date and time of the transaction',
    example: '2024-12-01T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  dateTime: Date;

  @ApiProperty({
    description: 'Information about the cashier who processed the sale',
    type: UserSummaryDto,
  })
  cashier: UserSummaryDto;
}

export class ReceiptResponseDto {
  @ApiProperty({
    description: 'Complete sale information',
    type: SaleResponseDto,
  })
  sale: SaleResponseDto;

  @ApiProperty({
    description: 'Additional data for receipt formatting and printing',
    type: ReceiptDataDto,
  })
  receiptData: ReceiptDataDto;
}

// Query DTOs for filtering and pagination
export class SalesQueryDto {
  @ApiPropertyOptional({
    description: 'Date range start (YYYY-MM-DD)',
    example: '2024-12-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date range end (YYYY-MM-DD)',
    example: '2024-12-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'],
  })
  @IsOptional()
  @IsEnum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'])
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Filter by sale status',
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
  })
  @IsOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer name (partial match)',
    example: 'John',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Filter by sale number',
    example: 'SAL-20241201-0001',
  })
  @IsOptional()
  @IsString()
  saleNumber?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: [
      'createdAt',
      'updatedAt',
      'totalAmount',
      'finalAmount',
      'saleNumber',
    ],
  })
  @IsOptional()
  @IsEnum([
    'createdAt',
    'updatedAt',
    'totalAmount',
    'finalAmount',
    'saleNumber',
  ])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class SalesPaginatedResponseDto {
  @ApiProperty({
    description: 'Array of sales',
    type: [SaleResponseDto],
    isArray: true,
  })
  data: SaleResponseDto[];

  @ApiProperty({
    description: 'Total number of sales matching the criteria',
    example: 150,
    type: 'integer',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 15,
    type: 'integer',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  totalPages: number;

  @ApiProperty({
    description: 'Indicates if there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Indicates if there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;
}

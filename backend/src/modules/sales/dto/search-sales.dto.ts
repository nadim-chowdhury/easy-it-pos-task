import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class SearchSalesDto {
  @ApiPropertyOptional({
    description: 'Search term for sale number, customer name, or notes',
    example: 'SAL-20241201 OR John Doe OR gift wrap',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  q?: string; // Changed from searchTerm to q

  @ApiPropertyOptional({
    description:
      'Search term for sale number, customer name, or notes (alias for q)',
    example: 'SAL-20241201 OR John Doe OR gift wrap',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  searchTerm?: string; // Keep this for backward compatibility

  @ApiPropertyOptional({
    description: 'Customer name to search for',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number to search for',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Sale number to search for',
    example: 'SAL-20241201-0001',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  saleNumber?: string;

  @ApiPropertyOptional({
    description: 'Payment method filter',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Start date for date range filter (ISO 8601 format)',
    example: '2024-12-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for date range filter (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Minimum total amount',
    example: 50.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum total amount',
    example: 1000.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Cashier/User ID who created the sale',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    default: 'createdAt',
    enum: [
      'createdAt',
      'updatedAt',
      'finalAmount',
      'saleNumber',
      'customerName',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

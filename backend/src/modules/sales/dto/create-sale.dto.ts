import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
  ArrayMinSize,
  IsPositive,
} from 'class-validator';

export class SaleItemDto {
  @ApiProperty({
    description: 'Unique identifier of the product to be sold',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Product ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product to be sold',
    example: 2,
    minimum: 1,
    maximum: 9999,
    type: 'integer',
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be greater than 0' })
  @Min(1, { message: 'Minimum quantity is 1' })
  @Max(9999, { message: 'Maximum quantity is 9999' })
  quantity: number;

  // This field is populated automatically by the service
  price?: number;
}

export class CreateSaleDto {
  @ApiProperty({
    description: 'Array of items to be included in the sale',
    type: [SaleItemDto],
    minItems: 1,
    example: [
      {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
      },
      {
        productId: '987fcdeb-51a4-43d2-b890-123456789abc',
        quantity: 1,
      },
    ],
  })
  @IsArray({ message: 'Items must be an array' })
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({
    description: 'Payment method used for the transaction',
    enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'],
    example: 'CASH',
    enumName: 'PaymentMethod',
  })
  @IsEnum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'], {
    message:
      'Payment method must be one of: CASH, CREDIT_CARD, DEBIT_CARD, DIGITAL_WALLET',
  })
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'DIGITAL_WALLET';

  @ApiPropertyOptional({
    description: 'Discount percentage applied to the total amount (0-100)',
    example: 10,
    minimum: 0,
    maximum: 100,
    type: 'number',
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount cannot be negative' })
  @Max(100, { message: 'Discount cannot exceed 100%' })
  discount?: number;

  @ApiPropertyOptional({
    description: 'Tax percentage applied to the discounted amount (0-100)',
    example: 8.5,
    minimum: 0,
    maximum: 100,
    type: 'number',
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Tax must be a number' })
  @Min(0, { message: 'Tax cannot be negative' })
  @Max(100, { message: 'Tax cannot exceed 100%' })
  tax?: number;

  @ApiPropertyOptional({
    description: 'Additional notes or comments for the sale',
    example: 'Customer requested gift wrapping',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  // This field is populated automatically from JWT token
  userId?: string;
}

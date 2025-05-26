import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Coca Cola 330ml',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MaxLength(255, { message: 'Product name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Unique product code/SKU',
    example: 'CC330',
    minLength: 1,
    maxLength: 50,
    pattern: '^[A-Z0-9-_]+$',
  })
  @IsString()
  @IsNotEmpty({ message: 'Product code is required' })
  @MaxLength(50, { message: 'Product code must not exceed 50 characters' })
  @Matches(/^[A-Z0-9\-_]+$/, {
    message:
      'Product code must contain only uppercase letters, numbers, hyphens, and underscores',
  })
  code: string;

  @ApiProperty({
    description: 'Detailed product description',
    example:
      'Classic Coca Cola in 330ml aluminum can. Refreshing carbonated soft drink.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Product price in currency units',
    example: 2.5,
    minimum: 0.01,
    type: 'number',
    format: 'float',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a number with maximum 2 decimal places' },
  )
  @IsPositive({ message: 'Price must be greater than 0' })
  price: number;

  @ApiProperty({
    description: 'Current stock quantity in inventory',
    example: 100,
    minimum: 0,
    type: 'integer',
  })
  @IsNumber({}, { message: 'Stock quantity must be a number' })
  @Min(0, { message: 'Stock quantity cannot be negative' })
  stockQty: number;

  @ApiProperty({
    description: 'Minimum stock level threshold for low stock alerts',
    example: 10,
    minimum: 0,
    required: false,
    type: 'integer',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum stock must be a number' })
  @Min(0, { message: 'Minimum stock cannot be negative' })
  minStock?: number;

  @ApiProperty({
    description: 'Product category for organization and filtering',
    example: 'Beverages',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Category must not exceed 100 characters' })
  category?: string;

  @ApiProperty({
    description: 'Product barcode (EAN, UPC, etc.)',
    example: '1234567890123',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Barcode must not exceed 100 characters' })
  barcode?: string;
}

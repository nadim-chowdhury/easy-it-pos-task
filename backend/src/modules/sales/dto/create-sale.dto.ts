import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
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
  // @IsUUID(4, { message: 'Product ID must be a valid UUID' })
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

  // Optional fields that can be sent from frontend but will be verified/overridden by service
  @ApiPropertyOptional({
    description: 'Unit price (will be verified against database)',
    example: 29.99,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be greater than 0' })
  price?: number;

  @ApiPropertyOptional({
    description: 'Product name (for frontend display, not validated)',
    example: 'Premium Cotton T-Shirt',
  })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({
    description: 'Product code (for frontend display, not validated)',
    example: 'TSH-001',
  })
  @IsOptional()
  @IsString()
  productCode?: string;
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
        price: 29.99,
        productName: 'Premium Cotton T-Shirt',
        productCode: 'TSH-001',
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
    enum: ['CASH', 'CARD', 'DIGITAL_WALLET'],
    example: 'CASH',
    enumName: 'PaymentMethod',
  })
  @IsEnum(['CASH', 'CARD', 'DIGITAL_WALLET'], {
    message: 'Payment method must be one of: CASH, CARD,  DIGITAL_WALLET',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  paymentMethod: 'CASH' | 'CARD' | 'DIGITAL_WALLET';

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Customer name must be a string' })
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+1 (555) 123-4567',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Customer phone must be a string' })
  customerPhone?: string;

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
    description: 'Tax amount in currency (alternative to tax percentage)',
    example: 4.52,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Tax amount must be a number' })
  @Min(0, { message: 'Tax amount cannot be negative' })
  taxAmount?: number;

  @ApiPropertyOptional({
    description: 'Subtotal amount (for verification purposes)',
    example: 59.98,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Subtotal must be a number' })
  @Min(0, { message: 'Subtotal cannot be negative' })
  subtotal?: number;

  @ApiPropertyOptional({
    description: 'Total amount (for verification purposes)',
    example: 64.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Total amount must be a number' })
  @Min(0, { message: 'Total amount cannot be negative' })
  totalAmount?: number;

  @ApiPropertyOptional({
    description: 'Amount received from customer',
    example: 70.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Amount received must be a number' })
  @Min(0, { message: 'Amount received cannot be negative' })
  amountReceived?: number;

  @ApiPropertyOptional({
    description: 'Change amount to give back to customer',
    example: 5.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Change amount must be a number' })
  @Min(0, { message: 'Change amount cannot be negative' })
  changeAmount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes or comments for the sale',
    example: 'Customer requested gift wrapping',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  // Remove userId from DTO - it should be extracted from JWT token only
  // The service will get userId from the authorization header
}

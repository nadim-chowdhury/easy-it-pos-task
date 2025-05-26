import { ApiProperty } from '@nestjs/swagger';
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
} from 'class-validator';

export class SaleItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  price: number;
}

export class CreateSaleDto {
  @ApiProperty({ description: 'Sale items', type: [SaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({
    description: 'Payment method',
    enum: ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'],
    example: 'CASH',
  })
  @IsEnum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'])
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'DIGITAL_WALLET';

  @ApiProperty({
    description: 'Discount percentage',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @ApiProperty({ description: 'Tax percentage', example: 8.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tax?: number;

  @ApiProperty({ description: 'Sale notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  userId: string;
}

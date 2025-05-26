import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Unique product identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Coca Cola 330ml',
  })
  name: string;

  @ApiProperty({
    description: 'Unique product code/SKU',
    example: 'CC330',
  })
  code: string;

  @ApiProperty({
    description: 'Detailed product description',
    example: 'Classic Coca Cola in 330ml aluminum can',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Product price in currency units',
    example: 2.5,
    type: 'number',
    format: 'float',
  })
  price: number;

  @ApiProperty({
    description: 'Current stock quantity in inventory',
    example: 100,
    type: 'integer',
  })
  stockQty: number;

  @ApiProperty({
    description: 'Minimum stock level threshold for alerts',
    example: 10,
    type: 'integer',
  })
  minStock: number;

  @ApiProperty({
    description: 'Product category',
    example: 'Beverages',
    nullable: true,
  })
  category?: string;

  @ApiProperty({
    description: 'Product barcode',
    example: '1234567890123',
    nullable: true,
  })
  barcode?: string;

  @ApiProperty({
    description: 'Product active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Indicates if product stock is below minimum threshold',
    example: false,
  })
  isLowStock: boolean;

  @ApiProperty({
    description: 'Product creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Product last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}

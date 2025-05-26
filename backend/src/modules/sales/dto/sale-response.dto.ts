import { ApiProperty } from '@nestjs/swagger';

export class SaleItemResponseDto {
  @ApiProperty({ description: 'Sale item ID' })
  id: string;

  @ApiProperty({ description: 'Product quantity' })
  quantity: number;

  @ApiProperty({ description: 'Unit price of the product', type: 'number' })
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item', type: 'number' })
  total: number;

  @ApiProperty({ description: 'Product details' })
  product: {
    id: string;
    name: string;
    code: string;
    price: number;
  };
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'User email' })
  email: string;
}

export class SaleResponseDto {
  @ApiProperty({ description: 'Sale ID' })
  id: string;

  @ApiProperty({ description: 'Unique sale number' })
  saleNumber: string;

  @ApiProperty({
    description: 'Total amount before tax and discount',
    type: 'number',
  })
  totalAmount: number;

  @ApiProperty({ description: 'Tax amount', type: 'number' })
  tax: number;

  @ApiProperty({ description: 'Discount amount', type: 'number' })
  discount: number;

  @ApiProperty({
    description: 'Final amount after tax and discount',
    type: 'number',
  })
  finalAmount: number;

  @ApiProperty({
    description: 'Payment method used',
    enum: ['CASH', 'CARD', 'MOBILE'],
  })
  paymentMethod: string;

  @ApiProperty({
    description: 'Sale status',
    enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Sale creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Sale last update date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'User who created the sale',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({ description: 'Sale items', type: [SaleItemResponseDto] })
  items: SaleItemResponseDto[];
}

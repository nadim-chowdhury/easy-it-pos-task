import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stockQty: number;

  @ApiProperty()
  minStock: number;

  @ApiProperty({ required: false })
  category?: string;

  @ApiProperty({ required: false })
  barcode?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isLowStock: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

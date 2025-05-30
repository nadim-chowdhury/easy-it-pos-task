import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    description: 'Product name',
    example: 'Coca Cola Zero 330ml',
    required: false,
    minLength: 1,
    maxLength: 255,
  })
  name?: string;

  @ApiProperty({
    description: 'Unique product code/SKU',
    example: 'CCZ330',
    required: false,
    minLength: 1,
    maxLength: 50,
    pattern: '^[A-Z0-9-_]+$',
  })
  code?: string;

  @ApiProperty({
    description: 'Detailed product description',
    example: 'Sugar-free Coca Cola in 330ml aluminum can',
    required: false,
    maxLength: 1000,
  })
  description?: string;

  @ApiProperty({
    description: 'Product price in currency units',
    example: 2.75,
    required: false,
    minimum: 0.01,
    type: 'number',
    format: 'float',
  })
  price?: number;

  @ApiProperty({
    description: 'Current stock quantity in inventory',
    example: 150,
    required: false,
    minimum: 0,
    type: 'integer',
  })
  stockQty?: number;

  @ApiProperty({
    description: 'Minimum stock level threshold for low stock alerts',
    example: 15,
    required: false,
    minimum: 0,
    type: 'integer',
  })
  minStock?: number;

  @ApiProperty({
    description: 'Product category for organization and filtering',
    example: 'Diet Beverages',
    required: false,
    maxLength: 100,
  })
  category?: string;

  @ApiProperty({
    description: 'Product barcode (EAN, UPC, etc.)',
    example: '1234567890124',
    required: false,
    maxLength: 100,
  })
  barcode?: string;

  // @ApiProperty({
  //   description: 'Array of product image URLs',
  //   example: [
  //     'https://res.cloudinary.com/your-cloud/image/upload/v123/products/image1.jpg',
  //     'https://res.cloudinary.com/your-cloud/image/upload/v123/products/image2.jpg',
  //   ],
  //   required: false,
  //   type: [String],
  //   maxItems: 5,
  // })
  // @IsOptional()
  // @IsArray()
  // @IsUrl({}, { each: true, message: 'Each image must be a valid URL' })
  // images?: string[];

  @ApiProperty({
    description: 'Main product image URL',
    example:
      'https://res.cloudinary.com/your-cloud/image/upload/v123/products/image1.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Main image must be a valid URL' })
  mainImage?: string;
}

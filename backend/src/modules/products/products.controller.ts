import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  ParseUUIDPipe,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiExtraModels,
  ApiConsumes,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { FileInterceptor } from '@nestjs/platform-express';

import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from './dto/pagination.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Define custom response DTOs for Swagger
class PaginatedProductsResponse {
  data: ProductResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy: string;
    sortOrder: string;
  };
}

class SearchProductsResponse {
  data: ProductResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  query: string;
}

class LowStockProductsResponse {
  data: ProductResponseDto[];
  count: number;
}

class StockUpdateDto {
  quantity: number;
  reason: string;
}

class DeleteProductResponse {
  message: string;
}

@ApiTags('Products')
@ApiExtraModels(
  ProductResponseDto,
  CreateProductDto,
  UpdateProductDto,
  PaginationDto,
  SearchProductsDto,
  PaginatedProductsResponse,
  SearchProductsResponse,
  LowStockProductsResponse,
  StockUpdateDto,
  DeleteProductResponse,
)
@Controller('products')
@UseGuards(ThrottlerGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a new product in the inventory system. Optionally accepts an image file. Requires authentication.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Coca Cola 330ml' },
        code: { type: 'string', example: 'CC330' },
        description: {
          type: 'string',
          example: 'Classic Coca Cola in 330ml can',
        },
        price: { type: 'number', example: 2.5 },
        stockQty: { type: 'number', example: 100 },
        minStock: { type: 'number', example: 10 },
        category: { type: 'string', example: 'Beverages' },
        barcode: { type: 'string', example: '1234567890123' },
        createdBy: { type: 'string', example: 'user-id' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Product image file (optional)',
        },
      },
      required: ['name', 'code', 'price', 'stockQty'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Product with this code already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto, image);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // Cache for 1 minute
  @ApiOperation({
    summary: 'Get all products with pagination and filtering',
    description:
      'Retrieves a paginated list of products with optional filtering and sorting capabilities.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 12,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
    enum: ['createdAt', 'updatedAt', 'name', 'price'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in product name and description',
    example: 'coca cola',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
    example: 'Beverages',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price filter',
    example: 1.0,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price filter',
    example: 10.0,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get('search')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) // Cache for 30 seconds
  @ApiOperation({
    summary: 'Search products by name, code, or description',
    description:
      'Search for products using a query string that matches product name, code, or description.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query string (minimum 1 character)',
    type: String,
    example: 'coca',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products found successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search parameters',
  })
  async search(@Query() searchDto: SearchProductsDto) {
    return this.productsService.search(searchDto);
  }

  @Get('low-stock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get products with low stock',
    description:
      'Retrieves all products that have stock quantity at or below the low stock threshold (10 units).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Low stock products retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to fetch low stock products',
  })
  async getLowStockProducts() {
    return this.productsService.getLowStockProducts();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120) // Cache for 2 minutes
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieves a single product by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product found successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update product by ID',
    description:
      'Updates an existing product. All fields are optional in the update payload. Optionally accepts an image file.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Coca Cola Zero 330ml' },
        code: { type: 'string', example: 'CCZ330' },
        description: {
          type: 'string',
          example: 'Sugar-free Coca Cola in 330ml can',
        },
        price: { type: 'number', example: 2.75 },
        stockQty: { type: 'number', example: 150 },
        minStock: { type: 'number', example: 15 },
        category: { type: 'string', example: 'Diet Beverages' },
        barcode: { type: 'string', example: '1234567890124' },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Product image file (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Product code already exists (when updating code)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto, image);
  }

  @Put(':id/stock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update product stock quantity',
    description:
      'Updates the stock quantity for a specific product with a reason for the change.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'Stock update information',
    schema: {
      type: 'object',
      properties: {
        quantity: {
          type: 'number',
          description: 'New stock quantity (must be non-negative)',
          example: 150,
          minimum: 0,
        },
        reason: {
          type: 'string',
          description: 'Reason for stock update',
          example: 'New inventory received',
        },
      },
      required: ['quantity', 'reason'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid stock quantity (negative values not allowed)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() stockUpdate: { quantity: number; reason: string },
  ) {
    return this.productsService.updateStock(
      id,
      stockUpdate.quantity,
      stockUpdate.reason,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete product by ID',
    description:
      'Soft deletes a product by setting isActive to false. The product remains in the database but is hidden from active queries.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Failed to delete product or cannot delete product with sales history',
  })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

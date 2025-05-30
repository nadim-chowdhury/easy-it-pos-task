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
  UploadedFiles,
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
  getSchemaPath,
  ApiConsumes,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

import { ProductsService } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationDto } from './dto/pagination.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

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
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a new product in the inventory system. Requires authentication.',
  })
  @ApiBody({
    type: CreateProductDto,
    description: 'Product data to create',
    examples: {
      example1: {
        summary: 'Beverage Product',
        description: 'Example of creating a beverage product',
        value: {
          name: 'Coca Cola 330ml',
          code: 'CC330',
          description: 'Classic Coca Cola in 330ml can',
          price: 2.5,
          stockQty: 100,
          minStock: 10,
          category: 'Beverages',
          barcode: '1234567890123',
        },
      },
      example2: {
        summary: 'Snack Product',
        description: 'Example of creating a snack product',
        value: {
          name: 'Potato Chips Original',
          code: 'PC001',
          description: 'Crispy potato chips with original flavor',
          price: 1.99,
          stockQty: 50,
          minStock: 5,
          category: 'Snacks',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: ProductResponseDto,
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Coca Cola 330ml',
        code: 'CC330',
        description: 'Classic Coca Cola in 330ml can',
        price: 2.5,
        stockQty: 100,
        minStock: 10,
        category: 'Beverages',
        barcode: '1234567890123',
        isActive: true,
        isLowStock: false,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'name should not be empty',
          'price must be a positive number',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Product with this code already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'Product with this code already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto);
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
    enum: ['createdAt', 'updatedAt', 'name', 'price', 'rating'],
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
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Coca Cola 330ml',
            code: 'CC330',
            description: 'Classic Coca Cola in 330ml can',
            price: 2.5,
            stockQty: 100,
            minStock: 10,
            category: 'Beverages',
            barcode: '1234567890123',
            isActive: true,
            isLowStock: false,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
        filters: {
          search: null,
          category: null,
          minPrice: null,
          maxPrice: null,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
    schema: {
      example: {
        statusCode: 400,
        message: 'Database error: Invalid sort field',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to fetch products',
        error: 'Internal Server Error',
      },
    },
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
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Coca Cola 330ml',
            code: 'CC330',
            description: 'Classic Coca Cola in 330ml can',
            price: 2.5,
            stockQty: 100,
            minStock: 10,
            category: 'Beverages',
            barcode: '1234567890123',
            isActive: true,
            isLowStock: false,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        query: 'coca',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search parameters',
    schema: {
      example: {
        statusCode: 400,
        message: 'Search query is required',
        error: 'Bad Request',
      },
    },
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
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Coca Cola 330ml',
            code: 'CC330',
            description: 'Classic Coca Cola in 330ml can',
            price: 2.5,
            stockQty: 5,
            minStock: 10,
            category: 'Beverages',
            barcode: '1234567890123',
            isActive: true,
            isLowStock: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        count: 1,
      },
    },
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
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Coca Cola 330ml',
        code: 'CC330',
        description: 'Classic Coca Cola in 330ml can',
        price: 2.5,
        stockQty: 100,
        minStock: 10,
        category: 'Beverages',
        barcode: '1234567890123',
        isActive: true,
        isLowStock: false,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Product not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      },
    },
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update product by ID',
    description:
      'Updates an existing product. All fields are optional in the update payload.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateProductDto,
    description: 'Product update data (all fields optional)',
    examples: {
      updateName: {
        summary: 'Update product name',
        description: 'Update only the product name',
        value: {
          name: 'Coca Cola Zero 330ml',
        },
      },
      updatePrice: {
        summary: 'Update product price',
        description: 'Update only the product price',
        value: {
          price: 2.75,
        },
      },
      updateMultiple: {
        summary: 'Update multiple fields',
        description: 'Update multiple product fields',
        value: {
          name: 'Coca Cola Zero 330ml',
          price: 2.75,
          description: 'Sugar-free Coca Cola in 330ml can',
          stockQty: 150,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: ProductResponseDto,
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Coca Cola Zero 330ml',
        code: 'CC330',
        description: 'Sugar-free Coca Cola in 330ml can',
        price: 2.75,
        stockQty: 150,
        minStock: 10,
        category: 'Beverages',
        barcode: '1234567890123',
        isActive: true,
        isLowStock: false,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T11:45:00.000Z',
      },
    },
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
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto);
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
    examples: {
      restock: {
        summary: 'Restock inventory',
        description: 'Adding new stock after receiving inventory',
        value: {
          quantity: 150,
          reason: 'New inventory received from supplier',
        },
      },
      adjustment: {
        summary: 'Stock adjustment',
        description: 'Adjusting stock due to damaged goods',
        value: {
          quantity: 95,
          reason: 'Damaged goods removed from inventory',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock updated successfully',
    type: ProductResponseDto,
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Coca Cola 330ml',
        code: 'CC330',
        description: 'Classic Coca Cola in 330ml can',
        price: 2.5,
        stockQty: 150,
        minStock: 10,
        category: 'Beverages',
        barcode: '1234567890123',
        isActive: true,
        isLowStock: false,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
      },
    },
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
    schema: {
      example: {
        message: 'Product deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Product not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to delete product',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete product with sales history',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Cannot delete product that has been sold. Product has sales history and must be kept for data integrity.',
        error: 'Bad Request',
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a single product image',
    description: 'Uploads a single image to Cloudinary and returns the URL',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (JPEG, PNG, WebP)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Image uploaded successfully',
    schema: {
      example: {
        imageUrl:
          'https://res.cloudinary.com/your-cloud/image/upload/v123/products/image.jpg',
      },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.uploadImage(file);
  }

  @Post('upload-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload multiple product images',
    description: 'Uploads up to 5 images to Cloudinary and returns the URLs',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files to upload (max 5 files)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Images uploaded successfully',
    schema: {
      example: {
        imageUrls: [
          'https://res.cloudinary.com/your-cloud/image/upload/v123/products/image1.jpg',
          'https://res.cloudinary.com/your-cloud/image/upload/v123/products/image2.jpg',
        ],
      },
    },
  })
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.productsService.uploadImages(files);
  }

  @Post(':id/upload-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload and attach images to existing product',
    description:
      'Uploads images and directly attaches them to an existing product',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: String,
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files to upload and attach',
        },
        replaceExisting: {
          type: 'boolean',
          description: 'Whether to replace existing images or append',
          default: false,
        },
      },
    },
  })
  async uploadProductImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('replaceExisting') replaceExisting: boolean = false,
  ) {
    return this.productsService.uploadProductImages(id, files, replaceExisting);
  }

  @Delete(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Remove images from product',
    description:
      'Removes specified images from a product and deletes them from Cloudinary',
  })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    type: String,
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of image URLs to remove',
        },
      },
      required: ['imageUrls'],
    },
  })
  async removeProductImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('imageUrls') imageUrls: string[],
  ) {
    return this.productsService.removeProductImages(id, imageUrls);
  }
}

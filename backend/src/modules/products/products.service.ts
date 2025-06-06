import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginationDto } from './dto/pagination.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    imageFile?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    try {
      // Check if product code already exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { code: createProductDto.code },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this code already exists');
      }

      // Upload image if provided
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await this.cloudinaryService.uploadImage(
          imageFile,
          'products',
        );
      }

      const product = await this.prisma.product.create({
        data: {
          ...createProductDto,
          price: Number(createProductDto.price),
          imageUrl,
        },
      });

      // Log initial stock movement
      if (product.stockQty > 0) {
        this.logStockMovement(
          product.id,
          'PURCHASE',
          product.stockQty,
          0,
          product.stockQty,
          'Initial stock',
        );
      }

      this.logger.log(`Product created: ${product.name} (${product.code})`);
      return this.mapToResponseDto(product);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating product', error);
      throw new BadRequestException('Failed to create product');
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    imageFile?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    try {
      const existingProduct = await this.findOne(id);

      // Check for code conflicts if code is being updated
      if (
        updateProductDto.code &&
        updateProductDto.code !== existingProduct.code
      ) {
        const codeExists = await this.prisma.product.findFirst({
          where: {
            code: updateProductDto.code,
            id: { not: id },
            isActive: true,
          },
        });

        if (codeExists) {
          throw new ConflictException('Product with this code already exists');
        }
      }

      const updateData: any = { ...updateProductDto };
      if (updateProductDto.price !== undefined) {
        updateData.price = Number(updateProductDto.price);
      }

      // Handle image updates
      if (imageFile) {
        // Delete old image if exists
        if (existingProduct.imageUrl) {
          await this.cloudinaryService.deleteImage(existingProduct.imageUrl);
        }
        // Upload new image
        updateData.imageUrl = await this.cloudinaryService.uploadImage(
          imageFile,
          'products',
        );
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Product updated: ${product.name} (${product.code})`);
      return this.mapToResponseDto(product);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error updating product ${id}`, error);
      throw new BadRequestException('Failed to update product');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      category,
      minPrice,
      maxPrice,
    } = paginationDto;

    // Validate pagination parameters
    const validatedPage = Math.max(1, Math.floor(page));
    const validatedLimit = Math.min(Math.max(1, Math.floor(limit)), 100); // Cap at 100
    const skip = (validatedPage - 1) * validatedLimit;

    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'price'];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    try {
      // Build dynamic where clause
      const whereClause: any = { isActive: true };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        whereClause.category = category;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.price = {};
        if (minPrice !== undefined) whereClause.price.gte = Number(minPrice);
        if (maxPrice !== undefined) whereClause.price.lte = Number(maxPrice);
      }

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: whereClause,
          skip,
          take: validatedLimit,
          orderBy: { [validSortBy]: validSortOrder },
        }),
        this.prisma.product.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / validatedLimit);

      return {
        data: products.map((product) => this.mapToResponseDto(product)),
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages,
          hasNext: validatedPage < totalPages,
          hasPrev: validatedPage > 1,
        },
        filters: {
          search,
          category,
          minPrice,
          maxPrice,
          sortBy: validSortBy,
          sortOrder: validSortOrder,
        },
      };
    } catch (error: any) {
      this.logger.error('Error fetching products', {
        error: error.message,
        stack: error.stack,
        pagination: { page: validatedPage, limit: validatedLimit },
      });

      // Check if it's a known Prisma error
      if (error.code && typeof error.code === 'string') {
        throw new BadRequestException(`Database error: ${error.message}`);
      }

      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async search(searchDto: SearchProductsDto) {
    const { q, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length < 1) {
      throw new BadRequestException('Search query is required');
    }

    try {
      const searchQuery = q.trim();
      const whereCondition = {
        isActive: true,
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' as const } },
          { code: { contains: searchQuery, mode: 'insensitive' as const } },
          {
            description: {
              contains: searchQuery,
              mode: 'insensitive' as const,
            },
          },
        ],
      };

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: [{ name: 'asc' }, { code: 'asc' }],
        }),
        this.prisma.product.count({ where: whereCondition }),
      ]);

      return {
        data: products.map((product) => this.mapToResponseDto(product)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        query: searchQuery,
      };
    } catch (error) {
      this.logger.error('Error searching products', error);
      throw new BadRequestException('Failed to search products');
    }
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.findFirst({
        where: { id, isActive: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return this.mapToResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding product ${id}`, error);
      throw new BadRequestException('Failed to find product');
    }
  }

  async findByCode(code: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.findFirst({
        where: { code, isActive: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return this.mapToResponseDto(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding product by code ${code}`, error);
      throw new BadRequestException('Failed to find product');
    }
  }

  async updateStock(id: string, quantity: number, reason: string) {
    if (quantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    try {
      const product = await this.findOne(id);
      const previousQty = product.stockQty;

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: { stockQty: quantity },
      });

      // Log stock movement
      const movementType = quantity > previousQty ? 'PURCHASE' : 'ADJUSTMENT';
      this.logStockMovement(
        id,
        movementType,
        Math.abs(quantity - previousQty),
        previousQty,
        quantity,
        reason,
      );

      this.logger.log(
        `Stock updated for ${product.name}: ${previousQty} → ${quantity}`,
      );
      return this.mapToResponseDto(updatedProduct);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error updating stock for product ${id}`, error);
      throw new BadRequestException('Failed to update stock');
    }
  }

  async getLowStockProducts() {
    try {
      // Since minStock is not in the schema, we'll use a default threshold of 10
      const lowStockThreshold = 10;

      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          stockQty: { lte: lowStockThreshold },
        },
        orderBy: { stockQty: 'asc' },
      });

      return {
        data: products.map((product) => this.mapToResponseDto(product)),
        count: products.length,
      };
    } catch (error) {
      this.logger.error('Error fetching low stock products', error);
      throw new BadRequestException('Failed to fetch low stock products');
    }
  }

  async remove(id: string) {
    try {
      const product = await this.findOne(id);

      // Check if product has been sold (has associated sale items)
      const soldItems = await this.prisma.saleItem.findFirst({
        where: { productId: id },
        select: { id: true }, // Only select id for performance
      });

      if (soldItems) {
        throw new BadRequestException(
          'Cannot delete product that has been sold. Product has sales history and must be kept for data integrity.',
        );
      }

      // Delete image from Cloudinary if exists
      if (product.imageUrl) {
        await this.cloudinaryService.deleteImage(product.imageUrl);
      }

      // Soft delete only if product hasn't been sold
      await this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Product deleted: ${product.name} (${product.code})`);
      return { message: 'Product deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error deleting product ${id}`, error);
      throw new BadRequestException('Failed to delete product');
    }
  }
  // Helper method to reduce stock during sales
  async reduceStock(productId: string, quantity: number, saleId?: string) {
    try {
      const product = await this.findOne(productId);

      if (product.stockQty < quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stockQty}, Required: ${quantity}`,
        );
      }

      const newQty = product.stockQty - quantity;
      const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: { stockQty: newQty },
      });

      // Log stock movement
      this.logStockMovement(
        productId,
        'SALE',
        quantity,
        product.stockQty,
        newQty,
        'Product sold',
        saleId,
      );

      return updatedProduct;
    } catch (error) {
      this.logger.error(`Error reducing stock for product ${productId}`, error);
      throw error;
    }
  }

  // Method to increase stock (for returns or adjustments)
  async increaseStock(
    productId: string,
    quantity: number,
    reason: string,
    reference?: string,
  ) {
    try {
      const product = await this.findOne(productId);
      const newQty = product.stockQty + quantity;

      const updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: { stockQty: newQty },
      });

      // Log stock movement
      this.logStockMovement(
        productId,
        'RETURN',
        quantity,
        product.stockQty,
        newQty,
        reason,
        reference,
      );

      return updatedProduct;
    } catch (error) {
      this.logger.error(
        `Error increasing stock for product ${productId}`,
        error,
      );
      throw error;
    }
  }

  // Get product stock movements history
  async getStockMovements(productId: string, page = 1, limit = 10) {
    try {
      await this.findOne(productId); // Validate product exists

      const skip = (page - 1) * limit;

      // Since StockMovement model doesn't exist in your schema,
      // we'll return empty data for now
      // You need to create a StockMovement model in your schema
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error fetching stock movements for product ${productId}`,
        error,
      );
      throw new BadRequestException('Failed to fetch stock movements');
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<{ imageUrl: string }> {
    try {
      const imageUrl = await this.cloudinaryService.uploadImage(
        file,
        'products',
      );
      return { imageUrl };
    } catch (error) {
      this.logger.error('Error uploading image', error);
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async uploadImages(
    files: Express.Multer.File[],
  ): Promise<{ imageUrls: string[] }> {
    try {
      const imageUrls = await this.cloudinaryService.uploadMultipleImages(
        files,
        'products',
      );
      return { imageUrls };
    } catch (error) {
      this.logger.error('Error uploading images', error);
      throw new InternalServerErrorException('Failed to upload images');
    }
  }

  async uploadProductImages(
    id: string,
    files: Express.Multer.File[],
    replaceExisting: boolean = false,
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.findOne(id);

      // Upload new images
      const newImageUrls = await this.cloudinaryService.uploadMultipleImages(
        files,
        'products',
      );

      let updatedImageUrls: string[];

      if (replaceExisting) {
        // Delete existing images if replacing
        if (product.imageUrl) {
          await this.cloudinaryService.deleteImage(product.imageUrl);
        }
        // If you have multiple images stored, delete them here
        updatedImageUrls = newImageUrls;
      } else {
        // Append to existing images
        const existingUrls = product.imageUrl ? [product.imageUrl] : [];
        updatedImageUrls = [...existingUrls, ...newImageUrls];
      }

      // Update product with new image URL (using first image as primary)
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          imageUrl: updatedImageUrls[0] || null,
          // If you have an images array field, uncomment below:
          // images: updatedImageUrls
        },
      });

      this.logger.log(
        `Images uploaded for product: ${product.name} (${product.code})`,
      );
      return this.mapToResponseDto(updatedProduct);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error uploading images for product ${id}`, error);
      throw new InternalServerErrorException('Failed to upload product images');
    }
  }

  async removeProductImages(
    id: string,
    imageUrls: string[],
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.findOne(id);

      // Delete images from Cloudinary
      await Promise.all(
        imageUrls.map((url) => this.cloudinaryService.deleteImage(url)),
      );

      // Update product to remove the deleted image URLs
      let newImageUrl = product.imageUrl || null;

      // If the primary image is being removed, set to null
      if (imageUrls.includes(product.imageUrl)) {
        newImageUrl = null;
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          imageUrl: newImageUrl,
          // If you have an images array field, filter out the removed URLs:
          // images: existingImages.filter(url => !imageUrls.includes(url))
        },
      });

      this.logger.log(
        `Images removed from product: ${product.name} (${product.code})`,
      );
      return this.mapToResponseDto(updatedProduct);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error removing images from product ${id}`, error);
      throw new InternalServerErrorException('Failed to remove product images');
    }
  }

  // Private helper methods
  private logStockMovement(
    productId: string,
    movementType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN',
    quantity: number,
    previousQty: number,
    newQty: number,
    reason: string,
    reference?: string,
  ): void {
    try {
      // Since StockMovement model doesn't exist in your schema,
      // we'll just log it for now
      // You need to create a StockMovement model in your schema
      this.logger.log(
        `Stock Movement: Product ${productId}, Type: ${movementType}, Qty: ${quantity}, Previous: ${previousQty}, New: ${newQty}, Reason: ${reason}${reference ? `, Reference: ${reference}` : ''}`,
      );
    } catch (error) {
      this.logger.error('Error logging stock movement', error);
      // Don't throw here to avoid breaking the main operation
    }
  }

  private mapToResponseDto(product: any): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      price: Number(product.price),
      stockQty: product.stockQty,
      minStock: 10, // Default value since minStock is not in schema
      category: product.category || 'General', // Default category if not in schema
      barcode: product.barcode || null, // Default if not in schema
      imageUrl: product.imageUrl || null, // Include imageUrl from the product
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      isLowStock: product.stockQty <= 10, // Using default threshold
    };
  }
}

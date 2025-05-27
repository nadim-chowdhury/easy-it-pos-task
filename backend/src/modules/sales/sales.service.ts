import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../database/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { PaginationDto } from '../products/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';
import { SearchSalesDto } from './dto/search-sales.dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly jwtService: JwtService, // Add JWT service
    private readonly configService: ConfigService,
  ) {}

  async create(
    createSaleDto: CreateSaleDto,
    accessToken: string, // Change from userId to accessToken
  ): Promise<SaleResponseDto> {
    const {
      items,
      paymentMethod,
      customerName,
      customerPhone,
      discount = 0,
      tax = 0,
      taxAmount,
      subtotal,
      totalAmount: providedTotal,
      amountReceived,
      changeAmount,
      notes,
    } = createSaleDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Sale must contain at least one item');
    }

    const token = accessToken.replace(/^Bearer\s+/i, '').trim();

    // Extract user from access token
    const userId = await this.getUserIdFromToken(token);
    console.log(' userId:', userId);

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validate products and calculate totals
        let calculatedSubtotal = 0;
        const saleItems: Array<{
          productId: string;
          quantity: number;
          price: number;
        }> = [];

        // Validate each item and calculate subtotal
        for (const item of items) {
          const product = await this.productsService.findOne(item.productId);

          if (product.stockQty < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${product.name}. Available: ${product.stockQty}, Required: ${item.quantity}`,
            );
          }

          // Use database price (authoritative source), not the price from request
          const unitPrice = Number(product.price);
          const itemTotal = unitPrice * item.quantity;
          calculatedSubtotal += itemTotal;

          // Optional: Verify the price sent from frontend matches database
          if (item.price && Math.abs(item.price - unitPrice) > 0.01) {
            this.logger.warn(
              `Price mismatch for product ${product.name}. Database: ${unitPrice}, Request: ${item.price}`,
            );
          }

          saleItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: unitPrice, // Always use database price
          });
        }

        // Optional: Verify subtotal if provided
        if (subtotal && Math.abs(subtotal - calculatedSubtotal) > 0.01) {
          this.logger.warn(
            `Subtotal mismatch. Calculated: ${calculatedSubtotal}, Provided: ${subtotal}`,
          );
        }

        // Calculate amounts using database values
        const discountAmount =
          discount > 0 ? (calculatedSubtotal * discount) / 100 : 0;
        const amountAfterDiscount = calculatedSubtotal - discountAmount;

        // Use taxAmount if provided, otherwise calculate from tax percentage
        let finalTaxAmount = 0;
        if (taxAmount !== undefined && taxAmount > 0) {
          finalTaxAmount = taxAmount;
        } else if (tax > 0) {
          finalTaxAmount = (amountAfterDiscount * tax) / 100;
        }

        const finalAmount = amountAfterDiscount + finalTaxAmount;

        // Optional: Verify total amount if provided
        if (providedTotal && Math.abs(providedTotal - finalAmount) > 0.01) {
          this.logger.warn(
            `Total amount mismatch. Calculated: ${finalAmount}, Provided: ${providedTotal}`,
          );
        }

        // Validate payment amounts for cash transactions
        if (paymentMethod === 'CASH') {
          if (amountReceived !== undefined && amountReceived < finalAmount) {
            throw new BadRequestException(
              `Insufficient payment. Required: ${finalAmount}, Received: ${amountReceived}`,
            );
          }

          if (changeAmount !== undefined && amountReceived !== undefined) {
            const calculatedChange = amountReceived - finalAmount;
            if (Math.abs(calculatedChange - changeAmount) > 0.01) {
              this.logger.warn(
                `Change amount mismatch. Calculated: ${calculatedChange}, Provided: ${changeAmount}`,
              );
            }
          }
        }

        // Generate sale number
        const saleNumber = await this.generateSaleNumber();

        // Create sale with customer information and user ID
        const saleData: any = {
          saleNumber,
          total: calculatedSubtotal,
          amountReceived: amountReceived,
          changeAmount: changeAmount,
          tax: finalTaxAmount,
          discount: discountAmount,
          finalAmount: finalAmount,
          paymentMethod,
          userId, // Now properly assign the user
          notes: notes,
          customerName: customerName, // Store directly in sale model
          customerPhone: customerPhone, // Store directly in sale model
          items: {
            create: saleItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: Number(item.price),
            })),
          },
        };
        console.log(saleData);

        const sale = await prisma.sale.create({
          data: saleData,
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
              },
            },
          },
        });

        // Reduce stock for each item
        for (const item of items) {
          await this.productsService.reduceStock(
            item.productId,
            item.quantity,
            sale.id,
          );
        }

        this.logger.log(
          `Sale created: ${sale.saleNumber} - Total: $${finalAmount} - Customer: ${customerName || 'N/A'} - Cashier: ${sale.user?.name}`,
        );
        return this.mapToResponseDto(sale);
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Error creating sale', error);
      throw new BadRequestException('Failed to create sale');
    }
  }

  // Enhanced getUserIdFromToken method with better error handling and logging
  private async getUserIdFromToken(accessToken: string): Promise<string> {
    console.log(' getUserIdFromToken ~ accessToken:', accessToken);
    try {
      this.logger.debug('Starting token validation process');

      // Log the raw token (first 20 chars for security)
      this.logger.debug(
        `Raw token received: ${accessToken.substring(0, 20)}...`,
      );

      // Remove 'Bearer ' prefix if present
      const token = accessToken.replace(/^Bearer\s+/i, '').trim();

      this.logger.debug(`Cleaned token: ${token.substring(0, 20)}...`);

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Verify and decode the JWT token
      let decoded;
      try {
        // decoded = this.jwtService.verify(token);
        decoded = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET') || 'your-secret-key',
        });

        this.logger.debug('Token successfully verified');
        this.logger.debug(`Token payload: ${JSON.stringify(decoded, null, 2)}`);
      } catch (jwtError) {
        this.logger.error('JWT verification failed:', jwtError.message);

        // Provide more specific error messages
        if (jwtError.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Token has expired');
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid token format');
        } else if (jwtError.name === 'NotBeforeError') {
          throw new UnauthorizedException('Token not active yet');
        } else {
          throw new UnauthorizedException(
            `Token validation failed: ${jwtError.message}`,
          );
        }
      }

      console.log(' getUserIdFromToken ~ decoded:', decoded);

      // Extract user ID from token payload - check standard claims first
      const userId = decoded.sub || decoded.userId || decoded.id;

      this.logger.debug(`Extracted userId: ${userId}`);

      if (!userId) {
        this.logger.error('Token payload missing user ID:', decoded);
        throw new UnauthorizedException(
          'Invalid token: user ID not found in payload',
        );
      }

      // Verify user exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isActive: true,
          email: true,
          username: true,
          role: true,
        },
      });

      if (!user) {
        this.logger.error(`User not found for ID: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        this.logger.error(`User account inactive for: ${user.email}`);
        throw new UnauthorizedException('User account is inactive');
      }

      this.logger.debug(
        `User validated successfully: ${user.email} (${user.role})`,
      );
      return userId;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Unexpected error in token validation:', error);
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async findAll(paginationDto: PaginationDto, accessToken?: string) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      // Optional: Filter by user if needed (for cashier-specific sales)
      let whereClause = {};
      if (accessToken) {
        const userId = await this.getUserIdFromToken(accessToken);
        console.log(' userId:', userId);
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        // If user is a cashier, only show their sales
        if (user?.role === 'CASHIER') {
          whereClause = { userId };
        }
        // Managers/Admins can see all sales
      }

      const [sales, total] = await Promise.all([
        this.prisma.sale.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    price: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
              },
            },
          },
        }),
        this.prisma.sale.count({ where: whereClause }),
      ]);

      return {
        data: sales.map((sale) => this.mapToResponseDto(sale)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching sales', error);
      throw new BadRequestException('Failed to fetch sales');
    }
  }

  async findOne(id: string): Promise<SaleResponseDto> {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              role: true,
            },
          },
        },
      });

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      return this.mapToResponseDto(sale);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error finding sale ${id}`, error);
      throw new BadRequestException('Failed to find sale');
    }
  }

  async searchSales(searchDto: SearchSalesDto, accessToken?: string) {
    const {
      q, // Accept 'q' parameter
      searchTerm, // Keep backward compatibility
      customerName,
      customerPhone,
      saleNumber,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      userId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchDto;

    const skip = (page - 1) * limit;

    try {
      // Build dynamic where clause
      const whereClause: any = {};

      // Use 'q' if provided, otherwise fall back to 'searchTerm' for backward compatibility
      const finalSearchTerm = q || searchTerm;

      // Text search across multiple fields
      if (finalSearchTerm) {
        whereClause.OR = [
          {
            saleNumber: {
              contains: finalSearchTerm,
              mode: 'insensitive',
            },
          },
          {
            customerName: {
              contains: finalSearchTerm,
              mode: 'insensitive',
            },
          },
          {
            customerPhone: {
              contains: finalSearchTerm,
              mode: 'insensitive',
            },
          },
          {
            notes: {
              contains: finalSearchTerm,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Specific field filters
      if (customerName) {
        whereClause.customerName = {
          contains: customerName,
          mode: 'insensitive',
        };
      }

      if (customerPhone) {
        whereClause.customerPhone = {
          contains: customerPhone,
          mode: 'insensitive',
        };
      }

      if (saleNumber) {
        whereClause.saleNumber = {
          contains: saleNumber,
          mode: 'insensitive',
        };
      }

      if (paymentMethod) {
        whereClause.paymentMethod = paymentMethod;
      }

      // Date range filter
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt.lte = new Date(endDate);
        }
      }

      // Amount range filter
      if (minAmount !== undefined || maxAmount !== undefined) {
        whereClause.finalAmount = {};
        if (minAmount !== undefined) {
          whereClause.finalAmount.gte = minAmount;
        }
        if (maxAmount !== undefined) {
          whereClause.finalAmount.lte = maxAmount;
        }
      }

      // User filter
      if (userId) {
        whereClause.userId = userId;
      }

      // Role-based filtering if access token is provided
      if (accessToken) {
        const currentUserId = await this.getUserIdFromToken(accessToken);
        const user = await this.prisma.user.findUnique({
          where: { id: currentUserId },
          select: { role: true },
        });

        // If user is a cashier, only show their sales (unless they're searching for someone else's sales and they have permission)
        if (user?.role === 'CASHIER' && !userId) {
          whereClause.userId = currentUserId;
        }
      }

      // Execute search query with count
      const [sales, total] = await Promise.all([
        this.prisma.sale.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    price: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                role: true,
              },
            },
          },
        }),
        this.prisma.sale.count({ where: whereClause }),
      ]);

      // Calculate summary statistics for the search results
      const summaryStats = await this.prisma.sale.aggregate({
        where: whereClause,
        _sum: {
          finalAmount: true,
          tax: true,
          discount: true,
        },
        _avg: {
          finalAmount: true,
        },
        _count: true,
      });

      return {
        data: sales.map((sale) => this.mapToResponseDto(sale)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalSales: summaryStats._count,
          totalRevenue: Number(summaryStats._sum.finalAmount ?? 0),
          averageOrderValue: Number(summaryStats._avg.finalAmount ?? 0),
          totalTax: Number(summaryStats._sum.tax ?? 0),
          totalDiscount: Number(summaryStats._sum.discount ?? 0),
        },
        searchCriteria: {
          searchTerm: finalSearchTerm, // Return the actual search term used
          q: finalSearchTerm, // Also include 'q' for consistency
          customerName,
          customerPhone,
          saleNumber,
          paymentMethod,
          startDate,
          endDate,
          minAmount,
          maxAmount,
          userId,
        },
      };
    } catch (error) {
      this.logger.error('Error searching sales', error);
      throw new BadRequestException('Failed to search sales');
    }
  }

  async getTodaySales(accessToken?: string) {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Optional: Filter by user role
      const whereClause: any = {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      };

      if (accessToken) {
        const userId = await this.getUserIdFromToken(accessToken);
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (user?.role === 'CASHIER') {
          whereClause.userId = userId;
        }
      }

      const [salesCount, totalRevenue, sales] = await Promise.all([
        this.prisma.sale.count({ where: whereClause }),
        this.prisma.sale.aggregate({
          where: whereClause,
          _sum: {
            finalAmount: true,
          },
        }),
        this.prisma.sale.findMany({
          where: whereClause,
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    price: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      return {
        summary: {
          salesCount,
          totalRevenue: Number(totalRevenue._sum.finalAmount ?? 0),
          averageOrderValue:
            salesCount > 0
              ? Number(totalRevenue._sum.finalAmount ?? 0) / salesCount
              : 0,
        },
        recentSales: sales.map((sale) => this.mapToResponseDto(sale)),
      };
    } catch (error) {
      this.logger.error("Error fetching today's sales", error);
      throw new BadRequestException("Failed to fetch today's sales");
    }
  }

  async getAnalytics(
    period: 'day' | 'week' | 'month' = 'day',
    accessToken?: string,
  ) {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
      }

      // Optional: Filter by user role
      const whereClause: any = {
        createdAt: { gte: startDate },
      };

      if (accessToken) {
        const userId = await this.getUserIdFromToken(accessToken);
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (user?.role === 'CASHIER') {
          whereClause.userId = userId;
        }
      }

      const [salesData, topProducts, paymentMethods] = await Promise.all([
        this.prisma.sale.aggregate({
          where: whereClause,
          _count: true,
          _sum: {
            finalAmount: true,
            tax: true,
            discount: true,
          },
          _avg: {
            finalAmount: true,
          },
        }),
        this.prisma.saleItem.groupBy({
          by: ['productId'],
          where: {
            sale: whereClause,
          },
          _sum: {
            quantity: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take: 10,
        }),
        this.prisma.sale.groupBy({
          by: ['paymentMethod'],
          where: whereClause,
          _count: true,
          _sum: {
            finalAmount: true,
          },
        }),
      ]);

      // Get product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, code: true, price: true },
          });
          return {
            product,
            quantitySold: item._sum.quantity,
            totalRevenue:
              Number(item._sum.quantity) * Number(product?.price || 0),
          };
        }),
      );

      return {
        period,
        totalSales: salesData._count,
        totalRevenue: Number(salesData._sum.finalAmount ?? 0),
        averageOrderValue: Number(salesData._avg.finalAmount ?? 0),
        totalTax: Number(salesData._sum.tax ?? 0),
        totalDiscount: Number(salesData._sum.discount ?? 0),
        topProducts: topProductsWithDetails,
        paymentMethodBreakdown: paymentMethods.map((pm) => ({
          method: pm.paymentMethod,
          count: pm._count,
          revenue: Number(pm._sum.finalAmount ?? 0),
        })),
      };
    } catch (error) {
      this.logger.error('Error fetching sales analytics', error);
      throw new BadRequestException('Failed to fetch analytics');
    }
  }

  async getReceipt(id: string) {
    try {
      const sale = await this.findOne(id);

      return {
        sale,
        receiptData: {
          companyName: 'POS System',
          address: '123 Business Street',
          phone: '+1 (555) 123-4567',
          email: 'info@possystem.com',
          website: 'www.possystem.com',
          receiptNumber: sale.saleNumber,
          dateTime: sale.createdAt,
          cashier: sale.user,
          customer: {
            name: sale.customerName,
            phone: sale.customerPhone,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error generating receipt for sale ${id}`, error);
      throw new BadRequestException('Failed to generate receipt');
    }
  }

  // Private helper methods
  private async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

    const lastSale = await this.prisma.sale.findFirst({
      where: {
        saleNumber: {
          startsWith: `SAL-${datePrefix}`,
        },
      },
      orderBy: {
        saleNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastSale) {
      const lastSequence = parseInt(lastSale.saleNumber.split('-')[2]) || 0;
      sequence = lastSequence + 1;
    }

    return `SAL-${datePrefix}-${sequence.toString().padStart(4, '0')}`;
  }

  private mapToResponseDto(sale: any): SaleResponseDto {
    return {
      id: sale.id,
      saleNumber: sale.saleNumber,
      totalAmount: Number(sale.total),
      tax: Number(sale.tax),
      discount: Number(sale.discount),
      finalAmount: Number(sale.finalAmount),
      paymentMethod: sale.paymentMethod,
      status: 'COMPLETED',
      notes: sale.notes,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      amountReceived: sale.amountReceived,
      changeAmount: sale.changeAmount,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      user: sale.user,
      items:
        sale.items?.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          total: Number(item.price) * item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            code: item.product.code,
            price: Number(item.product.price),
          },
        })) || [],
    };
  }
}

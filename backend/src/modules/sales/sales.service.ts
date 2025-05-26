import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../database/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { PaginationDto } from '../products/dto/pagination.dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    createSaleDto: CreateSaleDto,
    userId: string,
  ): Promise<SaleResponseDto> {
    const {
      items,
      paymentMethod,
      discount = 0,
      tax = 0,
      notes,
    } = createSaleDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Sale must contain at least one item');
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Validate products and calculate totals
        let totalAmount = 0;
        const saleItems: Array<{
          productId: string;
          quantity: number;
          price: number; // Changed: Use 'price' field name from SaleItem schema
        }> = [];

        for (const item of items) {
          const product = await this.productsService.findOne(item.productId);

          if (product.stockQty < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${product.name}. Available: ${product.stockQty}, Required: ${item.quantity}`,
            );
          }

          const itemTotal = Number(product.price) * item.quantity;
          totalAmount += itemTotal;

          saleItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: Number(product.price), // Changed: Use 'price' field
          });
        }

        // Calculate final amount
        const discountAmount = (totalAmount * discount) / 100;
        const taxAmount = ((totalAmount - discountAmount) * tax) / 100;
        const finalAmount = totalAmount - discountAmount + taxAmount;

        // Generate sale number
        const saleNumber = await this.generateSaleNumber();

        // Create sale
        const sale = await prisma.sale.create({
          data: {
            saleNumber,
            total: totalAmount, // Changed: Use 'total' field from schema
            tax: taxAmount,
            discount: discountAmount,
            finalAmount: finalAmount,
            paymentMethod,
            userId,
            items: {
              // Changed: Use 'items' relation name from schema
              create: saleItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: Number(item.price), // Changed: Use 'price' field from SaleItem schema
              })),
            },
          },
          include: {
            items: {
              // Changed: Use 'items' relation name
              include: {
                product: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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
          `Sale created: ${sale.saleNumber} - Total: $${finalAmount}`,
        );
        return this.mapToResponseDto(sale);
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error creating sale', error);
      throw new BadRequestException('Failed to create sale');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [sales, total] = await Promise.all([
        this.prisma.sale.findMany({
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            items: {
              // Changed: Use 'items' relation name
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
              },
            },
          },
        }),
        this.prisma.sale.count(),
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
            // Changed: Use 'items' relation name
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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

  async getTodaySales() {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const [salesCount, totalRevenue, sales] = await Promise.all([
        this.prisma.sale.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        }),
        this.prisma.sale.aggregate({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          _sum: {
            finalAmount: true,
          },
        }),
        this.prisma.sale.findMany({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
          include: {
            items: {
              // Changed: Use 'items' relation name
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
          totalRevenue: Number(totalRevenue._sum.finalAmount ?? 0), // Fixed: null safety
          averageOrderValue:
            salesCount > 0
              ? Number(totalRevenue._sum.finalAmount ?? 0) / salesCount // Fixed: null safety
              : 0,
        },
        recentSales: sales.map((sale) => this.mapToResponseDto(sale)),
      };
    } catch (error) {
      this.logger.error("Error fetching today's sales", error);
      throw new BadRequestException("Failed to fetch today's sales");
    }
  }

  async getAnalytics(period: 'day' | 'week' | 'month' = 'day') {
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

      const [salesData, topProducts, paymentMethods] = await Promise.all([
        this.prisma.sale.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
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
            sale: {
              createdAt: { gte: startDate },
            },
          },
          _sum: {
            quantity: true,
            // Removed total since SaleItem doesn't have this field
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
          where: {
            createdAt: { gte: startDate },
          },
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
              Number(item._sum.quantity) * Number(product?.price || 0), // Calculate total since SaleItem doesn't have total field
          };
        }),
      );

      return {
        period,
        totalSales: salesData._count,
        totalRevenue: Number(salesData._sum.finalAmount ?? 0), // Fixed: null safety
        averageOrderValue: Number(salesData._avg.finalAmount ?? 0), // Fixed: null safety
        totalTax: Number(salesData._sum.tax ?? 0), // Fixed: null safety
        totalDiscount: Number(salesData._sum.discount ?? 0), // Fixed: null safety
        topProducts: topProductsWithDetails,
        paymentMethodBreakdown: paymentMethods.map((pm) => ({
          method: pm.paymentMethod,
          count: pm._count,
          revenue: Number(pm._sum.finalAmount ?? 0), // Fixed: null safety
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
          cashier: sale.user, // Changed: use name instead of username
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
      totalAmount: Number(sale.total), // Changed: Use 'total' field from schema
      tax: Number(sale.tax),
      discount: Number(sale.discount),
      finalAmount: Number(sale.finalAmount),
      paymentMethod: sale.paymentMethod,
      status: 'COMPLETED', // Since schema doesn't have status, set a default
      notes: sale.notes,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      user: sale.user,
      items:
        sale.items?.map((item) => ({
          // Changed: Use 'items' relation name
          id: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.price), // Changed: Use 'price' field from SaleItem
          total: Number(item.price) * item.quantity, // Calculate total since SaleItem doesn't have total field
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

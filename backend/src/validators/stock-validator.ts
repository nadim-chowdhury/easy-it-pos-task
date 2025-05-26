import { Injectable } from '@nestjs/common';
import { PrismaService } from '../modules/database/prisma.service';
import { InsufficientStockException } from '../common/exceptions/business-exception';

@Injectable()
export class StockValidator {
  constructor(private prisma: PrismaService) {}

  async validateStockAvailability(
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, stockQty: true },
      });

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (product.stockQty < item.quantity) {
        throw new InsufficientStockException(
          product.name,
          item.quantity,
          product.stockQty,
        );
      }
    }
  }
}

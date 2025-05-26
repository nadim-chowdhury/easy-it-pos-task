import { Injectable } from '@nestjs/common';
import { PrismaService } from '../modules/database/prisma.service';

@Injectable()
export class ProductValidator {
  constructor(private prisma: PrismaService) {}

  async validateUniqueCode(code: string, excludeId?: string): Promise<boolean> {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !existingProduct;
  }

  async validateProductExists(id: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    return !!product;
  }
}

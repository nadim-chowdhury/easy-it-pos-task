import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { DatabaseModule } from '../database/database.module';
import { ProductsModule } from '../products/products.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule, ProductsModule, JwtModule.register({})],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../products/dto/pagination.dto';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(ThrottlerGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new sale (checkout)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sale completed successfully',
    type: SaleResponseDto,
  })
  async create(
    @Body() createSaleDto: CreateSaleDto,
    @Request() req,
  ): Promise<SaleResponseDto> {
    return this.salesService.create(createSaleDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all sales with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales retrieved successfully',
  })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.salesService.findAll(paginationDto);
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Get today's sales summary" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Today's sales summary retrieved successfully",
  })
  async getTodaySales() {
    return this.salesService.getTodaySales();
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get sales analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales analytics retrieved successfully',
  })
  async getAnalytics(
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.salesService.getAnalytics(period);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sale found successfully',
    type: SaleResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SaleResponseDto> {
    return this.salesService.findOne(id);
  }

  @Get(':id/receipt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get sale receipt data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Receipt data retrieved successfully',
  })
  async getReceipt(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.getReceipt(id);
  }
}

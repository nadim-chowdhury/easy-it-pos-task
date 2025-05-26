import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        error: 'Business Logic Error',
        message,
        statusCode,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

export class InsufficientStockException extends BusinessException {
  constructor(productName: string, requested: number, available: number) {
    super(
      `Insufficient stock for ${productName}. Requested: ${requested}, Available: ${available}`,
      HttpStatus.CONFLICT,
    );
  }
}

export class ProductNotFoundException extends BusinessException {
  constructor(identifier: string) {
    super(`Product not found: ${identifier}`, HttpStatus.NOT_FOUND);
  }
}

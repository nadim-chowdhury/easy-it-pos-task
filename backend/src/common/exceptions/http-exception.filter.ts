import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/response.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
        error = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as any;
        message = body.message || body.error || 'An error occurred';
        error = body.error || body.message || 'Http Exception';
      } else {
        message = 'An error occurred';
        error = 'Http Exception';
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Unknown error';
    }

    // Log the error with more context
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${error}`,
      exception instanceof Error ? exception.stack : 'No stack trace available',
    );

    const errorResponse = ApiResponse.error(message, error, request.url);

    response.status(status).json(errorResponse);
  }
}

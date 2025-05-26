import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ApiResponseInterface } from '../../utils/response.util';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseInterface<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseInterface<T>> {
    return next.handle().pipe(
      map((data: T): ApiResponseInterface<T> => {
        // Check if data is already wrapped in ApiResponse format
        if (this.isApiResponse(data)) {
          return data;
        }

        // Wrap raw data in ApiResponse format
        return ApiResponse.success(data, 'Operation completed successfully');
      }),
    );
  }

  /**
   * Type guard to check if data is already in ApiResponse format
   */
  private isApiResponse(data: any): data is ApiResponseInterface<any> {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.success === 'boolean' &&
      'message' in data &&
      'timestamp' in data &&
      'data' in data
    );
  }
}

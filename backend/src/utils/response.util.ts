export interface ApiResponseInterface<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path?: string;
}

export class ApiResponse {
  static success<T>(
    data?: T,
    message: string = 'Operation successful',
  ): ApiResponseInterface<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string = 'Operation failed',
    error?: string,
    path?: string,
  ): ApiResponseInterface {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Data retrieved successfully',
  ): ApiResponseInterface<{
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message,
      data: {
        items: data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}

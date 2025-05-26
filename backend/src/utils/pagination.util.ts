export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class PaginationUtil {
  static validateAndTransform(
    page: number = 1,
    limit: number = 10,
  ): PaginationParams {
    // Ensure page is at least 1
    const validPage = Math.max(1, Math.floor(page));

    // Ensure limit is between 1 and 100
    const validLimit = Math.max(1, Math.min(100, Math.floor(limit)));

    return {
      page: validPage,
      limit: validLimit,
    };
  }

  static getPrismaParams(page: number, limit: number): PaginationResult {
    const { page: validPage, limit: validLimit } = this.validateAndTransform(
      page,
      limit,
    );

    return {
      skip: (validPage - 1) * validLimit,
      take: validLimit,
    };
  }

  static createMeta(
    total: number,
    page: number,
    limit: number,
  ): PaginationMeta {
    const { page: validPage, limit: validLimit } = this.validateAndTransform(
      page,
      limit,
    );
    const totalPages = Math.ceil(total / validLimit);

    return {
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
      hasNext: validPage < totalPages,
      hasPrev: validPage > 1,
    };
  }
}

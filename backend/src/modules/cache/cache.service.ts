import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

// Extended interface to include Redis store methods
interface ExtendedCache extends Cache {
  store?: {
    keys(pattern: string): Promise<string[]>;
    reset(): Promise<void>;
  };
  reset?(): Promise<void>;
}

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: ExtendedCache) {}

  async get(key: string): Promise<any> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // Try different methods to reset cache
    if (this.cacheManager.reset) {
      await this.cacheManager.reset();
    } else if (this.cacheManager.store?.reset) {
      await this.cacheManager.store.reset();
    } else {
      // Fallback: manually delete all keys (for Redis)
      try {
        const keys = await this.getAllKeys();
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => this.cacheManager.del(key)));
        }
      } catch (error) {
        console.warn('Cache reset fallback failed:', error);
      }
    }
  }

  // Helper method to get all keys
  private async getAllKeys(): Promise<string[]> {
    if (this.cacheManager.store?.keys) {
      return this.cacheManager.store.keys('*');
    }
    return [];
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.cacheManager.store?.keys) {
        const keys = await this.cacheManager.store.keys(`${pattern}*`);
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => this.cacheManager.del(key)));
        }
      } else {
        console.warn(
          'Pattern invalidation not supported with current cache store',
        );
      }
    } catch (error) {
      console.error('Error invalidating cache pattern:', error);
    }
  }

  // Product-specific cache methods
  generateProductCacheKey(
    search?: string,
    page?: number,
    limit?: number,
  ): string {
    return `products:${search || 'all'}:${page || 1}:${limit || 10}`;
  }

  generateSingleProductCacheKey(id: string): string {
    return `product:${id}`;
  }

  // Additional utility methods
  async exists(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== undefined && value !== null;
  }

  async setWithDefaultTtl(key: string, value: any): Promise<void> {
    await this.cacheManager.set(key, value, 300); // 5 minutes default
  }

  // Batch operations
  async mget(keys: string[]): Promise<any[]> {
    return Promise.all(keys.map((key) => this.cacheManager.get(key)));
  }

  async mset(
    keyValuePairs: { key: string; value: any; ttl?: number }[],
  ): Promise<void> {
    await Promise.all(
      keyValuePairs.map(({ key, value, ttl }) =>
        this.cacheManager.set(key, value, ttl),
      ),
    );
  }

  // Product cache utilities
  async cacheProductList(
    products: any[],
    search?: string,
    page?: number,
    limit?: number,
    ttl: number = 300,
  ): Promise<void> {
    const key = this.generateProductCacheKey(search, page, limit);
    await this.set(key, products, ttl);
  }

  async getCachedProductList(
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<any[] | null> {
    const key = this.generateProductCacheKey(search, page, limit);
    return this.get(key);
  }

  async invalidateProductCache(): Promise<void> {
    await this.invalidatePattern('products:');
    await this.invalidatePattern('product:');
  }
}

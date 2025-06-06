import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get access token from localStorage
    let accessToken = null;
    if (typeof window !== "undefined") {
      try {
        const storedData = localStorage.getItem("POSuser");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          // Try different possible token locations
          accessToken =
            parsedData?.token ||
            parsedData?.data?.token ||
            parsedData?.accessToken ||
            parsedData?.data?.accessToken ||
            null;
        }
      } catch (error) {
        console.error("Error parsing stored user data:", error);
      }
    }

    // Add token to headers if available
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error(`API request failed:`, error);

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const errorMessage =
        error.response.data?.message ||
        `HTTP error! status: ${error.response.status}`;
      console.error("API Error Response:", error.response.data);
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received:", error.request);
      throw new Error("Network error: No response from server");
    } else {
      // Something else happened
      console.error("Request setup error:", error.message);
      throw new Error(error.message);
    }
  }
);

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: endpoint,
      ...options,
    });

    return response.data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// ===== INTERFACES =====

// Product interfaces
export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  price: number;
  stockQty: number;
  minStock: number;
  category?: string | null;
  barcode?: string | null;
  createdBy?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  code: string;
  description?: string;
  price: number;
  stockQty: number;
  category?: string;
  barcode?: string;
  createdBy?: string;
  image?: File;
}

export interface UpdateProductDto {
  name?: string;
  code?: string;
  description?: string;
  price?: number;
  stockQty?: number;
  category?: string;
  barcode?: string;
  image?: File;
}

// Cart and Sale interfaces
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  productName?: string;
  productCode?: string;
}

export interface CreateSaleDto {
  items: SaleItem[];
  paymentMethod: "CASH" | "CARD" | "DIGITAL_WALLET";
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  totalAmount: number;
  taxAmount?: number;
  subtotal?: number;
  amountReceived?: number;
  changeAmount?: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  paymentMethod: "CASH" | "CARD" | "DIGITAL_WALLET";
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  totalAmount: number;
  taxAmount?: number;
  subtotal?: number;
  amountReceived?: number;
  changeAmount?: number;
  createdAt: string;
  updatedAt: string;
}

// API Response interfaces
export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductsResponse {
  data: Product[];
  pagination: PaginationInfo;
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

export interface SalesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  paymentMethod?: "CASH" | "CARD" | "DIGITAL_WALLET";
  customerName?: string;
  customerPhone?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ===== AUTH HELPERS =====

/**
 * Get stored user data from localStorage
 */
export const getUserData = () => {
  if (typeof window === "undefined") return null;

  try {
    const storedData = localStorage.getItem("POSuser");
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    return null;
  }
};

/**
 * Get access token from stored user data
 */
export const getAccessToken = () => {
  const userData = getUserData();
  return userData?.data?.token || null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Clear user data (logout)
 */
export const clearUserData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("POSuser");
  }
};

// ===== PRODUCT API =====
export const productsAPI = {
  /**
   * GET /products with pagination and filters
   */
  getAll: async (
    params?: ProductsQueryParams
  ): Promise<ApiResponse<ProductsResponse>> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.category) queryParams.append("category", params.category);
      if (params?.isActive !== undefined)
        queryParams.append("isActive", params.isActive.toString());

      const endpoint = `/products${
        queryParams.toString() ? "?" + queryParams.toString() : ""
      }`;

      return await apiRequest<ApiResponse<ProductsResponse>>(endpoint, {
        method: "GET",
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to fetch products");
    }
  },

  /**
   * GET /products/:id - Get product by ID
   */
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    try {
      return await apiRequest<ApiResponse<Product>>(`/products/${id}`, {
        method: "GET",
      });
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error("Failed to fetch product");
    }
  },

  /**
   * POST /products - Create a new product (with or without image)
   */
  create: async (product: CreateProductDto): Promise<ApiResponse<Product>> => {
    try {
      // Validate required fields
      if (!product.name?.trim()) {
        throw new Error("Product name is required");
      }
      if (!product.code?.trim()) {
        throw new Error("Product code is required");
      }
      if (product.price <= 0) {
        throw new Error("Product price must be greater than 0");
      }
      if (product.stockQty < 0) {
        throw new Error("Stock quantity cannot be negative");
      }

      // If we have an image, use FormData for multipart upload
      if (product.image) {
        const formData = new FormData();

        // Add all product fields to FormData
        formData.append("name", product.name.trim());
        formData.append("code", product.code.trim());
        formData.append("price", product.price.toString());
        formData.append("stockQty", product.stockQty.toString());

        if (product.category?.trim()) {
          formData.append("category", product.category.trim());
        }
        if (product.description?.trim()) {
          formData.append("description", product.description.trim());
        }
        if (product.barcode?.trim()) {
          formData.append("barcode", product.barcode.trim());
        }
        if (product.createdBy?.trim()) {
          formData.append("createdBy", product.createdBy.trim());
        }

        // Add the image file
        formData.append("image", product.image);

        // Send multipart request
        return await apiClient
          .request<ApiResponse<Product>>({
            url: "/products",
            method: "POST",
            data: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => response.data);
      }

      // If no image, send regular JSON request
      return await apiRequest<ApiResponse<Product>>("/products", {
        method: "POST",
        data: {
          name: product.name.trim(),
          code: product.code.trim(),
          price: Number(product.price),
          stockQty: Number(product.stockQty),
          category: product.category?.trim() || undefined,
          description: product.description?.trim() || undefined,
          barcode: product.barcode?.trim() || undefined,
          createdBy: product.createdBy?.trim() || undefined,
        },
      });
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  /**
   * PUT /products/:id - Update product (with or without image)
   */
  update: async (
    id: string,
    updates: UpdateProductDto
  ): Promise<ApiResponse<Product>> => {
    try {
      // Validate updates
      if (updates.price !== undefined && updates.price <= 0) {
        throw new Error("Product price must be greater than 0");
      }
      if (updates.stockQty !== undefined && updates.stockQty < 0) {
        throw new Error("Stock quantity cannot be negative");
      }

      // If we have an image, use FormData for multipart upload
      if (updates.image) {
        const formData = new FormData();

        // Add updated fields to FormData (only non-undefined values)
        if (updates.name?.trim()) {
          formData.append("name", updates.name.trim());
        }
        if (updates.code?.trim()) {
          formData.append("code", updates.code.trim());
        }
        if (updates.category?.trim()) {
          formData.append("category", updates.category.trim());
        }
        if (updates.description?.trim()) {
          formData.append("description", updates.description.trim());
        }
        if (updates.barcode?.trim()) {
          formData.append("barcode", updates.barcode.trim());
        }
        if (updates.price !== undefined) {
          formData.append("price", updates.price.toString());
        }
        if (updates.stockQty !== undefined) {
          formData.append("stockQty", updates.stockQty.toString());
        }

        // Add the image file
        formData.append("image", updates.image);

        // Send multipart request
        return await apiClient
          .request<ApiResponse<Product>>({
            url: `/products/${id}`,
            method: "PUT",
            data: formData,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => response.data);
      }

      // If no image, send regular JSON request
      const cleanUpdates = {
        ...updates,
        name: updates.name?.trim(),
        code: updates.code?.trim(),
        category: updates.category?.trim(),
        description: updates.description?.trim(),
        barcode: updates.barcode?.trim(),
        price: updates.price ? Number(updates.price) : undefined,
        stockQty:
          updates.stockQty !== undefined ? Number(updates.stockQty) : undefined,
      };

      return await apiRequest<ApiResponse<Product>>(`/products/${id}`, {
        method: "PUT",
        data: cleanUpdates,
      });
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },

  /**
   * DELETE /products/:id - Delete product
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest<ApiResponse<void>>(`/products/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw new Error("Failed to delete product");
    }
  },

  /**
   * GET /products/search?q=query - Search products by name or code
   */
  search: async (query: string): Promise<ApiResponse<Product[]>> => {
    try {
      if (!query?.trim()) {
        return {
          success: true,
          message: "Empty query",
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      const encodedQuery = encodeURIComponent(query.trim());
      return await apiRequest<ApiResponse<Product[]>>(
        `/products/search?q=${encodedQuery}`,
        { method: "GET" }
      );
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error("Failed to search products");
    }
  },

  /**
   * PUT /products/:id/stock - Update product stock with reason
   */
  updateStock: async (
    id: string,
    quantity: number,
    reason: string
  ): Promise<ApiResponse<Product>> => {
    try {
      if (quantity < 0) {
        throw new Error("Stock quantity cannot be negative");
      }
      if (!reason?.trim()) {
        throw new Error("Reason for stock update is required");
      }

      return await apiRequest<ApiResponse<Product>>(`/products/${id}/stock`, {
        method: "PUT",
        data: {
          quantity: Number(quantity),
          reason: reason.trim(),
        },
      });
    } catch (error) {
      console.error(`Error updating stock for product ${id}:`, error);
      throw error;
    }
  },

  /**
   * GET /products/low-stock - Get products with low stock
   */
  getLowStock: async (): Promise<
    ApiResponse<{ data: Product[]; count: number }>
  > => {
    try {
      return await apiRequest<ApiResponse<{ data: Product[]; count: number }>>(
        "/products/low-stock",
        { method: "GET" }
      );
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      throw new Error("Failed to fetch low stock products");
    }
  },

  // Legacy methods - kept for backward compatibility but now redirect to main methods
  /**
   * @deprecated Use create() method instead
   */
  createWithImage: async (
    product: CreateProductDto
  ): Promise<ApiResponse<Product>> => {
    console.warn("createWithImage is deprecated. Use create() method instead.");
    return productsAPI.create(product);
  },

  /**
   * @deprecated Use update() method instead
   */
  updateWithImage: async (
    id: string,
    updates: UpdateProductDto
  ): Promise<ApiResponse<Product>> => {
    console.warn("updateWithImage is deprecated. Use update() method instead.");
    return productsAPI.update(id, updates);
  },
};

// ===== SALES API =====
export const salesAPI = {
  /**
   * POST /sales - Accept cart items, reduce stock, and save sale
   */
  create: async (sale: CreateSaleDto): Promise<ApiResponse<Sale>> => {
    try {
      // Validate sale data
      if (!sale.items || sale.items.length === 0) {
        throw new Error("Sale must contain at least one item");
      }

      if (sale.totalAmount <= 0) {
        throw new Error("Total amount must be greater than 0");
      }

      if (!["CASH", "CARD", "DIGITAL_WALLET"].includes(sale.paymentMethod)) {
        throw new Error("Invalid payment method");
      }

      // Validate each item
      for (const item of sale.items) {
        if (!item.productId) {
          throw new Error("Product ID is required for all items");
        }
        if (item.quantity <= 0) {
          throw new Error("Item quantity must be greater than 0");
        }
        if (item.price <= 0) {
          throw new Error("Item price must be greater than 0");
        }
      }

      const saleData = {
        ...sale,
        customerName: sale.customerName?.trim() || undefined,
        customerPhone: sale.customerPhone?.trim() || undefined,
        notes: sale.notes?.trim() || undefined,
        totalAmount: Number(sale.totalAmount),
        taxAmount: sale.taxAmount ? Number(sale.taxAmount) : undefined,
        subtotal: sale.subtotal ? Number(sale.subtotal) : undefined,
        amountReceived: sale.amountReceived
          ? Number(sale.amountReceived)
          : undefined,
        changeAmount: sale.changeAmount ? Number(sale.changeAmount) : undefined,
      };

      return await apiRequest<ApiResponse<Sale>>("/sales", {
        method: "POST",
        data: saleData,
      });
    } catch (error) {
      console.error("Error creating sale:", error);
      throw error;
    }
  },

  /**
   * GET /sales - Get all sales (for sales history) with pagination
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Sale[]; pagination: PaginationInfo }>> => {
    try {
      let endpoint = "/sales";

      if (params) {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());

        if (searchParams.toString()) {
          endpoint += `?${searchParams.toString()}`;
        }
      }

      return await apiRequest<
        ApiResponse<{ data: Sale[]; pagination: PaginationInfo }>
      >(endpoint, { method: "GET" });
    } catch (error) {
      console.error("Error fetching sales:", error);
      throw new Error("Failed to fetch sales history");
    }
  },

  /**
   * GET /sales/search?q=query - Search sales by customer name, phone, or notes
   */
  search: async (
    query: string,
    params?: Omit<SalesQueryParams, "search">
  ): Promise<ApiResponse<{ data: Sale[]; pagination: PaginationInfo }>> => {
    try {
      if (!query?.trim()) {
        return {
          success: true,
          message: "Empty query",
          data: {
            data: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
          timestamp: new Date().toISOString(),
        };
      }

      const queryParams = new URLSearchParams();
      queryParams.append("q", query.trim());

      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.paymentMethod)
        queryParams.append("paymentMethod", params.paymentMethod);
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);
      if (params?.minAmount)
        queryParams.append("minAmount", params.minAmount.toString());
      if (params?.maxAmount)
        queryParams.append("maxAmount", params.maxAmount.toString());

      return await apiRequest<
        ApiResponse<{ data: Sale[]; pagination: PaginationInfo }>
      >(`/sales/search?${queryParams.toString()}`, { method: "GET" });
    } catch (error) {
      console.error("Error searching sales:", error);
      throw new Error("Failed to search sales");
    }
  },

  /**
   * GET /sales/:id - Get sale by ID
   */
  getById: async (id: string): Promise<ApiResponse<Sale>> => {
    try {
      return await apiRequest<ApiResponse<Sale>>(`/sales/${id}`, {
        method: "GET",
      });
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      throw new Error("Failed to fetch sale details");
    }
  },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate cart totals
 */
export const calculateCartTotals = (items: CartItem[], taxRate: number = 0) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
};

/**
 * Validate stock availability for cart items
 */
export const validateStockAvailability = (cartItems: CartItem[]): string[] => {
  const errors: string[] = [];

  cartItems.forEach((item) => {
    if (item.quantity > item.product.stockQty) {
      errors.push(
        `Insufficient stock for ${item.product.name}. Available: ${item.product.stockQty}, Requested: ${item.quantity}`
      );
    }
  });

  return errors;
};

/**
 * Format currency
 */
export const formatCurrency = (
  amount: number,
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// ===== MAIN API EXPORT =====
export const api = {
  products: productsAPI,
  sales: salesAPI,
  auth: {
    getUserData,
    getAccessToken,
    isAuthenticated,
    clearUserData,
  },
  utils: {
    calculateCartTotals,
    validateStockAvailability,
    formatCurrency,
  },
};

export default api;

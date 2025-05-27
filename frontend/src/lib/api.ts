const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Fixed apiRequest function with proper token handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

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

  console.log("Access token:", accessToken);

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      // Send token without "Bearer " prefix - try this first
      // ...(accessToken && { Authorization: accessToken }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
    ...options,
  };

  // If the above doesn't work, try with "Bearer " prefix:
  // ...(accessToken && { Authorization: `Bearer ${accessToken}` }),

  console.log("Request headers:", config.headers);

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error("API Error Response:", errorData);
      } catch {
        // If response is not JSON, use default error message
      }

      throw new Error(errorMessage);
    }

    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return {} as T;
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
}

export interface UpdateProductDto {
  name?: string;
  code?: string;
  description?: string;
  price?: number;
  stockQty?: number;
  category?: string;
  barcode?: string;
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

      return await apiRequest<ApiResponse<ProductsResponse>>(endpoint);
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
      return await apiRequest<ApiResponse<Product>>(`/products/${id}`);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error("Failed to fetch product");
    }
  },

  /**
   * POST /products - Create a new product
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

      return await apiRequest<ApiResponse<Product>>("/products", {
        method: "POST",
        body: JSON.stringify({
          name: product.name.trim(),
          code: product.code.trim(),
          price: Number(product.price),
          stockQty: Number(product.stockQty),
          category: product.category?.trim() || undefined,
          description: product.description?.trim() || undefined,
          barcode: product.barcode?.trim() || undefined,
          createdBy: product.createdBy?.trim() || undefined,
        }),
      });
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  /**
   * PUT /products/:id - Update product
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
        body: JSON.stringify(cleanUpdates),
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
        `/products/search?q=${encodedQuery}`
      );
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error("Failed to search products");
    }
  },

  /**
   * Update stock for a specific product (for POS checkout)
   */
  updateStock: async (
    id: string,
    newStockQty: number
  ): Promise<ApiResponse<Product>> => {
    try {
      if (newStockQty < 0) {
        throw new Error("Stock quantity cannot be negative");
      }

      return await productsAPI.update(id, { stockQty: newStockQty });
    } catch (error) {
      console.error(`Error updating stock for product ${id}:`, error);
      throw error;
    }
  },
};

// ===== SALES API =====
export const salesAPI = {
  /**
   * POST /sales - Accept cart items, reduce stock, and save sale
   */
  create: async (sale: CreateSaleDto): Promise<ApiResponse<Sale>> => {
    console.log(" create: ~ sale:", sale);
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

      // const userData = getUserData();
      const saleData = {
        ...sale,
        customerName: sale.customerName?.trim() || undefined,
        customerPhone: sale.customerPhone?.trim() || undefined,
        notes: sale.notes?.trim() || undefined,
        totalAmount: Number(sale.totalAmount),
        // userId: userData?.data?.user?.id || null,
        taxAmount: sale.taxAmount ? Number(sale.taxAmount) : undefined,
        subtotal: sale.subtotal ? Number(sale.subtotal) : undefined,
        amountReceived: sale.amountReceived
          ? Number(sale.amountReceived)
          : undefined,
        changeAmount: sale.changeAmount ? Number(sale.changeAmount) : undefined,
      };

      return await apiRequest<ApiResponse<Sale>>("/sales", {
        method: "POST",
        body: JSON.stringify(saleData),
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
      >(endpoint);
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
      >(`/sales/search?${queryParams.toString()}`);
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
      return await apiRequest<ApiResponse<Sale>>(`/sales/${id}`);
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

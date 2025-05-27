import api from "@/lib/api";
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stockQty: number;
  category: string;
  description?: string;
  barcode?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  // Also support the other format mentioned in ProductList
  hasNext?: boolean;
  hasPrev?: boolean;
}

interface UseProductsOptions {
  initialItemsPerPage?: number;
  enableApiPagination?: boolean;
  demoProducts?: any;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  currentPage: number;
  itemsPerPage: number;
  totalProducts: number;
  searchQuery: string;
  loadProducts: (
    page?: number,
    limit?: number,
    search?: string
  ) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}

export const useProducts = ({
  initialItemsPerPage = 12,
  enableApiPagination = true,
  demoProducts = [],
}: UseProductsOptions = {}): UseProductsReturn => {
  const [products, setProducts] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPageState] = useState(1);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);
  const [searchQuery, setSearchQuery] = useState("");

  const loadProducts = useCallback(
    async (page = currentPage, limit = itemsPerPage, search = searchQuery) => {
      try {
        setLoading(true);
        setError(null);

        if (enableApiPagination) {
          // Try API call
          const response = await api.products.getAll({
            page,
            limit,
            search: search.trim() || undefined,
          });

          if (response.success && response.data) {
            setProducts(
              (response as any).data.data ||
                (response as any).data.products ||
                (response as any).data
            );

            // Handle different pagination response formats
            const paginationData = response.data.pagination || {
              page,
              limit,
              total: (response as any).data.total || 0,
              totalPages: Math.ceil(
                ((response as any).data.total || 0) / limit
              ),
              hasNextPage:
                page < Math.ceil(((response as any).data.total || 0) / limit),
              hasPrevPage: page > 1,
            };

            // Normalize pagination format
            const normalizedPagination: PaginationInfo = {
              page: paginationData.page || page,
              limit: paginationData.limit || limit,
              total: paginationData.total || 0,
              totalPages:
                paginationData.totalPages ||
                Math.ceil((paginationData.total || 0) / limit),
              hasNextPage:
                (paginationData as any).hasNextPage ??
                (paginationData as any).hasNext ??
                false,
              hasPrevPage:
                (paginationData as any).hasPrevPage ??
                (paginationData as any).hasPrev ??
                false,
              hasNext:
                (paginationData as any).hasNext ??
                (paginationData as any).hasNextPage ??
                false,
              hasPrev:
                (paginationData as any).hasPrev ??
                (paginationData as any).hasPrevPage ??
                false,
            };

            setPagination(normalizedPagination);
            setCurrentPageState(normalizedPagination.page);
            setSearchQuery(search);
          } else {
            throw new Error(response.message || "Failed to load products");
          }
        } else {
          // Use demo data with client-side pagination
          await new Promise((resolve) => setTimeout(resolve, 500));

          let filteredProducts = demoProducts;

          // Apply search filter if provided
          if (search.trim()) {
            const searchLower = search.toLowerCase();
            filteredProducts = demoProducts.filter(
              (product: any) =>
                product.name.toLowerCase().includes(searchLower) ||
                product.code.toLowerCase().includes(searchLower) ||
                product.category.toLowerCase().includes(searchLower)
            );
          }

          // Calculate pagination for demo data
          const total = filteredProducts.length;
          const totalPages = Math.ceil(total / limit);
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedProducts = filteredProducts.slice(
            startIndex,
            endIndex
          );

          setProducts(paginatedProducts);
          setPagination({
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          });
          setCurrentPageState(page);
          setSearchQuery(search);
        }
      } catch (error: any) {
        console.error("Error loading products:", error);
        setError(error.message || "Failed to load products");

        // Fallback to demo data with pagination
        let filteredProducts = demoProducts;

        if (search.trim()) {
          const searchLower = search.toLowerCase();
          filteredProducts = demoProducts.filter(
            (product: any) =>
              product.name.toLowerCase().includes(searchLower) ||
              product.code.toLowerCase().includes(searchLower) ||
              product.category.toLowerCase().includes(searchLower)
          );
        }

        const total = filteredProducts.length;
        const totalPages = Math.ceil(total / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        setProducts(paginatedProducts);
        setPagination({
          page,
          limit: itemsPerPage,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        });
        setCurrentPageState(page);
        setSearchQuery(search);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, itemsPerPage, searchQuery, enableApiPagination, demoProducts]
  );

  const setCurrentPage = useCallback(
    (page: number) => {
      setCurrentPageState(page);
      loadProducts(page, itemsPerPage, searchQuery);
    },
    [loadProducts, itemsPerPage, searchQuery]
  );

  const setItemsPerPage = useCallback(
    (items: number) => {
      setItemsPerPageState(items);
      setCurrentPageState(1);
      loadProducts(1, items, searchQuery);
    },
    [loadProducts, searchQuery]
  );

  const totalProducts = useMemo(() => {
    if (pagination) {
      return pagination.total;
    }
    return products.length;
  }, [products.length, pagination]);

  // Auto-load on mount
  useEffect(() => {
    if (!searchQuery) {
      loadProducts(currentPage, itemsPerPage, "");
    }
  }, [currentPage, itemsPerPage, loadProducts, searchQuery]);

  //   useEffect(() => {
  //     if (!searchQuery) {
  //       loadProducts(currentPage, itemsPerPage, "");
  //     }
  //   }, [searchQuery]);

  const clearError = () => setError(null);

  return {
    products,
    loading,
    error,
    pagination,
    currentPage,
    itemsPerPage,
    totalProducts,
    searchQuery,
    loadProducts,
    setCurrentPage,
    setItemsPerPage,
    setSearchQuery,
    clearError,
  };
};

// Updated useProductSearch hook
interface UseProductSearchOptions {
  onSearchSuccess?: (results: any, query: string) => void;
  onSearchError?: (error: string) => void;
  minSearchLength?: number;
}

interface UseProductSearchReturn {
  searchQuery: string;
  activeSearchQuery: string;
  searchLoading: boolean;
  searchProducts: (query: string) => Promise<void>;
  handleSearchChange: (query: string) => void;
  handleSearchSubmit: (query: string) => void;
  clearSearch: () => void;
}

export const useProductSearch = ({
  onSearchSuccess,
  onSearchError,
  minSearchLength = 2,
}: UseProductSearchOptions = {}): UseProductSearchReturn => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const searchProducts = useCallback(
    async (query: string) => {
      try {
        setSearchLoading(true);
        setActiveSearchQuery(query);

        // Call the success callback which should trigger loadProducts
        onSearchSuccess?.([], query);

        // if (query.trim()) {
        //   toast.success(`Searching for "${query}"`);
        // }
      } catch (error: any) {
        console.error("Error searching products:", error);
        const errorMessage = error.message || "Failed to search products";
        onSearchError?.(errorMessage);
        toast.error(errorMessage);
      } finally {
        setSearchLoading(false);
      }
    },
    [onSearchSuccess, onSearchError]
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchSubmit = (query: string) => {
    if (query.trim().length >= minSearchLength) {
      searchProducts(query.trim());
    } else if (query.trim().length === 0) {
      clearSearch();
    } else {
      toast.error(
        `Please enter at least ${minSearchLength} characters to search`
      );
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    onSearchSuccess?.([], ""); // Trigger reload with empty search
  };

  return {
    searchQuery,
    activeSearchQuery,
    searchLoading,
    searchProducts,
    handleSearchChange,
    handleSearchSubmit,
    clearSearch,
  };
};

// Keep the existing useProductCRUD hook as is
interface ProductFormData {
  name: string;
  code: string;
  price: number;
  stockQty: number;
  category: string;
  description?: string;
  barcode?: string;
}

interface UseProductCRUDOptions {
  onSuccess?: (action: "create" | "update" | "delete", product?: any) => void;
  onError?: (action: "create" | "update" | "delete", error: string) => void;
  reloadProducts?: () => Promise<void>;
}

interface UseProductCRUDReturn {
  loading: boolean;
  isFormOpen: boolean;
  editingProduct: Product | null;
  deleteDialogOpen: boolean;
  productToDelete: Product | null;
  createProduct: (data: ProductFormData) => Promise<void>;
  updateProduct: (data: ProductFormData) => Promise<void>;
  deleteProduct: (product: Product) => Promise<void>;
  openCreateForm: () => void;
  openEditForm: (product: Product) => void;
  closeForm: () => void;
  openDeleteDialog: (product: Product) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => Promise<void>;
}

export const useProductCRUD = ({
  onSuccess,
  onError,
  reloadProducts,
}: UseProductCRUDOptions = {}): UseProductCRUDReturn => {
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const createProduct = async (data: ProductFormData) => {
    try {
      setLoading(true);

      const response = await api.products.create(data);

      if (response.success && response.data) {
        await reloadProducts?.();
        setIsFormOpen(false);
        setEditingProduct(null);
        toast.success("Product created successfully!");
        onSuccess?.("create", response.data);
      } else {
        throw new Error(response.message || "Failed to create product");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create product";
      toast.error(errorMessage);
      onError?.("create", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;

    try {
      setLoading(true);

      const response = await api.products.update(editingProduct.id, data);

      if (response.success && response.data) {
        await reloadProducts?.();
        setIsFormOpen(false);
        setEditingProduct(null);
        toast.success("Product updated successfully!");
        onSuccess?.("update", response.data);
      } else {
        throw new Error(response.message || "Failed to update product");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update product";
      toast.error(errorMessage);
      onError?.("update", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    try {
      setLoading(true);

      const response = await api.products.delete(product.id);

      if (response.success) {
        await reloadProducts?.();
        toast.success("Product deleted successfully!");
        onSuccess?.("delete", product);
      } else {
        throw new Error(response.message || "Failed to delete product");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete product";
      toast.error(errorMessage);
      onError?.("delete", errorMessage);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const openCreateForm = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete);
    }
  };

  return {
    loading,
    isFormOpen,
    editingProduct,
    deleteDialogOpen,
    productToDelete,
    createProduct,
    updateProduct,
    deleteProduct,
    openCreateForm,
    openEditForm,
    closeForm,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  };
};

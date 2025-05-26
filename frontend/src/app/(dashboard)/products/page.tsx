"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Product, CreateProductDto, UpdateProductDto } from "@/lib/api";
import ProductForm from "@/components/products/ProductForm";
import ProductList from "@/components/products/ProductList";
import ProductSearch from "@/components/products/ProductSearch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import demoProducts from "@/utils/demo-products-list";
import { toast } from "sonner";

// Type for form data (matching the CreateProductDto structure)
interface ProductFormData {
  name: string;
  code: string;
  price: number;
  stockQty: number;
  category?: string;
  description?: string;
  barcode?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [apiPagination, setApiPagination] = useState<PaginationInfo | null>(
    null
  );
  console.log(" ProductsPage ~ products:", products);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete confirmation modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Pagination state - use API pagination when available, fallback to client-side
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [useApiPagination, setUseApiPagination] = useState(false);

  // Memoize loadProducts with useCallback to prevent unnecessary re-renders
  const loadProducts = useCallback(
    async (page = 1, limit = itemsPerPage, search = "") => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API with pagination
        const response = await api.products.getAll({
          page,
          limit,
          search: search.trim() || undefined,
        });
        console.log(" loadProducts ~ response:", response);

        if ((response as any).success && (response as any).data) {
          setProducts((response as any).data.data);
          setApiPagination((response as any).data.pagination);
          setUseApiPagination(true);
          setCurrentPage((response as any).data.pagination.page);
        } else {
          throw new Error(
            (response as any).message || "Failed to load products"
          );
        }
      } catch (error: any) {
        console.error("Error loading products:", error);
        setError(error.message || "Failed to load products");
        setUseApiPagination(false);
        setApiPagination(null);
        // Fallback to demo data
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [itemsPerPage]
  );

  // Filter products based on search query (client-side filtering for better UX when using demo data)
  const filteredProducts = useMemo(() => {
    // If we have API data and pagination info, use API data directly
    if (products.length > 0 && apiPagination) {
      // When using API pagination, return products as-is since filtering is done server-side
      if (useApiPagination) {
        return products;
      }
    }

    // Fallback to demo products or client-side filtering
    const productsToFilter = products.length > 0 ? products : demoProducts;

    if (!searchQuery.trim()) {
      return productsToFilter;
    }
    return productsToFilter.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery, apiPagination, useApiPagination]);

  // Get total count for pagination
  const totalProducts = useMemo(() => {
    if (useApiPagination && apiPagination) {
      return apiPagination.total;
    }
    return filteredProducts.length;
  }, [filteredProducts.length, apiPagination, useApiPagination]);

  // Reset to first page when search query or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load products with API pagination if search query changes and we have API connection
  useEffect(() => {
    if (useApiPagination && searchQuery) {
      loadProducts(1, itemsPerPage, searchQuery);
    }
  }, [searchQuery, useApiPagination, loadProducts, itemsPerPage]);

  // Load products with API pagination when page changes
  useEffect(() => {
    if (useApiPagination) {
      loadProducts(currentPage, itemsPerPage, searchQuery);
    }
  }, [currentPage, itemsPerPage, useApiPagination, loadProducts, searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const handleCreateProduct = async (productData: ProductFormData) => {
    try {
      setLoading(true);
      setError(null);

      const createData: CreateProductDto = {
        name: productData.name,
        code: productData.code,
        price: productData.price,
        stockQty: productData.stockQty,
        category: productData.category,
        description: productData.description || "",
        barcode: productData.barcode || "",
      };

      const response = await api.products.create(createData);

      if ((response as any).success && (response as any).data) {
        // Reload products to get updated data with pagination
        await loadProducts(currentPage, itemsPerPage, searchQuery);
        setIsFormOpen(false);
        setEditingProduct(null);
        toast.success("Product created successfully!");
      } else {
        throw new Error(
          (response as any).message || "Failed to create product"
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (productData: ProductFormData) => {
    if (!editingProduct) return;

    try {
      setLoading(true);
      setError(null);

      const updateData: UpdateProductDto = {
        name: productData.name,
        code: productData.code,
        price: productData.price,
        stockQty: productData.stockQty,
        category: productData.category,
        description: productData.description,
        barcode: productData.barcode,
      };

      const response = await api.products.update(editingProduct.id, updateData);

      if ((response as any).success && (response as any).data) {
        // Reload products to get updated data
        await loadProducts(currentPage, itemsPerPage, searchQuery);
        setIsFormOpen(false);
        setEditingProduct(null);
        toast.success("Product updated successfully!");
      } else {
        throw new Error(
          (response as any).message || "Failed to update product"
        );
      }
    } catch (error: any) {
      setError(error.message || "Failed to update product");
      toast.error(error.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (productData: any) => {
    if (editingProduct) {
      handleUpdateProduct(productData);
    } else {
      handleCreateProduct(productData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.products.delete(productToDelete.id);

      if ((response as any).success) {
        // Reload products to get updated data
        await loadProducts(currentPage, itemsPerPage, searchQuery);
        toast.success("Product deleted successfully!");
      } else {
        throw new Error(
          (response as any).message || "Failed to delete product"
        );
      }
    } catch (error: any) {
      setError(error.message || "Failed to delete product");
      toast.error(error.message || "Failed to delete product");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // const showSuccess = (message: string) => {
  //   setSuccess(message);
  //   setTimeout(() => setSuccess(null), 3000);
  // };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto p-4 md:p-0 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row justify-between gap-6 mb-8"
        >
          <div className="space-y-2">
            <h1 className="text-2xl font-bold mb-0 text-gray-900">Products</h1>
            <p className="text-gray-600">
              Manage your inventory and product catalog
              {useApiPagination && (
                <span className="text-green-600 ml-2">• Connected to API</span>
              )}
              {!useApiPagination && products.length === 0 && (
                <span className="text-orange-600 ml-2">• Using demo data</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ProductSearch
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              className="w-full sm:w-80"
            />
            <ProductForm
              isOpen={isFormOpen}
              onOpenChange={setIsFormOpen}
              onSubmit={handleFormSubmit}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
              loading={loading}
            />
          </div>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Alert className="border-red-200 bg-red-50 shadow-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 flex items-center justify-between">
                  <span>{error}. Now showing demo data.</span>
                  <button
                    onClick={clearError}
                    className="text-red-800 hover:text-red-900 font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Alert className="border-green-200 bg-green-50 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 flex items-center justify-between">
                  <span>{success}</span>
                  <button
                    onClick={clearSuccess}
                    className="text-green-800 hover:text-green-900 font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ProductList
            products={products}
            totalProducts={totalProducts}
            loading={loading}
            searchQuery={searchQuery}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddProduct={handleAddProduct}
            useApiPagination={useApiPagination}
            apiPagination={apiPagination}
          />
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-medium">
                  {productToDelete?.name || "this product"}
                </span>
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={cancelDelete}
                className="cursor-pointer"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

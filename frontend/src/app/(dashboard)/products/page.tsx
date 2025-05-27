"use client";

import { motion } from "framer-motion";
import ProductForm from "@/components/products/ProductForm";
import ProductList from "@/components/products/ProductList";
import ProductSearch from "@/components/products/ProductSearch";
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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import demoProducts from "@/utils/demo-products-list";
import { toast } from "sonner";

// Import the custom hooks
import {
  useProducts,
  useProductSearch,
  useProductCRUD,
} from "@/hooks/useProducts";

export default function ProductsPage() {
  // Use the products hook for data management and pagination
  const {
    products,
    loading,
    pagination,
    currentPage,
    itemsPerPage,
    totalProducts,
    searchQuery: activeSearchQuery,
    loadProducts,
    setCurrentPage,
    setItemsPerPage,
  } = useProducts({
    initialItemsPerPage: 12,
    enableApiPagination: true,
    demoProducts: demoProducts,
  });

  // Use the search hook for search functionality
  const {
    searchQuery,
    searchLoading,
    handleSearchChange,
    handleSearchSubmit,
    clearSearch,
  } = useProductSearch({
    onSearchSuccess: (results, query) => {
      // Load products with the search query
      loadProducts(1, itemsPerPage, query);
    },
    onSearchError: (error) => {
      console.error("Search error:", error);
    },
    minSearchLength: 2,
  });

  // Use the CRUD hook for create, update, delete operations
  const {
    loading: crudLoading,
    isFormOpen,
    editingProduct,
    deleteDialogOpen,
    productToDelete,
    createProduct,
    updateProduct,
    openCreateForm,
    openEditForm,
    closeForm,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  } = useProductCRUD({
    onSuccess: () => {},
    onError: (action, error) => {
      console.error(`${action} error:`, error);
    },
    reloadProducts: () =>
      loadProducts(currentPage, itemsPerPage, activeSearchQuery),
  });

  // Handle form submission (create or update)
  const handleFormSubmit = async (productData: any) => {
    if (editingProduct) {
      await updateProduct(productData);
    } else {
      await createProduct(productData);
    }
  };

  // Handle page change - this will automatically reload products
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change - this will automatically reload products
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
  };

  // Custom search submit handler
  const handleCustomSearchSubmit = (query: string) => {
    if (query.trim().length >= 2) {
      handleSearchSubmit(query);
    } else if (query.trim().length === 0) {
      clearSearch();
      loadProducts(1, itemsPerPage, "");
    } else {
      toast.error("Please enter at least 2 characters to search");
    }
  };

  // Determine if we're using API pagination
  const useApiPagination = !!pagination;

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
              {!useApiPagination && products.length === 0 && !loading && (
                <span className="text-orange-600 ml-2">• Using demo data</span>
              )}
              {activeSearchQuery && (
                <span className="text-blue-600 ml-2">
                  • Searching: &apos;{activeSearchQuery}&apos;
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ProductSearch
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleCustomSearchSubmit}
              loading={searchLoading}
              className="w-full sm:w-80"
            />

            {/* Fixed: Use a separate button to trigger the form */}
            <Button onClick={openCreateForm} className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </motion.div>

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
            searchQuery={activeSearchQuery}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            onEdit={openEditForm}
            onDelete={openDeleteDialog}
            onAddProduct={openCreateForm}
            useApiPagination={useApiPagination}
            apiPagination={pagination}
          />
        </motion.div>

        {/* Product Form Dialog - Fixed: Moved outside header, no trigger prop */}
        <ProductForm
          isOpen={isFormOpen}
          onOpenChange={closeForm}
          onSubmit={handleFormSubmit}
          editingProduct={editingProduct}
          loading={loading || crudLoading}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
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
                onClick={closeDeleteDialog}
                className="cursor-pointer"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
                disabled={crudLoading}
              >
                {crudLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

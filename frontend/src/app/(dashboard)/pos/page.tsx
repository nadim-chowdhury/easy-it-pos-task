"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Cart from "@/components/pos/Cart";
import { toast } from "sonner";
import { api, Product, CreateSaleDto, SaleItem } from "@/lib/api";

// Import the hooks
import { useProducts, useProductSearch } from "@/hooks/useProducts";

// Import demo data
import { demoPosProducts, categories } from "@/utils/demo-pos-products-list";
import Image from "next/image";
import ProductSearch from "@/components/products/ProductSearch";

interface CartItem {
  id: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
}

export default function POSpage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [displayProducts, setDisplayProducts] = useState<any>([]);

  // Use the products hook with demo data fallback
  const {
    products: allProducts,
    loading,
    error,
    pagination,
    currentPage,
    itemsPerPage,
    searchQuery: activeSearchQuery,
    loadProducts,
    setCurrentPage,
    setSearchQuery,
    clearError,
  } = useProducts({
    initialItemsPerPage: 12,
    enableApiPagination: true, // Use demo data for now
    demoProducts: demoPosProducts,
  });

  // Use the search hook
  const {
    searchQuery,
    searchLoading,
    handleSearchChange,
    handleSearchSubmit,
    clearSearch,
  } = useProductSearch({
    onSearchSuccess: (_, query) => {
      setSearchQuery(query);
      loadProducts(1, itemsPerPage, query);
    },
    onSearchError: (error) => {
      toast.error(error);
    },
    minSearchLength: 2,
  });

  // Filter products by category and update display
  const updateDisplayProducts = useCallback(() => {
    let filteredProducts = allProducts;

    // Apply category filter
    if (selectedCategory !== "all") {
      filteredProducts = allProducts.filter(
        (product: any) => product.category === selectedCategory
      );
    }

    setDisplayProducts(filteredProducts);
  }, [allProducts, selectedCategory]);

  // Update display products when products or category changes
  useEffect(() => {
    updateDisplayProducts();
  }, [updateDisplayProducts]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchQuery("");
    }
  }, [searchQuery, setSearchQuery]);

  // Reset to first page when category changes
  useEffect(() => {
    if (selectedCategory !== "all") {
      setCurrentPage(1);
    }
  }, [selectedCategory, setCurrentPage]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of products grid
    const productsSection = document.getElementById("products-grid");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchChangeWrapper = (query: string) => {
    handleSearchChange(query);
    // If search is cleared, reset category filter
    if (!query.trim()) {
      setSelectedCategory("all");
    }
  };

  const handleSearchSubmitWrapper = (query: string) => {
    handleSearchSubmit(query);
    // Reset category when searching
    if (query.trim()) {
      setSelectedCategory("all");
    }
  };

  const handleClearSearch = () => {
    clearSearch();
    setSelectedCategory("all");
  };

  const handleAddToCart = (product: Product) => {
    if (product.stockQty <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      // Check if we can add more (don't exceed stock)
      if (existingItem.quantity >= product.stockQty) {
        toast.error("Cannot add more items than available in stock");
        return;
      }

      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        quantity: 1,
      };
      setCart([...cart, newItem]);
    }

    toast.success(`${product.name} added to cart`);
  };

  const updateCartItemQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }

    // Find the product to check stock
    const product = allProducts.find((p: any) => p.id === id);

    if (product && newQuantity > product.stockQty) {
      toast.error("Cannot add more items than available in stock");
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.success("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
  };

  const processCheckout = async (checkoutData: {
    paymentMethod: "cash" | "card" | "digital";
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    amountReceived?: number;
    changeAmount?: number;
  }) => {
    try {
      // Convert cart items to sale items
      const saleItems: SaleItem[] = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        productName: item.name,
        productCode: item.code,
      }));

      // Calculate totals using the API utility
      const apiCartItems: any = cart.map((item) => ({
        productId: item.id,
        product: {
          id: item.id,
          name: item.name,
          code: item.code,
          price: item.price,
          stockQty: 0, // Not needed for calculation
        },
        quantity: item.quantity,
        price: item.price,
      }));

      const { subtotal, taxAmount, totalAmount } =
        api.utils.calculateCartTotals(
          apiCartItems,
          0.08 // 8% tax rate - adjust as needed
        );

      // Create sale data object
      const saleDataForAPI: CreateSaleDto = {
        items: saleItems,
        paymentMethod: checkoutData.paymentMethod,
        customerName: checkoutData.customerName,
        customerPhone: checkoutData.customerPhone,
        notes: checkoutData.notes,
        totalAmount,
        taxAmount,
        subtotal,
        amountReceived: checkoutData.amountReceived,
        changeAmount: checkoutData.changeAmount,
      };
      console.log("POSpage ~ saleDataForAPI:", saleDataForAPI);

      // In demo mode, simulate API call
      // In production, you would use: await api.sales.create(saleDataForAPI);
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await api.sales.create(saleDataForAPI);
      console.log(" POSpage ~ response:", response)

      // Simulate stock reduction by reloading products
      await loadProducts(currentPage, itemsPerPage, activeSearchQuery);

      // Clear cart
      clearCart();

      toast.success("Sale completed successfully!");
      return { id: "demo-sale-" + Date.now() };
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Checkout failed. Please try again.");
      throw err;
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const getStockBadgeVariant = (stock: number) => {
    if (stock > 50) return "default";
    if (stock > 10) return "secondary";
    if (stock > 0) return "outline";
    return "destructive";
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= 10) return "Low Stock";
    return stock.toString();
  };

  const isSearching = searchQuery.trim().length >= 1 && !searchLoading;
  console.log(" POSpage ~ isSearching:", isSearching);
  const isFiltering = selectedCategory !== "all";

  // Calculate display stats
  const totalDisplayItems = pagination?.total || displayProducts.length;
  const currentDisplayCount = displayProducts.length;

  return (
    <div className="min-h-screen bg-gray-50/50 px-6 pt-6">
      <div className="max-w-7xl mx-auto p-4 md:p-0 space-y-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 mb-0">
          <div className="">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-between space-x-3 w-full">
                <div className="space-y- mb-4">
                  <h1 className="text-2xl font-bold mb-0 text-gray-900">
                    Point of Sale
                  </h1>
                  <p className="text-gray-600">Manage your sales efficiently</p>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex items-center gap-2">
                  {isSearching && (
                    <div
                      onClick={() => {
                        setSearchQuery("");
                        handleSearchChange(""); // Clear search query
                      }}
                      className="bg-red-600 text-white p-1 rounded-md cursor-pointer hover:bg-red-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </div>
                  )}
                  {/* Product Search Component */}
                  <ProductSearch
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChangeWrapper}
                    onSearchSubmit={handleSearchSubmitWrapper}
                    className="flex-1 min-w-[300px]"
                    loading={searchLoading || loading}
                  />

                  {/* Category Filter */}
                  <div className="ml-2">
                    <Select
                      value={selectedCategory}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="h-12 border-gray-200 cursor-pointer">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category: any) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Products Section */}
          <div className="flex-1 py-6 pr-2">
            <div className="space-y-4">
              {/* Results Info */}
              <div className="flex items-center justify-between text-sm text-gray-500 pr-4">
                <div>
                  {loading || searchLoading ? (
                    "Loading..."
                  ) : (
                    <>
                      Showing {currentDisplayCount} of {totalDisplayItems}{" "}
                      products
                      {isFiltering && (
                        <span className="ml-1">
                          {isSearching && `matching "${searchQuery}"`}
                          {selectedCategory !== "all" && (
                            <span>
                              {isSearching ? " in " : "in "}
                              <span className="font-medium">
                                {selectedCategory}
                              </span>
                            </span>
                          )}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                )}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearError();
                    loadProducts(currentPage, itemsPerPage, activeSearchQuery);
                  }}
                  className="mt-2 cursor-pointer"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Products Grid */}
            <div id="products-grid">
              <ScrollArea className="h-[calc(100vh-192px)] py-4">
                {loading || searchLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(12)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded mb-4"></div>
                          <div className="flex justify-between items-center">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                    {displayProducts.map((product: any) => (
                      <Card
                        key={product.id}
                        className="group hover:shadow-md transition-all duration-200 border-gray-200 cursor-pointer"
                      >
                        <CardContent className="px-4">
                          <div className="flex items-start justify-between mb-3">
                            <Image
                              src="https://files.ekmcdn.com/bluestar/images/single-walled-cardboard-box-6-x-6-x-6-pack-of-25-160-p.jpg"
                              alt=""
                              width={640}
                              height={640}
                              className="object-cover w-16 h-16 rounded-md mr-4 bg-gray-100"
                            />

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500 font-mono">
                                {product.code}
                              </p>
                              {product.category && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Category: {product.category}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={getStockBadgeVariant(product.stockQty)}
                              className="ml-2 flex-shrink-0"
                            >
                              {getStockStatus(product.stockQty)}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-gray-900">
                              ${product.price.toFixed(2)}
                            </div>
                            <Button
                              onClick={() => handleAddToCart(product)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 transition-transform cursor-pointer"
                              disabled={product.stockQty === 0}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* No Products Found */}
                {!loading && !searchLoading && displayProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      {isFiltering
                        ? "No products found matching your criteria"
                        : "No products available"}
                    </p>
                    {isFiltering && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">
                          Try adjusting your search terms or filters
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearSearch}
                          className="cursor-pointer mt-2"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Pagination */}
            {!loading &&
              !searchLoading &&
              pagination &&
              pagination.totalPages > 1 && (
                <div className="mt-2 flex items-center justify-between pr-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, pagination.total)} of{" "}
                    {pagination.total} products
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="flex items-center cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              className="w-8 h-8 p-0 cursor-pointer"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="flex items-center cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
          </div>

          {/* Cart Section */}
          <Cart
            cart={cart}
            totalItems={totalItems}
            totalPrice={totalPrice}
            updateQuantity={updateCartItemQuantity}
            removeFromCart={removeFromCart}
            processCheckout={processCheckout}
          />
        </div>
      </div>
    </div>
  );
}

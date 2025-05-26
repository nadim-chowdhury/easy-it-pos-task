"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import {
  api,
  Product,
  CreateSaleDto,
  SaleItem,
  CartItem as APICartItem,
} from "@/lib/api";

// Import demo data
import {
  demoPosProducts,
  categories,
  searchProducts as searchDemoProducts,
  getPaginatedProducts,
} from "@/utils/demo-pos-products-list";
import Image from "next/image";

interface CartItem {
  id: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function POSpage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Fixed items per page
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Load products (using demo data for now)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      // For demo purposes, we'll use the demo data
      // In production, replace with: const data = await api.products.getAll();
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
      setProducts(demoPosProducts);
    } catch (err: any) {
      console.error("Fetch products error:", err);
      setError(
        err.message || "Failed to load products. Please refresh the page."
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate products - wrapped in useCallback to prevent unnecessary re-renders
  const updateDisplayProducts = useCallback(() => {
    let filteredProducts = products;

    // Apply search filter
    if (searchQuery.trim().length >= 2) {
      filteredProducts = searchDemoProducts(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Apply pagination
    const paginatedResult = getPaginatedProducts(
      filteredProducts,
      currentPage,
      itemsPerPage
    );

    setDisplayProducts(paginatedResult.products);
    setPaginationInfo({
      currentPage: paginatedResult.currentPage,
      totalPages: paginatedResult.totalPages,
      totalItems: paginatedResult.totalItems,
      hasNextPage: paginatedResult.hasNextPage,
      hasPrevPage: paginatedResult.hasPrevPage,
    });
  }, [products, searchQuery, selectedCategory, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Reset to first page when search or category changes
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (products.length > 0) {
      setSearchLoading(searchQuery.trim().length >= 2);

      // Simulate search delay
      const searchTimeout = setTimeout(
        () => {
          updateDisplayProducts();
          setSearchLoading(false);
        },
        searchQuery.trim().length >= 2 ? 300 : 0
      );

      return () => clearTimeout(searchTimeout);
    }
  }, [
    products,
    searchQuery,
    selectedCategory,
    currentPage,
    updateDisplayProducts,
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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
    const product = products.find((p) => p.id === id);

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
      const apiCartItems: APICartItem[] = cart.map((item) => ({
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

      // Create sale data object but don't store in unused variable
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
      console.log(" POSpage ~ saleDataForAPI:", saleDataForAPI);

      // In demo mode, simulate API call
      // In production, you would use: await api.sales.create(saleDataForAPI);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate stock reduction
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const cartItem = cart.find((item) => item.id === product.id);
          if (cartItem) {
            return {
              ...product,
              stockQty: Math.max(0, product.stockQty - cartItem.quantity),
            };
          }
          return product;
        })
      );

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

  const isSearching = searchQuery.trim().length >= 2;
  const isFiltering = selectedCategory !== "all" || isSearching;

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
                <div className="flex gap-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative items-center">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search products by name, code, or description..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="pl-10 h-9 text-base border-gray-200 focus:border-blue-500 transition-colors"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div className="">
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

              {/* {totalItems > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{totalItems} items</span>
                  <span className="text-gray-400">•</span>
                  <span className="font-semibold text-gray-900">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              )} */}
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
                  {searchLoading ? (
                    "Searching..."
                  ) : (
                    <>
                      Showing {displayProducts.length} of{" "}
                      {paginationInfo.totalItems} products
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

                {paginationInfo.totalPages > 1 && (
                  <div className="text-sm text-gray-500">
                    Page {paginationInfo.currentPage} of{" "}
                    {paginationInfo.totalPages}
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
                  onClick={fetchProducts}
                  className="mt-2 cursor-pointer"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Products Grid */}
            <div id="products-grid">
              <ScrollArea className="h-[calc(100vh-192px)] py-4">
                {loading ? (
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
                    {displayProducts.map((product) => (
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
                                  {product.category}
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
                {!loading && displayProducts.length === 0 && (
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
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("all");
                          }}
                          className="cursor-pointer"
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
            {!loading && paginationInfo.totalPages > 1 && (
              <div className="mt-2 flex items-center justify-between pr-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    paginationInfo.totalItems
                  )}{" "}
                  of {paginationInfo.totalItems} products
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!paginationInfo.hasPrevPage}
                    className="flex items-center cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from(
                      { length: Math.min(5, paginationInfo.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (paginationInfo.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (
                          currentPage >=
                          paginationInfo.totalPages - 2
                        ) {
                          pageNum = paginationInfo.totalPages - 4 + i;
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
                    disabled={!paginationInfo.hasNextPage}
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

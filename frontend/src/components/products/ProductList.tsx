import { Package, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductCard from "./ProductCard";

// API Pagination type to match your backend - updated to match the hook's interface
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  hasNext?: boolean;
  hasPrev?: boolean;
}

interface ProductListProps {
  products: any;
  totalProducts: number;
  loading: boolean;
  searchQuery: string;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onAddProduct: () => void;
  // Pagination props
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  // API pagination props
  useApiPagination?: boolean;
  apiPagination?: PaginationInfo | null;
}

const ITEMS_PER_PAGE_OPTIONS = [6, 12, 24, 48];

export default function ProductList({
  products,
  totalProducts,
  loading,
  searchQuery,
  onEdit,
  onDelete,
  onAddProduct,
  currentPage = 1,
  itemsPerPage = 12,
  onPageChange,
  onItemsPerPageChange,
  useApiPagination = false,
  apiPagination,
}: ProductListProps) {
  // Use API pagination data when available, fallback to calculated values
  const paginationData =
    useApiPagination && apiPagination
      ? {
          currentPage: apiPagination.page,
          totalPages: apiPagination.totalPages,
          totalItems: apiPagination.total,
          hasNext: apiPagination.hasNext ?? apiPagination.hasNextPage ?? false,
          hasPrev: apiPagination.hasPrev ?? apiPagination.hasPrevPage ?? false,
          itemsPerPage: apiPagination.limit,
        }
      : {
          currentPage,
          totalPages: Math.ceil(totalProducts / itemsPerPage),
          totalItems: totalProducts,
          hasNext: currentPage < Math.ceil(totalProducts / itemsPerPage),
          hasPrev: currentPage > 1,
          itemsPerPage,
        };

  // Calculate display range
  const startIndex =
    (paginationData.currentPage - 1) * paginationData.itemsPerPage;
  const displayedCount = products.length;

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const { totalPages, currentPage } = paginationData;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Show first few pages
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        if (totalPages > 4) {
          pages.push("...");
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last few pages
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          if (i > 1) pages.push(i);
        }
      } else {
        // Show pages around current page
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(itemsPerPage > 12 ? 12 : itemsPerPage)].map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="h-16 w-16 rounded-md" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Loading pagination skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-8" />
              ))}
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (paginationData.totalItems === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {searchQuery ? "No products found" : "No products yet"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {searchQuery
            ? `No products match "${searchQuery}". Try a different search term.`
            : "Get started by adding your first product to the inventory."}
        </p>
        {!searchQuery && (
          <Button
            onClick={onAddProduct}
            className="gap-2 w-1/4 mx-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Your First Product
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {searchQuery ? (
            <>
              Showing {startIndex + 1}–{startIndex + displayedCount} of{" "}
              {paginationData.totalItems} results for &quot;{searchQuery}&quot;
              {useApiPagination && (
                <span className="text-green-600 ml-2">(API)</span>
              )}
            </>
          ) : (
            <>
              Showing {startIndex + 1}–{startIndex + displayedCount} of{" "}
              {paginationData.totalItems} products
              {useApiPagination && (
                <span className="text-green-600 ml-2">(API)</span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product: any) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        {/* Page info (mobile) */}
        <div className="sm:hidden text-sm text-muted-foreground">
          Page {paginationData.currentPage} of {paginationData.totalPages}
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center gap-2">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(paginationData.currentPage - 1)}
            disabled={!paginationData.hasPrev}
            className="gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          {/* Page numbers */}
          <div className="flex gap-1">
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === "..." ? (
                  <span className="px-2 py-1 text-sm text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    variant={
                      paginationData.currentPage === page
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => onPageChange?.(page as number)}
                    className="w-8 h-8 p-0 cursor-pointer"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(paginationData.currentPage + 1)}
            disabled={!paginationData.hasNext}
            className="gap-1 cursor-pointer"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Items per page selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:inline">Show:</span>
          <Select
            value={paginationData.itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange?.(parseInt(value))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground hidden sm:inline">
            per page
          </span>
        </div>
      </div>
    </div>
  );
}

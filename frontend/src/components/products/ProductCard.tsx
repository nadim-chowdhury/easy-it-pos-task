import { Edit, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Product } from "@/lib/api";
import Image from "next/image";

interface ProductCardProps {
  product: any;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const getStockStatus = (product: Product) => {
  // Use isLowStock from API if available, otherwise calculate based on stockQty
  if (product.stockQty === 0) {
    return { label: "Out of Stock", variant: "destructive" as const };
  }

  // Check if API provides isLowStock field
  if (typeof (product as any).isLowStock === "boolean") {
    if ((product as any).isLowStock) {
      return { label: "Low Stock", variant: "secondary" as const };
    }
  } else {
    // Fallback calculation if isLowStock is not provided
    const minStock = (product as any).minStock || 10; // Use minStock from API or default to 10
    if (product.stockQty <= minStock) {
      return { label: "Low Stock", variant: "secondary" as const };
    }
  }

  return { label: "In Stock", variant: "default" as const };
};

export default function ProductCard({
  product,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const stockStatus = getStockStatus(product);

  return (
    <Card className="group hover:shadow-md transition-shadow gap-2">
      <CardHeader className="!pb-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <Image
              src="https://files.ekmcdn.com/bluestar/images/single-walled-cardboard-box-6-x-6-x-6-pack-of-25-160-p.jpg"
              alt={product.name}
              width={64}
              height={64}
              className="object-cover w-16 h-16 rounded-md bg-gray-100 flex-shrink-0"
            />

            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight">
                {product.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-mono">
                {product.code}
              </p>
              {product.category && (
                <p className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-md inline-block">
                  {product.category}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant={stockStatus.variant}
            className="ml-2 mt-2 flex-shrink-0"
          >
            {stockStatus.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price:</span>
          <span className="font-semibold text-lg">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Stock:</span>
          <span
            className={`font-medium ${
              product.stockQty === 0
                ? "text-red-600"
                : product.isLowStock ||
                  product.stockQty <= (product.minStock || 10)
                ? "text-orange-600"
                : "text-green-600"
            }`}
          >
            {product.stockQty} units
          </span>
        </div>

        {/* Show minimum stock threshold if available */}
        {product.minStock && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Min Stock:</span>
            <span className="text-sm text-gray-600">
              {product.minStock} units
            </span>
          </div>
        )}

        {/* Show description if available */}
        {product.description && (
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-2">{product.description}</p>
          </div>
        )}

        {/* Show barcode if available */}
        {product.barcode && (
          <div className="text-xs text-muted-foreground font-mono bg-gray-50 px-2 py-1 rounded">
            Barcode: {product.barcode}
          </div>
        )}

        {product.stockQty === 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This product is out of stock
            </AlertDescription>
          </Alert>
        )}

        {product.isLowStock && product.stockQty > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Stock is running low (below {product.minStock || 10} units)
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(product)}
            className="flex-1 gap-2 cursor-pointer"
          >
            <Edit className="h-3 w-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(product)}
            className="!bg-red-500 hover:!bg-red-700 text-white hover:text-white cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Show timestamps if available */}
        {product.createdAt && (
          <div className="text-xs text-muted-foreground pt-2">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(product.createdAt).toLocaleDateString()}</span>
            </div>
            {product.updatedAt && product.updatedAt !== product.createdAt && (
              <div className="flex justify-between mt-1">
                <span>Updated:</span>
                <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

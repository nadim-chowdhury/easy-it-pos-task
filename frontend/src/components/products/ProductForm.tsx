"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product, CreateProductDto, UpdateProductDto } from "@/lib/api";

interface ProductFormData {
  name: string;
  code: string;
  price: string;
  stockQty: string;
  category: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => void;
  editingProduct?: any;
  setEditingProduct?: (product: Product | null) => void;
  loading?: boolean;
}

export default function ProductForm({
  isOpen,
  onOpenChange,
  onSubmit,
  editingProduct,
  loading = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    code: "",
    price: "",
    stockQty: "",
    category: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<ProductFormData>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset form when editing product changes
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        code: editingProduct.code,
        price: editingProduct.price.toString(),
        stockQty: editingProduct.stockQty.toString(),
        category: editingProduct.category || "",
      });
    } else {
      resetForm();
    }
  }, [editingProduct]);

  // Remove focus when dialog opens with existing product data
  useEffect(() => {
    if (isOpen && editingProduct && nameInputRef.current) {
      // Small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        nameInputRef.current?.blur();
      }, 100);
    }
  }, [isOpen, editingProduct]);

  const validateForm = (): boolean => {
    const errors: Partial<ProductFormData> = {};

    // Match API validation from lib/api.ts
    if (!formData.name.trim()) {
      errors.name = "Product name is required";
    }

    if (!formData.code.trim()) {
      errors.code = "Product code is required";
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      errors.price = "Product price must be greater than 0";
    }

    const stockQty = parseInt(formData.stockQty);
    if (!formData.stockQty || isNaN(stockQty) || stockQty < 0) {
      errors.stockQty = "Stock quantity cannot be negative";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Step 1: Get the JSON string from localStorage
    const storedData = localStorage.getItem("POSuser");

    if (!storedData) {
      console.error("No USER data found");
      return;
    }

    // Step 2: Parse the JSON string into an object
    const parsedData = JSON.parse(storedData);

    // Step 3: Access the user ID
    const userId = parsedData?.data?.user?.id;
    console.log("handleSubmit ~ userId:", userId);

    // Convert form data to match API interfaces
    const submitData = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      price: parseFloat(formData.price),
      stockQty: parseInt(formData.stockQty),
      category: formData.category.trim() || undefined, // Only include if not empty
      createdBy: userId,
    };

    onSubmit(submitData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      price: "",
      stockQty: "",
      category: "",
    });
    setFormErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              ref={nameInputRef}
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter product name"
              className={formErrors.name ? "border-red-500" : ""}
              disabled={loading}
              autoFocus={!editingProduct} // Only auto-focus when adding new product
            />
            {formErrors.name && (
              <p className="text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Product Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  code: e.target.value.replace(/\s+/g, "").toUpperCase(),
                }))
              }
              placeholder="Enter product code"
              className={formErrors.code ? "border-red-500" : ""}
              disabled={loading}
            />

            {formErrors.code && (
              <p className="text-sm text-red-500">{formErrors.code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              placeholder="Enter product category"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                placeholder="0.00"
                className={formErrors.price ? "border-red-500" : ""}
                disabled={loading}
              />
              {formErrors.price && (
                <p className="text-sm text-red-500">{formErrors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQty">Stock Quantity</Label>
              <Input
                id="stockQty"
                type="number"
                min="0"
                value={formData.stockQty}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stockQty: e.target.value,
                  }))
                }
                placeholder="0"
                className={formErrors.stockQty ? "border-red-500" : ""}
                disabled={loading}
              />
              {formErrors.stockQty && (
                <p className="text-sm text-red-500">{formErrors.stockQty}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 cursor-pointer"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingProduct
                ? "Update Product"
                : "Create Product"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

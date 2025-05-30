"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

// Validation schema
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  code: z.string().min(1, "Product code is required").trim(),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Product price must be greater than 0"),
  stockQty: z
    .number({ invalid_type_error: "Stock quantity must be a number" })
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative"),
  category: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

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
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      code: "",
      price: 0,
      stockQty: 0,
      category: "",
    },
    mode: "onChange",
  });

  // Reset form when editing product changes
  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        code: editingProduct.code,
        price: editingProduct.price,
        stockQty: editingProduct.stockQty,
        category: editingProduct.category || "",
      });
      // Set existing image preview
      if (editingProduct.imageUrl) {
        setImagePreview(editingProduct.imageUrl);
      }
    } else {
      reset({
        name: "",
        code: "",
        price: 0,
        stockQty: 0,
        category: "",
      });
      setImagePreview(null);
    }
    setSelectedImage(null);
  }, [editingProduct, reset]);

  // Remove focus when dialog opens with existing product data
  useEffect(() => {
    if (isOpen && editingProduct && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.blur();
      }, 100);
    }
  }, [isOpen, editingProduct]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(editingProduct?.imageUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onFormSubmit = (data: ProductFormData) => {
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

    // Convert form data to match API interfaces
    const submitData = {
      name: data.name,
      code: data.code,
      price: data.price,
      stockQty: data.stockQty,
      category: data.category?.trim() || undefined,
      createdBy: userId,
      image: selectedImage || undefined, // Include selected image
    };

    onSubmit(submitData);
    handleFormClose();
  };

  const handleFormClose = () => {
    reset();
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const formatProductCode = (value: string) => {
    return value.replace(/\s+/g, "").toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleFormClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex flex-col gap-3">
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                  <Image
                    src={imagePreview}
                    alt="Product preview"
                    width={360}
                    height={360}
                    className="w-32 h-32 object-cover"
                  />
                  {!editingProduct && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                      disabled={loading}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {imagePreview ? (
                    <ImageIcon size={16} />
                  ) : (
                    <Upload size={16} />
                  )}
                  {imagePreview ? "Change Image" : "Upload Image"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  ref={nameInputRef}
                  id="name"
                  placeholder="Enter product name"
                  className={errors.name ? "border-red-500" : ""}
                  disabled={loading}
                  autoFocus={!editingProduct}
                />
              )}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Product Code</Label>
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="code"
                  placeholder="Enter product code"
                  className={errors.code ? "border-red-500" : ""}
                  disabled={loading}
                  onChange={(e) => {
                    const formattedCode = formatProductCode(e.target.value);
                    field.onChange(formattedCode);
                  }}
                />
              )}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="category"
                  placeholder="Enter product category"
                  disabled={loading}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                    disabled={loading}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value));
                    }}
                    value={field.value || ""}
                  />
                )}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQty">Stock Quantity</Label>
              <Controller
                name="stockQty"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="stockQty"
                    type="number"
                    min="0"
                    placeholder="0"
                    className={errors.stockQty ? "border-red-500" : ""}
                    disabled={loading}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseInt(value));
                    }}
                    value={field.value || ""}
                  />
                )}
              />
              {errors.stockQty && (
                <p className="text-sm text-red-500">
                  {errors.stockQty.message}
                </p>
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
              onClick={handleFormClose}
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

"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface CartItem {
  id: string;
  name: string;
  code: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value) || 0;
    if (newQuantity >= 0) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const incrementQuantity = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const decrementQuantity = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    } else {
      onRemove(item.id);
    }
  };

  const totalPrice = item.price * item.quantity;

  return (
    <Card className="border border-gray-200 hover:shadow-sm transition-shadow">
      <CardContent className="px-4">
        <div className="flex items-start justify-between mb-3">
          <Image
            src={
              item.imageUrl ||
              "https://files.ekmcdn.com/bluestar/images/single-walled-cardboard-box-6-x-6-x-6-pack-of-25-160-p.jpg"
            }
            alt=""
            width={640}
            height={640}
            className="object-cover w-16 h-16 rounded-md mr-4 bg-gray-100"
          />

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
              {item.name}
            </h4>
            <p className="text-xs text-gray-500 font-mono">{item.code}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              ${item.price.toFixed(2)} each
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 hover:!bg-red-100 p-1 cursor-pointer !transition-all !duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={decrementQuantity}
              className="h-8 w-8 p-0 border-gray-300 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </Button>

            <Input
              type="number"
              value={item.quantity}
              onChange={handleQuantityChange}
              className="w-16 h-8 text-center text-sm border-gray-300"
              min="0"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={incrementQuantity}
              className="h-8 w-8 p-0 border-gray-300 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Total Price */}
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              ${totalPrice.toFixed(2)}
            </div>
            {item.quantity > 1 && (
              <div className="text-xs text-gray-500">
                {item.quantity} × ${item.price.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

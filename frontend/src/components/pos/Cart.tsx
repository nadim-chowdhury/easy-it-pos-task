"use client";

import { useState } from "react";
import { ShoppingCart, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CartItem from "./CartItem";
import Checkout from "./Checkout";

interface CartItem {
  id: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  totalItems: number;
  totalPrice: number;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  processCheckout: (checkoutData: {
    paymentMethod: "cash" | "card" | "digital";
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    amountReceived?: number;
    changeAmount?: number;
  }) => Promise<any>;
}

export default function Cart({
  cart,
  totalItems,
  totalPrice,
  updateQuantity,
  removeFromCart,
  processCheckout,
}: CartProps) {
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = totalPrice;
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  const handleCheckoutComplete = async (checkoutData: any) => {
    try {
      await processCheckout({
        ...checkoutData,
        taxAmount,
        subtotal,
        totalAmount: total,
      });
      setShowCheckout(false);
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  };

  return (
    <div className="w-96 border-l border-gray-200 flex flex-col">
      {/* Cart Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart
            </h2>
          </div>
          {totalItems > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Badge>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-hidden">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-sm text-gray-500">
              Add products to get started with your sale
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="border-t border-gray-200 p-6">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (8%)</span>
              <span className="text-gray-900">${taxAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleCheckoutClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Checkout
          </Button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <Checkout
          isOpen={true}
          cartItems={cart}
          subtotal={subtotal}
          taxAmount={taxAmount}
          total={total}
          onComplete={handleCheckoutComplete}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}

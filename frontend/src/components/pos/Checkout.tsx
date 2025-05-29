"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  CreditCard,
  DollarSign,
  Smartphone,
  User,
  Phone,
  FileText,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  id: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
}

interface CheckoutFormData {
  paymentMethod: "CASH" | "CARD" | "DIGITAL_WALLET";
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  amountReceived?: string;
}

interface CheckoutProps {
  isOpen: boolean;
  cartItems: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  onComplete: (checkoutData: {
    paymentMethod: "CASH" | "CARD" | "DIGITAL_WALLET";
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    amountReceived?: number;
    changeAmount?: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function Checkout({
  isOpen,
  cartItems,
  subtotal,
  taxAmount,
  total,
  onComplete,
  onCancel,
}: CheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, touchedFields },
    setValue,
    trigger,
  } = useForm<CheckoutFormData>({
    mode: "onChange",
    defaultValues: {
      paymentMethod: "CASH",
      customerName: "",
      customerPhone: "",
      notes: "",
      amountReceived: "",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const amountReceived = watch("amountReceived");
  const amountReceivedNum = parseFloat(amountReceived || "0") || 0;
  const changeAmount =
    paymentMethod === "CASH" ? Math.max(0, amountReceivedNum - total) : 0;

  // Validation rules
  const validationRules = {
    paymentMethod: {
      required: "Payment method is required",
    },
    customerName: {
      maxLength: {
        value: 100,
        message: "Name must be less than 100 characters",
      },
    },
    customerPhone: {
      pattern: {
        value: /^[\+]?[1-9][\d\s\-\(\)]{0,15}$/,
        message: "Please enter a valid phone number",
      },
    },
    notes: {
      maxLength: {
        value: 500,
        message: "Notes must be less than 500 characters",
      },
    },
    amountReceived: {
      validate: (value: string | undefined) => {
        if (paymentMethod !== "CASH") return true;
        if (!value || value.trim() === "") {
          return "Amount received is required for cash payments";
        }
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
          return "Please enter a valid amount";
        }
        if (amount < total) {
          return `Amount must be at least $${total.toFixed(2)}`;
        }
        return true;
      },
    },
  };

  // Handle modal animation and reset
  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      reset({
        paymentMethod: "CASH",
        customerName: "",
        customerPhone: "",
        notes: "",
        amountReceived: "",
      });
    }
  }, [isOpen, reset]);

  // Re-validate amount received when payment method or total changes
  useEffect(() => {
    if (touchedFields.amountReceived) {
      trigger("amountReceived");
    }
  }, [paymentMethod, total, trigger, touchedFields.amountReceived]);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => {
      onCancel();
    }, 200);
  };

  const paymentMethods = [
    {
      id: "CASH" as const,
      label: "Cash",
      icon: DollarSign,
      description: "Physical cash payment",
      gradient: "from-emerald-500 to-green-600",
    },
    {
      id: "CARD" as const,
      label: "Card",
      icon: CreditCard,
      description: "Credit or debit card",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      id: "DIGITAL_WALLET" as const,
      label: "Digital",
      icon: Smartphone,
      description: "Mobile or digital wallet",
      gradient: "from-purple-500 to-purple-600",
    },
  ];

  const handlePaymentMethodChange = (
    method: "CASH" | "CARD" | "DIGITAL_WALLET"
  ) => {
    setValue("paymentMethod", method);
    if (method !== "CASH") {
      setValue("amountReceived", "");
    }
    trigger("amountReceived");
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);

    try {
      await onComplete({
        paymentMethod: data.paymentMethod,
        customerName: data.customerName?.trim() || undefined,
        customerPhone: data.customerPhone?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        amountReceived:
          data.paymentMethod === "CASH" ? amountReceivedNum : undefined,
        changeAmount: data.paymentMethod === "CASH" ? changeAmount : undefined,
      });
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex items-center space-x-2 text-red-600 text-sm mt-1">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );

  const isFormValid =
    isValid &&
    (paymentMethod !== "CASH" ||
      (amountReceived && amountReceivedNum >= total));

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }

        .backdrop-enter {
          animation: fadeIn 0.2s ease-out forwards;
        }

        .backdrop-exit {
          animation: fadeOut 0.2s ease-out forwards;
        }

        .modal-enter {
          animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .modal-exit {
          animation: slideOut 0.2s ease-out forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${
            showModal ? "backdrop-enter" : "backdrop-exit"
          }`}
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          className={`relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-hidden ${
            showModal ? "modal-enter" : "modal-exit"
          }`}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center space-x-3">
              <div className="pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                <p className="text-gray-500 text-sm">
                  Complete your transaction
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 max-h-[calc(95vh-120px)] overflow-y-auto">
              <div className="space-y-8">
                {/* Order Summary - Compact Card */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      Order Summary
                    </h3>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 px-3 py-1"
                    >
                      {cartItems.length} items
                    </Badge>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600 truncate mr-2">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="text-gray-900 font-medium shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (8%)</span>
                      <span className="font-medium">
                        ${taxAmount.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method - Modern Cards */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-900">
                      Payment Method *
                    </Label>
                    <p className="text-sm text-gray-500">
                      Choose how you&apos;d like to receive payment
                    </p>
                  </div>
                  <Controller
                    name="paymentMethod"
                    control={control}
                    rules={validationRules.paymentMethod}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {paymentMethods.map((method) => {
                          const Icon = method.icon;
                          const isSelected = field.value === method.id;

                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => {
                                field.onChange(method.id);
                                handlePaymentMethodChange(method.id);
                              }}
                              className={`relative px-4 py-2 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-center gap-4 ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50 shadow-xl ring-4 ring-blue-100"
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-lg"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-2xl bg-gradient-to-r ${method.gradient} flex items-center justify-center mx-auto shadow-lg`}
                              >
                                <Icon className="w-4 h-4 text-white" />
                              </div>

                              <div className="text-start">
                                <div className="font-semibold text-gray-900 mb-1 text-lg">
                                  {method.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {method.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.paymentMethod && (
                    <ErrorMessage
                      message={errors.paymentMethod.message || ""}
                    />
                  )}
                </div>

                {/* Cash Payment Details */}
                {paymentMethod === "CASH" && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6 space-y-6">
                    <h4 className="font-semibold text-emerald-800 flex items-center text-lg mb-4">
                      <DollarSign className="w-6 h-6 mr-2" />
                      Cash Payment Details
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="amountReceived"
                          className="text-sm font-medium text-gray-700 mb-2 block"
                        >
                          Amount Received *
                        </Label>
                        <Controller
                          name="amountReceived"
                          control={control}
                          rules={validationRules.amountReceived}
                          render={({ field }) => (
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-lg font-medium">
                                  $
                                </span>
                              </div>
                              <Input
                                {...field}
                                id="amountReceived"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className={`pl-10 h-12 text-xl font-medium rounded-xl ${
                                  errors.amountReceived
                                    ? "border-red-300 focus:border-red-400"
                                    : "border-emerald-200 focus:border-emerald-400"
                                }`}
                              />
                            </div>
                          )}
                        />
                        {errors.amountReceived && (
                          <ErrorMessage
                            message={errors.amountReceived.message || ""}
                          />
                        )}
                      </div>

                      {amountReceivedNum > 0 && (
                        <div className="bg-white rounded-xl p-5 border-2 border-emerald-200 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Change to return:
                            </span>
                            <div
                              className={`text-2xl font-bold ${
                                changeAmount >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              ${changeAmount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-900">
                      Customer Information
                    </Label>
                    <p className="text-sm text-gray-500">
                      Optional details for receipt and records
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="customerName"
                        className="text-sm font-medium flex items-center text-gray-700"
                      >
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        Customer Name
                      </Label>
                      <Controller
                        name="customerName"
                        control={control}
                        rules={validationRules.customerName}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="customerName"
                            placeholder="Enter customer name"
                            className={`h-10 rounded-xl ${
                              errors.customerName
                                ? "border-red-300 focus:border-red-400"
                                : "border-gray-200 focus:border-blue-400"
                            }`}
                          />
                        )}
                      />
                      {errors.customerName && (
                        <ErrorMessage
                          message={errors.customerName.message || ""}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="customerPhone"
                        className="text-sm font-medium flex items-center text-gray-700"
                      >
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        Phone Number
                      </Label>
                      <Controller
                        name="customerPhone"
                        control={control}
                        rules={validationRules.customerPhone}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="customerPhone"
                            placeholder="Enter phone number"
                            className={`h-10 rounded-xl ${
                              errors.customerPhone
                                ? "border-red-300 focus:border-red-400"
                                : "border-gray-200 focus:border-blue-400"
                            }`}
                          />
                        )}
                      />
                      {errors.customerPhone && (
                        <ErrorMessage
                          message={errors.customerPhone.message || ""}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="notes"
                      className="text-sm font-medium flex items-center text-gray-700"
                    >
                      <FileText className="w-4 h-4 mr-2 text-gray-500" />
                      Notes
                    </Label>
                    <Controller
                      name="notes"
                      control={control}
                      rules={validationRules.notes}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          id="notes"
                          placeholder="Any additional notes or special instructions..."
                          className={`resize-none rounded-xl ${
                            errors.notes
                              ? "border-red-300 focus:border-red-400"
                              : "border-gray-200 focus:border-blue-400"
                          }`}
                          rows={3}
                        />
                      )}
                    />
                    {errors.notes && (
                      <ErrorMessage message={errors.notes.message || ""} />
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-6 border-t-2 border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 h-10 text-gray-700 border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-medium cursor-pointer"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isFormValid || isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <span>Complete Sale - ${total.toFixed(2)}</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

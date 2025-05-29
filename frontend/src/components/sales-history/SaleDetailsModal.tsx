"use client";

import { motion } from "framer-motion";
// import { Download } from "lucide-react";
import ReceiptButton from "./ReceiptButton";

export default function SaleDetailsModal({
  setIsDetailDialogOpen,
  selectedSale,
  formatDate,
  formatTime,
  getPaymentMethodColor,
  getStatusColor,
}: any) {
  console.log(" selectedSale:", selectedSale);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={() => setIsDetailDialogOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Sale Details</h2>
            <button
              onClick={() => setIsDetailDialogOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-1">Order #{selectedSale.saleNumber}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Sale Info Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-600">
                  Date & Time
                </h4>
                <p className="text-sm text-gray-900">
                  {formatDate(selectedSale.createdAt)} at{" "}
                  {formatTime(selectedSale.createdAt)}
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-600">Customer</h4>
                <p className="text-sm text-gray-900">
                  {selectedSale.customerName || "N/A"}
                </p>
                {selectedSale.customerPhone && (
                  <p className="text-sm text-gray-500">
                    Phone: {selectedSale.customerPhone}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-600">Cashier</h4>
                <p className="text-sm text-gray-900">
                  {selectedSale.user?.name || "N/A"}
                </p>
                {selectedSale.user?.email && (
                  <p className="text-sm text-gray-500">
                    {selectedSale.user.email}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-600">
                  Payment Method
                </h4>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getPaymentMethodColor(
                    selectedSale.paymentMethod
                  )}`}
                >
                  {selectedSale.paymentMethod.replace("_", " ").toLowerCase()}
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-600">Status</h4>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(
                    selectedSale.status
                  )}`}
                >
                  {selectedSale.status.toLowerCase()}
                </span>
              </div>
              {selectedSale.notes && (
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-600">Notes</h4>
                  <p className="text-sm text-gray-900">{selectedSale.notes}</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Items */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Items Purchased</h4>
              <div className="space-y-3">
                {selectedSale.items.map((item: any, index: any) => (
                  <motion.div
                    key={`${item.product.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">
                        {item.product.name}
                      </h5>
                      <p className="text-sm text-gray-500">
                        Code: {item.product.code}
                      </p>
                      <p className="text-sm text-gray-500">
                        Unit Price: ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                      <p className="font-medium text-gray-900">
                        ${item.total.toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  ${selectedSale.totalAmount.toFixed(2)}
                </span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-red-600">
                    -${selectedSale.discount.toFixed(2)}
                  </span>
                </div>
              )}
              {selectedSale.tax > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">
                    ${selectedSale.tax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ${selectedSale.finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              {selectedSale.amountReceived && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Received</span>
                    <span className="font-medium text-gray-900">
                      ${selectedSale.amountReceived.toFixed(2)}
                    </span>
                  </div>
                  {selectedSale.changeAmount &&
                    selectedSale.changeAmount > 0 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-600">Change Given</span>
                        <span className="font-medium text-gray-900">
                          ${selectedSale.changeAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {/* <button
                onClick={() => setIsDetailDialogOpen(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 cursor-pointer"
              >
                Close
              </button> */}

            <ReceiptButton selectedSale={selectedSale} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

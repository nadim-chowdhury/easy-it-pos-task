import { motion } from "framer-motion";
import { Download } from "lucide-react";

export default function SaleDetailsModal({
  setIsDetailDialogOpen,
  selectedSale,
  formatDate,
  formatTime,
  getPaymentMethodColor,
  getStatusColor,
}: any) {
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
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-1">Order #{selectedSale.id}</p>
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
                <h4 className="text-sm font-medium text-gray-600">
                  Payment Method
                </h4>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getPaymentMethodColor(
                    selectedSale.paymentMethod
                  )}`}
                >
                  {selectedSale.paymentMethod}
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-600">Status</h4>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(
                    selectedSale.status
                  )}`}
                >
                  {selectedSale.status}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Items */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Items Purchased</h4>
              <div className="space-y-3">
                {selectedSale.items.map((item: any, index: any) => (
                  <motion.div
                    key={`${item.productId}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">
                        {item.productName}
                      </h5>
                      <p className="text-sm text-gray-500">
                        Code: {item.productCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                      <p className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
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
                  ${selectedSale.subtotal.toFixed(2)}
                </span>
              </div>
              {selectedSale.taxAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">
                    ${selectedSale.taxAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ${selectedSale.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  // Generate receipt data for this sale
                  const receiptData = [
                    `Order ID: ${selectedSale.id}`,
                    `Date: ${formatDate(selectedSale.createdAt)} ${formatTime(
                      selectedSale.createdAt
                    )}`,
                    `Customer: ${selectedSale.customerName || "N/A"}`,
                    selectedSale.customerPhone
                      ? `Phone: ${selectedSale.customerPhone}`
                      : "",
                    "",
                    "Items:",
                    ...selectedSale.items.map(
                      (item: any) =>
                        `${item.productName} (${item.productCode}) - Qty: ${
                          item.quantity
                        } - ${(item.price * item.quantity).toFixed(2)}`
                    ),
                    "",
                    `Subtotal: ${selectedSale.subtotal.toFixed(2)}`,
                    selectedSale.taxAmount > 0
                      ? `Tax: ${selectedSale.taxAmount.toFixed(2)}`
                      : "",
                    `Total: ${selectedSale.totalAmount.toFixed(2)}`,
                    "",
                    `Payment Method: ${selectedSale.paymentMethod}`,
                    `Status: ${selectedSale.status}`,
                  ]
                    .filter(Boolean)
                    .join("\n");

                  const blob = new Blob([receiptData], {
                    type: "text/plain",
                  });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `receipt-${selectedSale.id}.txt`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </button>
              <button
                onClick={() => setIsDetailDialogOpen(false)}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

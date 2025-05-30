// Receipt generation functions with PDF support
// Note: You need to install jsPDF: npm install jspdf

// Format date helper
const formatDate = (dateString: any) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Format time helper
const formatTime = (dateString: any) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Format currency helper
const formatCurrency = (amount: any) => {
  return `$${(amount / 100).toFixed(2)}`;
};

// Generate text receipt
export const generateTextReceipt = (selectedSale: any) => {
  console.log("generateTextReceipt ~ selectedSale:", selectedSale);
  const receiptLines = [
    "=".repeat(50),
    "                    RECEIPT",
    "=".repeat(50),
    `Sale Number: ${selectedSale.saleNumber}`,
    `Date: ${formatDate(selectedSale.createdAt)} ${formatTime(
      selectedSale.createdAt
    )}`,
    `Customer: ${selectedSale.customerName || "N/A"}`,
    selectedSale.customerPhone ? `Phone: ${selectedSale.customerPhone}` : "",
    `Cashier: ${selectedSale.user?.name || "N/A"}`,
    selectedSale.notes ? `Notes: ${selectedSale.notes}` : "",
    "",
    "-".repeat(50),
    "ITEMS:",
    "-".repeat(50),
    ...selectedSale.items.map((item: any) => {
      const productLine = `${item.product.name} (${item.product.code})`;
      const quantityLine = `  Qty: ${item.quantity} x ${formatCurrency(
        item.unitPrice
      )} = ${formatCurrency(item.total)}`;
      return [productLine, quantityLine].join("\n");
    }),
    "",
    "-".repeat(50),
    "SUMMARY:",
    "-".repeat(50),
    `Subtotal: ${formatCurrency(selectedSale.totalAmount)}`,
    selectedSale.discount > 0
      ? `Discount: -${formatCurrency(selectedSale.discount)}`
      : "",
    selectedSale.tax > 0 ? `Tax: ${formatCurrency(selectedSale.tax)}` : "",
    `TOTAL: ${formatCurrency(selectedSale.finalAmount)}`,
    "",
    "-".repeat(50),
    "PAYMENT:",
    "-".repeat(50),
    `Payment Method: ${selectedSale.paymentMethod.replace("_", " ")}`,
    `Status: ${selectedSale.status}`,
    selectedSale.amountReceived
      ? `Amount Received: ${formatCurrency(selectedSale.amountReceived)}`
      : "",
    selectedSale.changeAmount && selectedSale.changeAmount > 0
      ? `Change Given: ${formatCurrency(selectedSale.changeAmount)}`
      : "",
    "",
    "=".repeat(50),
    "           Thank you for your business!",
    "=".repeat(50),
  ]
    .filter(Boolean)
    .join("\n");

  return receiptLines;
};

// Generate PDF receipt using jsPDF
export const generatePDFReceipt = async (selectedSale: any) => {
  try {
    // Dynamic import for jsPDF (install with: npm install jspdf)
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200], // Thermal receipt size (80mm width)
    });

    // Set font
    doc.setFont("courier", "normal");

    let yPosition = 10;
    const lineHeight = 4;
    const pageWidth = 80;
    const margin = 5;
    const contentWidth = pageWidth - margin * 2;

    // Helper function to add text
    const addText = (
      text: string,
      fontSize = 8,
      align: "left" | "center" | "right" = "left",
      isBold = false
    ) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont("courier", "bold");
      } else {
        doc.setFont("courier", "normal");
      }

      if (align === "center") {
        doc.text(text, pageWidth / 2, yPosition, { align: "center" });
      } else if (align === "right") {
        doc.text(text, pageWidth - margin, yPosition, { align: "right" });
      } else {
        doc.text(text, margin, yPosition);
      }
      yPosition += lineHeight;
    };

    // Helper function to add line
    const addLine = (char = "-") => {
      const line = char.repeat(Math.floor(contentWidth / 1.5));
      addText(line, 8, "center");
    };

    // Header
    addLine("=");
    addText("YOUR STORE NAME", 12, "center", true);
    addText("SALES RECEIPT", 10, "center", true);
    addLine("=");
    yPosition += 2;

    // Sale Information
    addText(`Sale #: ${selectedSale.saleNumber}`, 8);
    addText(`Date: ${formatDate(selectedSale.createdAt)}`, 8);
    addText(`Time: ${formatTime(selectedSale.createdAt)}`, 8);
    addText(`Cashier: ${selectedSale.user?.name || "N/A"}`, 8);
    yPosition += 2;

    // Customer Information (if available)
    if (selectedSale.customerName || selectedSale.customerPhone) {
      addLine("-");
      addText("CUSTOMER INFO", 9, "left", true);
      if (selectedSale.customerName) {
        addText(`Name: ${selectedSale.customerName}`, 8);
      }
      if (selectedSale.customerPhone) {
        addText(`Phone: ${selectedSale.customerPhone}`, 8);
      }
      yPosition += 2;
    }

    // Items
    addLine("-");
    addText("ITEMS PURCHASED", 9, "left", true);
    addLine("-");

    selectedSale.items.forEach((item: any) => {
      // Product name and code
      addText(`${item.product.name}`, 8, "left", true);
      addText(`Code: ${item.product.code}`, 7);

      // Quantity and price on same line
      const qtyPriceText = `${item.quantity} x ${formatCurrency(
        item.unitPrice
      )}`;
      const totalText = formatCurrency(item.total);

      doc.setFontSize(8);
      doc.text(qtyPriceText, margin, yPosition);
      doc.text(totalText, pageWidth - margin, yPosition, { align: "right" });
      yPosition += lineHeight;
      yPosition += 1; // Extra space between items
    });

    // Totals
    yPosition += 2;
    addLine("-");
    addText("SUMMARY", 9, "left", true);
    addLine("-");

    // Helper function for total lines
    const addTotalLine = (label: string, amount: string, isBold = false) => {
      doc.setFontSize(8);
      if (isBold) {
        doc.setFont("courier", "bold");
      } else {
        doc.setFont("courier", "normal");
      }
      doc.text(label, margin, yPosition);
      doc.text(amount, pageWidth - margin, yPosition, { align: "right" });
      yPosition += lineHeight;
    };

    addTotalLine("Subtotal:", formatCurrency(selectedSale.totalAmount));

    if (selectedSale.discount > 0) {
      addTotalLine("Discount:", `-${formatCurrency(selectedSale.discount)}`);
    }

    if (selectedSale.tax > 0) {
      addTotalLine("Tax:", formatCurrency(selectedSale.tax));
    }

    yPosition += 1;
    addLine("-");
    addTotalLine("TOTAL:", formatCurrency(selectedSale.finalAmount), true);

    // Payment Details
    yPosition += 3;
    addLine("-");
    addText("PAYMENT DETAILS", 9, "left", true);
    addText(`Method: ${selectedSale.paymentMethod.replace("_", " ")}`, 8);
    addText(`Status: ${selectedSale.status}`, 8);

    if (selectedSale.amountReceived) {
      addText(
        `Amount Received: ${formatCurrency(selectedSale.amountReceived)}`,
        8
      );
    }

    if (selectedSale.changeAmount && selectedSale.changeAmount > 0) {
      addText(`Change Given: ${formatCurrency(selectedSale.changeAmount)}`, 8);
    }

    // Notes (if available)
    if (selectedSale.notes) {
      yPosition += 2;
      addLine("-");
      addText("NOTES", 9, "left", true);
      addText(selectedSale.notes, 8);
    }

    // Footer
    yPosition += 4;
    addLine("=");
    addText("Thank you for your business!", 9, "center");
    addText("Please keep this receipt", 8, "center");
    addText("for your records.", 8, "center");
    addLine("=");

    return doc;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Download PDF receipt
export const downloadPDFReceipt = async (selectedSale: any) => {
  try {
    const doc = await generatePDFReceipt(selectedSale);
    doc.save(`receipt-${selectedSale.saleNumber}.pdf`);
  } catch (error) {
    console.log(" downloadPDFReceipt ~ error:", error);
    // Fallback to HTML download
    downloadHTMLReceipt(selectedSale);
  }
};

// Generate HTML receipt for printing (improved)
export const generateHTMLReceiptForPrint = (selectedSale: any) => {
  const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${selectedSale.saleNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 5mm;
            background: white;
            color: black;
            font-size: 12px;
            line-height: 1.3;
          }
          
          .receipt {
            width: 100%;
            max-width: 70mm;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          
          .store-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          
          .receipt-title {
            font-size: 14px;
            font-weight: bold;
          }
          
          .section {
            margin: 8px 0;
          }
          
          .section-title {
            font-weight: bold;
            border-bottom: 1px solid #333;
            padding-bottom: 2px;
            margin-bottom: 5px;
            font-size: 11px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 10px;
          }
          
          .item-row {
            margin: 5px 0;
            padding: 3px 0;
            border-bottom: 1px dotted #666;
          }
          
          .item-name {
            font-weight: bold;
            font-size: 11px;
          }
          
          .item-code {
            color: #666;
            font-size: 9px;
          }
          
          .item-details {
            display: flex;
            justify-content: space-between;
            margin-top: 2px;
            font-size: 10px;
          }
          
          .total-section {
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 5px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 10px;
          }
          
          .final-total {
            font-weight: bold;
            font-size: 12px;
            border-top: 1px solid #333;
            padding-top: 3px;
            margin-top: 5px;
          }
          
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #333;
            font-style: italic;
            font-size: 10px;
          }
          
          .line {
            text-align: center;
            font-size: 10px;
            margin: 3px 0;
          }
          
          @media print {
            body { 
              margin: 0;
              padding: 2mm;
            }
            .receipt { 
              border: none;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="line">================================</div>
          <div class="header">
            <div class="store-name">YOUR STORE NAME</div>
            <div class="receipt-title">SALES RECEIPT</div>
          </div>
          <div class="line">================================</div>
  
          <div class="section">
            <div class="info-row">
              <span>Sale #:</span>
              <span>${selectedSale.saleNumber}</span>
            </div>
            <div class="info-row">
              <span>Date:</span>
              <span>${formatDate(selectedSale.createdAt)}</span>
            </div>
            <div class="info-row">
              <span>Time:</span>
              <span>${formatTime(selectedSale.createdAt)}</span>
            </div>
            <div class="info-row">
              <span>Cashier:</span>
              <span>${selectedSale.user?.name || "N/A"}</span>
            </div>
          </div>
  
          ${
            selectedSale.customerName || selectedSale.customerPhone
              ? `
          <div class="section">
            <div class="section-title">CUSTOMER INFO</div>
            ${
              selectedSale.customerName
                ? `
            <div class="info-row">
              <span>Name:</span>
              <span>${selectedSale.customerName}</span>
            </div>`
                : ""
            }
            ${
              selectedSale.customerPhone
                ? `
            <div class="info-row">
              <span>Phone:</span>
              <span>${selectedSale.customerPhone}</span>
            </div>`
                : ""
            }
          </div>`
              : ""
          }
  
          <div class="line">--------------------------------</div>
          <div class="section">
            <div class="section-title">ITEMS PURCHASED</div>
            ${selectedSale.items
              .map(
                (item: any) => `
            <div class="item-row">
              <div class="item-name">${item.product.name}</div>
              <div class="item-code">Code: ${item.product.code}</div>
              <div class="item-details">
                <span>${item.quantity} × ${formatCurrency(
                  item.unitPrice
                )}</span>
                <span>${formatCurrency(item.total)}</span>
              </div>
            </div>
            `
              )
              .join("")}
          </div>
  
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(selectedSale.totalAmount)}</span>
            </div>
            ${
              selectedSale.discount > 0
                ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-${formatCurrency(selectedSale.discount)}</span>
            </div>`
                : ""
            }
            ${
              selectedSale.tax > 0
                ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>${formatCurrency(selectedSale.tax)}</span>
            </div>`
                : ""
            }
            <div class="total-row final-total">
              <span>TOTAL:</span>
              <span>${formatCurrency(selectedSale.finalAmount)}</span>
            </div>
          </div>
  
          <div class="line">--------------------------------</div>
          <div class="section">
            <div class="section-title">PAYMENT DETAILS</div>
            <div class="info-row">
              <span>Method:</span>
              <span>${selectedSale.paymentMethod.replace("_", " ")}</span>
            </div>
            <div class="info-row">
              <span>Status:</span>
              <span>${selectedSale.status}</span>
            </div>
            ${
              selectedSale.amountReceived
                ? `
            <div class="info-row">
              <span>Amount Received:</span>
              <span>${formatCurrency(selectedSale.amountReceived)}</span>
            </div>`
                : ""
            }
            ${
              selectedSale.changeAmount && selectedSale.changeAmount > 0
                ? `
            <div class="info-row">
              <span>Change Given:</span>
              <span>${formatCurrency(selectedSale.changeAmount)}</span>
            </div>`
                : ""
            }
          </div>
  
          ${
            selectedSale.notes
              ? `
          <div class="section">
            <div class="section-title">NOTES</div>
            <div style="font-size: 10px;">${selectedSale.notes}</div>
          </div>`
              : ""
          }
  
          <div class="footer">
            <div class="line">================================</div>
            Thank you for your business!<br>
            Please keep this receipt for your records.
            <div class="line">================================</div>
          </div>
        </div>
      </body>
      </html>
    `;

  return htmlContent;
};

// Download text receipt
export const downloadTextReceipt = (selectedSale: any) => {
  const receiptContent = generateTextReceipt(selectedSale);
  const blob = new Blob([receiptContent], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${selectedSale.saleNumber}.txt`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Download HTML receipt (fallback)
export const downloadHTMLReceipt = (selectedSale: any) => {
  const htmlContent = generateHTMLReceiptForPrint(selectedSale);
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${selectedSale.saleNumber}.html`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Print receipt (improved - opens print dialog)
export const printReceipt = (selectedSale: any) => {
  const htmlContent = generateHTMLReceiptForPrint(selectedSale);

  // Create a hidden iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.top = "-1000px";
  iframe.style.left = "-1000px";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Wait for content to load then print
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          // Clean up after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } catch (error) {
          console.error("Print error:", error);
          // Fallback: open in new window
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
          }
          document.body.removeChild(iframe);
        }
      }, 500);
    };
  }
};

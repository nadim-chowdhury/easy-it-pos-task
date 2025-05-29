"use client";

import React, { useState } from "react";
import { Download, Printer, FileText, File } from "lucide-react";
import {
  downloadTextReceipt,
  downloadPDFReceipt,
  downloadHTMLReceipt,
  printReceipt,
} from "@/lib/generateTextReceipt";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ReceiptButtons = ({ selectedSale }: any) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDownloadText = () => {
    downloadTextReceipt(selectedSale);
    setIsDropdownOpen(false);
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadPDFReceipt(selectedSale);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("PDF download failed:", error);
      // Fallback to HTML download
      downloadHTMLReceipt(selectedSale);
      setIsDropdownOpen(false);
    }
  };

  const handleDownloadHTML = () => {
    downloadHTMLReceipt(selectedSale);
    setIsDropdownOpen(false);
  };

  const handlePrint = () => {
    printReceipt(selectedSale);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Single Button Version */}
      <button
        onClick={handleDownloadPDF}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
      >
        <Download className="h-4 w-4" />
        Download PDF Receipt
      </button>

      {/* Dropdown Version with Multiple Options */}
      <Popover>
        <PopoverTrigger className="w-full">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Receipt Options
            <svg
              className={`h-4 w-4 transition-transform duration-200 cursor-pointer ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent align="center">
          <button
            onClick={handleDownloadHTML}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 cursor-pointer transition-colors duration-200"
          >
            <File className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">Download HTML Receipt</div>
              <div className="text-sm text-gray-500">Web format</div>
            </div>
          </button>
          <button
            onClick={handleDownloadText}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 cursor-pointer transition-colors duration-200"
          >
            <FileText className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium">Download Text Receipt</div>
              <div className="text-sm text-gray-500">Plain text format</div>
            </div>
          </button>
          <button
            onClick={handlePrint}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 cursor-pointer transition-colors duration-200"
          >
            <Printer className="h-4 w-4 text-purple-600" />
            <div>
              <div className="font-medium">Print Receipt</div>
              <div className="text-sm text-gray-500">Open print dialog</div>
            </div>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ReceiptButtons;

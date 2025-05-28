"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { salesHistoryApi } from "@/utils/sales-history-demo-data";
import SaleDetailsModal from "@/components/sales-history/SaleDetailsModal";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  console.log(" SalesHistoryPage ~ selectedSale:", selectedSale);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchSales = async () => {
    try {
      setError(null);
      const salesDemoData = await salesHistoryApi.sales.getAll();

      const response = await api.sales.getAll();
      console.log(" POSpage ~ response:", response);

      setSales(response.data.data || salesDemoData);
    } catch (err) {
      setError("Failed to load sales data");
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSales();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredSales = sales.filter((sale: any) => {
    // Filter by period
    let passesDateFilter = true;
    if (filterPeriod !== "all") {
      const saleDate = new Date(sale.createdAt);
      const today = new Date();
      switch (filterPeriod) {
        case "today":
          passesDateFilter = saleDate.toDateString() === today.toDateString();
          break;
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          passesDateFilter = saleDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          passesDateFilter = saleDate >= monthAgo;
          break;
      }
    }
    // Filter by search term
    let passesSearchFilter = true;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      passesSearchFilter =
        sale.id.toLowerCase().includes(term) ||
        sale.customerName?.toLowerCase().includes(term) ||
        sale.items.some(
          (item: any) =>
            item.productName.toLowerCase().includes(term) ||
            item.productCode.toLowerCase().includes(term)
        );
    }
    return passesDateFilter && passesSearchFilter;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPeriod]);

  // Pagination calculations
  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSales = filteredSales.slice(startIndex, endIndex);

  const calculateStats = () => {
    const completedSales = filteredSales.filter(
      (sale: any) => sale.status === "COMPLETED"
    );
    const totalRevenue = completedSales.reduce(
      (sum: any, sale: any) => sum + sale.totalAmount,
      0
    );
    const totalOrders = completedSales.length;
    const totalItems = completedSales.reduce(
      (sum: any, sale: any) =>
        sum +
        sale.items.reduce(
          (itemSum: any, item: any) => itemSum + item.quantity,
          0
        ),
      0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalOrders, totalItems, averageOrderValue };
  };

  const stats = calculateStats();

  const formatDate = (dateStr: any) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: any) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodColor = (method: any) => {
    switch (method) {
      case "CASH":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CARD":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DIGITAL_WALLET":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-50 text-green-700 border-green-200";
      case "REFUNDED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleViewDetails = (sale: any) => {
    setSelectedSale(sale);
    setIsDetailDialogOpen(true);
  };

  const handleExportSales = () => {
    const csvContent = [
      [
        "Order ID",
        "Date",
        "Time",
        "Customer",
        "Items",
        "Total Amount",
        "Payment Method",
        "Status",
      ],
      ...filteredSales.map((sale: any) => [
        sale.id,
        formatDate(sale.createdAt),
        formatTime(sale.createdAt),
        sale.customerName || "N/A",
        sale.items.length,
        sale.totalAmount.toFixed(2),
        sale.paymentMethod,
        sale.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${filterPeriod}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearch = async () => {
    // if (searchTerm.trim() === searchQuery.trim()) return; // Don't search if query hasn't changed

    setIsSearching(true);
    // setSearchQuery(searchTerm.trim());
    setCurrentPage(1); // Reset to first page

    try {
      setError(null);

      if (searchQuery.trim()) {
        // Search with API
        const response = await api.sales.search(searchQuery.trim(), {
          page: 1,
          limit: 10, // Get all results for client-side filtering by period
        });
        setSales(response.data.data || []);
      } else {
        // If search term is empty, fetch all sales
        const response = await api.sales.getAll();
        setSales(response.data.data || []);
      }
    } catch (err) {
      setError("Failed to search sales data");
      console.error("Error searching sales:", err);

      // Fallback to demo data on error
      try {
        const salesDemoData = await salesHistoryApi.sales.getAll();
        setSales(salesDemoData);
      } catch (demoErr) {
        console.error("Error loading demo data:", demoErr);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchTerm("");
    setSearchQuery("");
    setCurrentPage(1);
    setIsSearching(true);

    try {
      setError(null);
      // Fetch all sales without search filter
      const response = await api.sales.getAll();
      setSales(response.data.data || []);
    } catch (err) {
      setError("Failed to load sales data");
      console.error("Error fetching sales:", err);

      // Fallback to demo data on error
      try {
        const salesDemoData = await salesHistoryApi.sales.getAll();
        setSales(salesDemoData);
      } catch (demoErr) {
        console.error("Error loading demo data:", demoErr);
      }
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="min-h-screen bg-gray-50/50 p-6"
        initial="initial"
        animate="in"
        variants={pageVariants}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-96 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-300 rounded animate-pulse mb-2" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50/50 p-6"
      initial="initial"
      animate="in"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto p-4 md:p-0 space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-2">
            <h1 className="text-2xl font-bold mb-0 text-gray-900">
              Sales Overview
            </h1>
            <p className="text-gray-600">
              Track your sales performance and transaction history
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="flex items-center flex-1 lg:w-auto">
              {/* Clear Button */}
              {(searchTerm || searchQuery) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                  disabled={isSearching}
                  className="gap-2 text-muted-foreground cursor-pointer mr-2 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              <div className="relative flex-1 lg:w-64">
                {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /> */}
                <Input
                  type="text"
                  placeholder="Search orders, customers, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="py-2.5 rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-1"
                />
              </div>

              {/* Search Button */}
              <Button
                type="submit"
                className="rounded-l-none w-12 cursor-pointer overflow-hidden"
                disabled={isSearching}
                onClick={handleSearch}
              >
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-4 w-4"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Filter */}
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[120px] cursor-pointer"
            >
              <option value="all" className="cursor-pointer">
                All Time
              </option>
              <option value="today" className="cursor-pointer">
                Today
              </option>
              <option value="week" className="cursor-pointer">
                This Week
              </option>
              <option value="month" className="cursor-pointer">
                This Month
              </option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={{
                    duration: 1,
                    repeat: isRefreshing ? Infinity : 0,
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </motion.div>
                Refresh
              </button>

              <button
                onClick={handleExportSales}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error Loading Data</p>
              <p className="text-red-600 text-sm">
                {error}. Showing demo data instead.
              </p>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Revenue",
              value: `$${stats.totalRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}`,
              icon: DollarSign,
              description:
                filterPeriod === "all" ? "All time" : `${filterPeriod} period`,
              color: "text-emerald-600",
              bgColor: "bg-emerald-50",
            },
            {
              title: "Total Orders",
              value: stats.totalOrders.toLocaleString(),
              icon: Package,
              description: "Completed transactions",
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              title: "Items Sold",
              value: stats.totalItems.toLocaleString(),
              icon: TrendingUp,
              description: "Total units sold",
              color: "text-purple-600",
              bgColor: "bg-purple-50",
            },
            {
              title: "Avg. Order Value",
              value: `$${stats.averageOrderValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}`,
              icon: Calendar,
              description: "Per transaction",
              color: "text-orange-600",
              bgColor: "bg-orange-50",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">
                  {stat.title}
                </h3>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sales Table */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Transactions
                </h3>
                <p className="text-sm text-gray-500">
                  Note: It will show demo data when you don&apos;t have real
                  history in your database.
                </p>
              </div>

              {/* Items per page selector */}
              {totalItems > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(Number(e.target.value))
                    }
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>
              )}
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No sales found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm
                  ? `No sales found matching "${searchTerm}"`
                  : filterPeriod === "all"
                  ? "No sales have been recorded yet."
                  : `No sales found for the selected ${filterPeriod} period.`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                        Order
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                        Customer
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                        Date & Time
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                        Items
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                        Amount
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                        Payment
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">
                        Status
                      </th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence>
                      {currentSales.map((sale: any, index: any) => (
                        <motion.tr
                          key={sale.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 transition-colors duration-200"
                        >
                          <td className="py-4 px-6">
                            <div className="font-medium text-gray-900">
                              {sale.saleNumber || "DEMO-20250505-0001"}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium text-gray-900">
                                {sale.customerName || "N/A"}
                              </div>
                              {sale.customerPhone && (
                                <div className="text-sm text-gray-500">
                                  {sale.customerPhone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(sale.createdAt)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatTime(sale.createdAt)}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {sale.items.length} item
                                {sale.items.length !== 1 ? "s" : ""}
                              </div>
                              <div className="text-gray-500">
                                {sale.items.reduce(
                                  (sum: any, item: any) => sum + item.quantity,
                                  0
                                )}{" "}
                                units
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-gray-900">
                              ${sale.totalAmount.toFixed(2)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getPaymentMethodColor(
                                sale.paymentMethod
                              )}`}
                            >
                              {sale.paymentMethod === "DIGITAL_WALLET"
                                ? "DIGITAL WALLET"
                                : sale.paymentMethod}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(
                                sale.status
                              )}`}
                            >
                              {sale.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleViewDetails(sale)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Results info */}
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, totalItems)} of {totalItems} results
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-2">
                      {/* First page */}
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </button>

                      {/* Previous page */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {generatePageNumbers().map((page, index) => (
                          <div key={index}>
                            {page === "..." ? (
                              <span className="px-3 py-2 text-gray-500">
                                ...
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePageChange(page as number)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                  currentPage === page
                                    ? "bg-blue-600 text-white"
                                    : "border border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Next page */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      {/* Last page */}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        <AnimatePresence>
          {/* Sale Details Modal */}
          {isDetailDialogOpen && selectedSale && (
            <SaleDetailsModal
              setIsDetailDialogOpen={setIsDetailDialogOpen}
              selectedSale={selectedSale}
              formatDate={formatDate}
              formatTime={formatTime}
              getPaymentMethodColor={getPaymentMethodColor}
              getStatusColor={getStatusColor}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

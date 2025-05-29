"use client";

import React, { useState } from "react";
import {
  ShoppingCart,
  BarChart3,
  Package,
  Menu,
  X,
  Store,
  User,
  Power,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const localData = localStorage.getItem("POSuser");
  const parsedData = localData ? JSON.parse(localData) : null;

  const navLinks = [
    { id: "pos", label: "POS", icon: ShoppingCart, href: "/pos" },
    { id: "products", label: "Products", icon: Package, href: "/products" },
    {
      id: "sales-history",
      label: "History",
      icon: BarChart3,
      href: "/sales-history",
    },
  ];

  const handleLinkClick = (linkId: any) => {
    setActiveLink(linkId);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("POSuser");
    localStorage.removeItem("token"); // Remove token if stored separately

    // Close modal
    // setIsLogoutModalOpen(false);

    // Redirect to login page
    router.push("/login");
  };

  return (
    <header className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                FlowPOS
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link key={link.id} href={link.href} passHref>
                  <button
                    onClick={() => handleLinkClick(link.id)}
                    className={`
                  relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer
                  ${
                    pathname === link.href
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }
                `}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{link.label}</span>
                    {/* {pathname === link.href ? (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                    ) : null} */}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="hidden sm:flex items-center justify-end space-x-3 mr-0 cursor-pointer">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {parsedData?.data?.user?.name || "Nadim Chowdhury"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {parsedData?.data?.user?.role || "Manager"}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg">
                    <User className="w-5 h-5" />
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 capitalize">
                      {parsedData?.data?.user?.username || "Username"}
                    </p>
                    <p className="text-xs font-medium text-gray-500 capitalize">
                      {parsedData?.data?.user?.email || "Email"}
                    </p>
                    <p className="text-xs font-medium capitalize">
                      {parsedData?.data?.user?.isActive ? (
                        <span className="text-green-500">Active</span>
                      ) : (
                        <span className="text-red-500">Inactive</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 cursor-pointer"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                      ${
                        activeLink === link.id
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }
                    `}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-3 px-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">Manager</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

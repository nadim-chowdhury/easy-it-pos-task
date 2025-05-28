import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/providers/store-provider";
import { Toaster } from "@/components/ui/sonner";

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
//   display: "swap", // Optional, helps with FOUT
// });

export const metadata: Metadata = {
  title: "Flow POS",
  description: "Developed by Nadim Chowdhury",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <StoreProvider>{children}</StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}

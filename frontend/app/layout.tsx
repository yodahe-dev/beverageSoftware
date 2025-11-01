import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/app/common/components/Sidebar"; // import your Sidebar
import "@/globals.css";

export const metadata: Metadata = {
  title: "Beverage Business",
  description: "Modern ERP Software for Beverage Business",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>
      <body className={`font-sans flex h-screen overflow-hidden`}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-900 text-gray-100">
          {children}
          <footer className="text-center text-sm text-gray-600 py-4 border-t border-gray-800 mt-6">
            &copy; {new Date().getFullYear()} +Me ERP. All rights reserved.
          </footer>
        </main>
      </body>
    </html>
  );
}

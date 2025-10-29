'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Beer, Coffee, Users, Home, Box, Truck, DollarSign, Layers, CreditCard
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: Home, href: "/" },
  { name: "Stores", icon: Layers, href: "/stores" },
  { name: "Customers", icon: Users, href: "/customers" },
  { name: "Brands", icon: Beer, href: "/brands" },
  { name: "Products", icon: Coffee, href: "/products" },
  { name: "Suppliers", icon: Truck, href: "/suppliers" },
  { name: "Sales", icon: DollarSign, href: "/sales" },
  { name: "Orders", icon: Box, href: "/orders" },
  { name: "Expenses", icon: CreditCard, href: "/expenses" }, // new
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border-r border-gray-800 p-6 flex flex-col justify-between shadow-lg"
    >
      {/* Logo */}
      <div>
        <div className="mb-12">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Beverage ERP
          </h1>
          <p className="text-gray-500 text-xs mt-1">Smart beverage management 🍹</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {menuItems.map(({ name, icon: Icon, href }) => {
            const active = pathname === href;
            return (
              <Link key={name} href={href} className="group relative">
                <motion.div
                  whileHover={{ scale: 1.05, x: 4 }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all cursor-pointer
                    ${active
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{name}</span>
                </motion.div>
                {/* Tooltip */}
                <span className="absolute left-full ml-2 hidden group-hover:block bg-gray-800 text-gray-100 text-xs px-2 py-1 rounded shadow-lg">
                  {name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        © 2025 PlusMe ERP
      </p>
    </motion.aside>
  );
}

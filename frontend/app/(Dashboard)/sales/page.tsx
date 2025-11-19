"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import {
  X,
  PlusCircle,
  ShoppingBag,
  Loader2,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Edit,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Phone,
  CreditCard,
  DollarSign,
  Tag,
  Calendar,
  Layers,
  Star,
  CheckCircle,
  Package,
  BarChart3,
  Users,
  ShoppingCart,
  TrendingUp,
  Eye,
  MoreVertical,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Bell,
  HelpCircle,
  Table,
  LayoutGrid,
  List,
  Columns,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  RotateCcw,
  Sparkles,
  Target,
  Crown,
  Zap,
  ArrowUpDown,
  Clock,
  CalendarDays,
} from "lucide-react";
import {jwtDecode} from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";

// Import the AdvancedNavbar component
import { AdvancedNavbar } from "@/app/common/components/AdvancedNavbar";

interface Product {
  id: string;
  name: string;
  price: number;
  sellPrice?: number | null;
  category?: string;
  subbrand?: { id: string; name: string; brand?: { id: string; name: string } | null } | null;
}

interface Subbrand {
  id: string;
  name: string;
  brand: { id: string; name: string };
}

type SaleCategory = "drink" | "bottle" | "both";

interface Customer {
  id: string;
  name: string;
  address: string;
  type: string;
  note?: string | null;
  isActive: boolean;
  phones?: { 
    id: string; 
    phoneNumber: string; 
    contactName?: string; 
    type: string;
    note?: string;
  }[];
  store?: {
    id: string;
    name: string;
  };
}

interface Sale {
  id: string;
  totalAmount: number | string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  customer?: Customer | null;
  note?: string | null;
}

interface SaleItemView {
  id: string;
  category: string;
  quantity: number;
  drinkPrice?: number | null;
  bottlePrice?: number | null;
  subtotal: number;
  note?: string | null;
  product?: { id: string; name?: string } | null;
  subbrand?: { id: string; name?: string } | null;
}

interface JwtPayload {
  userId: string;
  role?: string;
  iat?: number;
  exp?: number;
}

interface AppliedFilter {
  id: string;
  label: string;
  value: any;
  displayValue: string;
  type: 'status' | 'payment' | 'customer' | 'date' | 'amount';
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
  icon?: React.ReactNode;
  color?: string;
}

/* --------------------------- Search & Filter Components ------------------------------- */

const SearchAndFilterSystem: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  appliedFilters: AppliedFilter[];
  onFiltersChange: (filters: AppliedFilter[]) => void;
  sales: Sale[];
  onQuickFilter: (filter: AppliedFilter) => void;
}> = ({ searchQuery, onSearchChange, appliedFilters, onFiltersChange, sales, onQuickFilter }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'status' | 'payment' | 'customer' | 'date' | 'amount'>('status');
  
  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const statusCounts = { completed: 0, pending: 0, cancelled: 0, partially_paid: 0 };
    const paymentCounts = { cash: 0, transfer: 0, credit: 0 };
    const customerCounts = { bar: 0, individual: 0, shop: 0, restaurant: 0, other: 0 };
    
    sales.forEach(sale => {
      statusCounts[sale.status as keyof typeof statusCounts]++;
      paymentCounts[sale.paymentMethod as keyof typeof paymentCounts]++;
      if (sale.customer) {
        customerCounts[sale.customer.type as keyof typeof customerCounts]++;
      }
    });
    
    return { statusCounts, paymentCounts, customerCounts };
  }, [sales]);

  // Filter options
  const filterOptions = useMemo(() => ({
    status: [
      { id: 'completed', label: 'Completed', value: 'completed', count: filterCounts.statusCounts.completed, icon: <CheckCircle size={14} />, color: 'text-green-400' },
      { id: 'pending', label: 'Pending', value: 'pending', count: filterCounts.statusCounts.pending, icon: <Clock size={14} />, color: 'text-yellow-400' },
      { id: 'cancelled', label: 'Cancelled', value: 'cancelled', count: filterCounts.statusCounts.cancelled, icon: <X size={14} />, color: 'text-red-400' },
      { id: 'partially_paid', label: 'Partially Paid', value: 'partially_paid', count: filterCounts.statusCounts.partially_paid, icon: <DollarSign size={14} />, color: 'text-blue-400' },
    ] as FilterOption[],
    payment: [
      { id: 'cash', label: 'Cash', value: 'cash', count: filterCounts.paymentCounts.cash, icon: <DollarSign size={14} />, color: 'text-green-400' },
      { id: 'transfer', label: 'Transfer', value: 'transfer', count: filterCounts.paymentCounts.transfer, icon: <Upload size={14} />, color: 'text-blue-400' },
      { id: 'credit', label: 'Credit', value: 'credit', count: filterCounts.paymentCounts.credit, icon: <CreditCard size={14} />, color: 'text-yellow-400' },
    ] as FilterOption[],
    customer: [
      { id: 'bar', label: 'Bar', value: 'bar', count: filterCounts.customerCounts.bar, icon: <Users size={14} />, color: 'text-purple-400' },
      { id: 'individual', label: 'Individual', value: 'individual', count: filterCounts.customerCounts.individual, icon: <User size={14} />, color: 'text-blue-400' },
      { id: 'shop', label: 'Shop', value: 'shop', count: filterCounts.customerCounts.shop, icon: <ShoppingBag size={14} />, color: 'text-orange-400' },
      { id: 'restaurant', label: 'Restaurant', value: 'restaurant', count: filterCounts.customerCounts.restaurant, icon: <Star size={14} />, color: 'text-red-400' },
    ] as FilterOption[],
  }), [filterCounts]);

  const quickFilters = [
    {
      id: 'today',
      label: 'Today',
      value: 'today',
      icon: <Zap size={14} />,
      description: 'Sales from today',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'high_value',
      label: 'High Value',
      value: 'high_value',
      icon: <Crown size={14} />,
      description: 'Sales over 5000 ETB',
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'pending',
      label: 'Pending',
      value: 'pending',
      icon: <Clock size={14} />,
      description: 'All pending sales',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  const handleFilterToggle = (type: 'status' | 'payment' | 'customer' | 'date' | 'amount', value: string, label: string) => {
    const existingIndex = appliedFilters.findIndex(f => f.id === `${type}-${value}`);
    
    if (existingIndex >= 0) {
      // Remove filter
      const newFilters = [...appliedFilters];
      newFilters.splice(existingIndex, 1);
      onFiltersChange(newFilters);
    } else {
      // Add filter
      const newFilter: AppliedFilter = {
        id: `${type}-${value}`,
        label,
        value,
        displayValue: label,
        type
      };
      onFiltersChange([...appliedFilters, newFilter]);
    }
  };

  const removeFilter = (filterId: string) => {
    onFiltersChange(appliedFilters.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const isFilterActive = (type: string, value: string) => {
    return appliedFilters.some(f => f.id === `${type}-${value}`);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar with Advanced Features */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Input */}
          <div className="flex-1 w-full">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-green-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search sales by customer name, address, phone, sale ID..."
                className="w-full pl-10 pr-4 py-3 bg-gray-750 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* Search Suggestions */}
            {searchQuery && (
              <div className="mt-2 bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">Quick filters:</div>
                <div className="flex flex-wrap gap-2">
                  {['customer:', 'status:', 'payment:', 'amount:'].map((prefix) => (
                    <button
                      key={prefix}
                      onClick={() => onSearchChange(`${prefix} ${searchQuery}`)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      {prefix} {searchQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Toggle Button */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                appliedFilters.length > 0
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600'
              }`}
            >
              <Filter size={16} />
              Filters
              {appliedFilters.length > 0 && (
                <span className="bg-white text-gray-900 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {appliedFilters.length}
                </span>
              )}
            </button>

            {/* Quick Actions */}
            <button
              onClick={clearAllFilters}
              className="px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {appliedFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <div className="flex flex-wrap gap-2">
              {appliedFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm"
                >
                  <span className="font-medium">{filter.label}:</span>
                  <span>{filter.displayValue}</span>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="hover:bg-blue-500/30 rounded p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickFilters.map((filter) => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onQuickFilter({
              id: filter.id,
              label: filter.label,
              value: filter.value,
              displayValue: filter.description,
              type: 'date'
            })}
            className={`bg-gradient-to-r ${filter.color} rounded-2xl p-4 text-left text-white shadow-lg hover:shadow-xl transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {filter.icon}
                  <span className="font-semibold">{filter.label}</span>
                </div>
                <div className="text-sm opacity-90">{filter.description}</div>
              </div>
              <Sparkles size={16} className="opacity-70" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Advanced Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <SlidersHorizontal size={20} />
                  Advanced Filters
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 mb-6 p-1 bg-gray-750 rounded-lg">
                {(['status', 'payment', 'customer', 'date', 'amount'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilterTab(tab)}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeFilterTab === tab
                        ? 'bg-gray-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Filter Content */}
              <div className="space-y-4">
                {activeFilterTab === 'status' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {filterOptions.status.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleFilterToggle('status', option.value, option.label)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isFilterActive('status', option.value)
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-750'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={option.color}>{option.icon}</span>
                          <span className="font-medium text-white">{option.label}</span>
                        </div>
                        <div className="text-xs text-gray-400">{option.count} sales</div>
                      </button>
                    ))}
                  </div>
                )}

                {activeFilterTab === 'payment' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {filterOptions.payment.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleFilterToggle('payment', option.value, option.label)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isFilterActive('payment', option.value)
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-750'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={option.color}>{option.icon}</span>
                          <span className="font-medium text-white">{option.label}</span>
                        </div>
                        <div className="text-sm text-gray-400">{option.count} sales</div>
                      </button>
                    ))}
                  </div>
                )}

                {activeFilterTab === 'customer' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {filterOptions.customer.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleFilterToggle('customer', option.value, option.label)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isFilterActive('customer', option.value)
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-600 hover:border-gray-500 bg-gray-750'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={option.color}>{option.icon}</span>
                          <span className="font-medium text-white">{option.label}</span>
                        </div>
                        <div className="text-xs text-gray-400">{option.count} sales</div>
                      </button>
                    ))}
                  </div>
                )}

                {activeFilterTab === 'date' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: 'today', label: 'Today', value: 'today' },
                        { id: 'week', label: 'This Week', value: 'week' },
                        { id: 'month', label: 'This Month', value: 'month' },
                        { id: 'year', label: 'This Year', value: 'year' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleFilterToggle('date', option.value, option.label)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isFilterActive('date', option.value)
                              ? 'border-orange-500 bg-orange-500/10'
                              : 'border-gray-600 hover:border-gray-500 bg-gray-750'
                          }`}
                        >
                          <div className="font-medium text-white">{option.label}</div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">From Date</label>
                        <input
                          type="date"
                          className="w-full p-3 rounded-lg bg-gray-750 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">To Date</label>
                        <input
                          type="date"
                          className="w-full p-3 rounded-lg bg-gray-750 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeFilterTab === 'amount' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: '0-1000', label: '0-1,000', value: '0-1000' },
                        { id: '1000-5000', label: '1,000-5,000', value: '1000-5000' },
                        { id: '5000-10000', label: '5,000-10,000', value: '5000-10000' },
                        { id: '10000+', label: '10,000+', value: '10000+' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleFilterToggle('amount', option.value, option.label)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            isFilterActive('amount', option.value)
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-gray-600 hover:border-gray-500 bg-gray-750'
                          }`}
                        >
                          <div className="font-medium text-white">{option.label} ETB</div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Custom Range</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          placeholder="Min"
                          className="flex-1 p-3 rounded-lg bg-gray-750 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="number"
                          placeholder="Max"
                          className="flex-1 p-3 rounded-lg bg-gray-750 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                        />
                        <button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* --------------------------- Enhanced Sales Table Component ----------------- */

const SalesTable: React.FC<{
  sales: Sale[];
  onViewItems: (saleId: string) => void;
  onAddItems: (saleId: string) => void;
  onEdit: (sale: Sale) => void;
  onDelete: (saleId: string) => void;
  onExpand: (saleId: string) => void;
  expandedSale: string | null;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}> = ({
  sales,
  onViewItems,
  onAddItems,
  onEdit,
  onDelete,
  onExpand,
  expandedSale,
  sortConfig,
  onSort
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'partially_paid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-500/20 text-green-400';
      case 'transfer': return 'bg-blue-500/20 text-blue-400';
      case 'credit': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'bar': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'individual': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shop': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'restaurant': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const SortableHeader: React.FC<{ 
    columnKey: string; 
    children: React.ReactNode;
    sortable?: boolean;
  }> = ({ columnKey, children, sortable = true }) => (
    <th 
      className={`text-left p-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-gray-750 transition-colors ${
        sortable ? 'select-none' : ''
      }`}
      onClick={() => sortable && onSort(columnKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <div className="flex flex-col">
            <ChevronUp 
              size={12} 
              className={`${
                sortConfig?.key === columnKey && sortConfig.direction === 'asc' 
                  ? 'text-blue-400' 
                  : 'text-gray-500'
              }`} 
            />
            <ChevronDown 
              size={12} 
              className={`-mt-1 ${
                sortConfig?.key === columnKey && sortConfig.direction === 'desc' 
                  ? 'text-blue-400' 
                  : 'text-gray-500'
              }`} 
            />
          </div>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-750/50">
              <SortableHeader columnKey="customer">Customer</SortableHeader>
              <SortableHeader columnKey="amount">Amount</SortableHeader>
              <SortableHeader columnKey="status">Status</SortableHeader>
              <SortableHeader columnKey="payment">Payment</SortableHeader>
              <SortableHeader columnKey="date">Date</SortableHeader>
              <th className="text-left p-4 text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <React.Fragment key={sale.id}>
                <tr 
                  className="border-b border-gray-800 hover:bg-gray-750/50 transition-colors cursor-pointer group"
                  onClick={() => onExpand(sale.id)}
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {sale.customer ? (
                        <>
                          <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                            <User size={16} className="text-blue-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                              {sale.customer.name}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getCustomerTypeColor(sale.customer.type)}`}>
                                {sale.customer.type}
                              </span>
                              <div className="text-xs text-gray-400 flex items-center space-x-1">
                                <MapPin size={12} />
                                <span>{sale.customer.address || "No address"}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-400 group-hover:text-gray-300 transition-colors">
                          <User size={16} />
                          <span>Walk-in Customer</span>
                        </div>
                      )}
                    </div>
                    {sale.note && (
                      <div className="text-xs text-gray-500 mt-2 italic">"{sale.note}"</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-green-400 font-bold text-lg group-hover:text-green-300 transition-colors">
                      {formatCurrency(Number(sale.totalAmount))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(sale.status)}`}>
                      {sale.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getPaymentMethodColor(sale.paymentMethod)}`}>
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                    {formatDate(sale.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewItems(sale.id);
                        }}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                        title="View Items"
                      >
                        <Eye size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddItems(sale.id);
                        }}
                        className="p-2 rounded-lg bg-green-600 hover:bg-green-700 transition"
                        title="Add Items"
                      >
                        <PlusCircle size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(sale);
                        }}
                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
                        title="Edit Sale"
                      >
                        <Edit size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(sale.id);
                        }}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
                        title="Delete Sale"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Details */}
                {expandedSale === sale.id && (
                  <tr>
                    <td colSpan={6} className="bg-gray-850/50 p-6">
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm"
                      >
                        <div>
                          <div className="text-gray-400 font-medium mb-1">Sale ID</div>
                          <div className="font-mono text-green-400 text-xs">{sale.id}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-medium mb-1">Created</div>
                          <div>{formatDate(sale.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-medium mb-1">Status</div>
                          <div className="capitalize">{sale.status}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-medium mb-1">Payment Method</div>
                          <div className="capitalize">{sale.paymentMethod}</div>
                        </div>
                        {sale.customer && (
                          <>
                            <div>
                              <div className="text-gray-400 font-medium mb-1">Customer Type</div>
                              <div className="capitalize">{sale.customer.type}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 font-medium mb-1">Customer Address</div>
                              <div>{sale.customer.address}</div>
                            </div>
                            {sale.customer.phones && sale.customer.phones.length > 0 && (
                              <div>
                                <div className="text-gray-400 font-medium mb-1">Phone</div>
                                <div>{sale.customer.phones[0].phoneNumber}</div>
                              </div>
                            )}
                          </>
                        )}
                        {sale.note && (
                          <div className="md:col-span-2 lg:col-span-4">
                            <div className="text-gray-400 font-medium mb-1">Note</div>
                            <div className="italic">{sale.note}</div>
                          </div>
                        )}
                      </motion.div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* --------------------------- Helpers ------------------------------- */

function computeSubtotalForItem(item: {
  category: SaleCategory;
  quantity: number;
  drinkPrice?: number | null | undefined;
  bottlePrice?: number | null | undefined;
}) {
  const q = Math.max(0, Number(item.quantity) || 0);
  const d = Number(item.drinkPrice || 0);
  const b = Number(item.bottlePrice || 0);

  if (item.category === "drink") {
    return d * q;
  } else if (item.category === "bottle") {
    return b * q;
  } else {
    return (d + b) * q;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ET', {
    month: 'short',
    day: 'numeric'
  });
}

/* --------------------------- Toasts -------------------------------- */

type ToastKind = "success" | "error" | "info" | "warning";
interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((message: string, kind: ToastKind = "info", ms = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((t) => [{ id, message, kind }, ...t]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);
  
  const remove = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  
  return { toasts, add, remove };
}

/* --------------------------- Stats Cards --------------------------- */

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, trend, icon, color }) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.02 }}
    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-white mb-2">{value}</p>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend === "up" ? "text-green-400" : 
            trend === "down" ? "text-red-400" : 
            "text-gray-400"
          }`}>
            <TrendingUp size={12} className={trend === "down" ? "rotate-180" : ""} />
            {change}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

/* --------------------------- Component ----------------------------- */

export default function SalesPage() {
  // Data lists
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subbrands, setSubbrands] = useState<Subbrand[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // View mode state
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'list'>('card');

  // Selected items to add
  const [selectedItems, setSelectedItems] = useState<
    {
      productId: string;
      quantity: number;
      subtotal: number;
      category: SaleCategory;
      drinkPrice?: number | "" | null;
      bottlePrice?: number | "" | null;
      subbrandId?: string | "";
      note?: string;
    }[]
  >([]);

  // UI state
  const [saleId, setSaleId] = useState<string | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showSaleDetails, setShowSaleDetails] = useState<{ open: boolean; saleId?: string }>({
    open: false,
  });

  // Editing states
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingItems, setEditingItems] = useState<{ [key: string]: SaleItemView }>({});
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  // Sale form
  const [customerId, setCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "credit">("cash");
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled" | "partially_paid">(
    "pending"
  );
  const [note, setNote] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Advanced Filters
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Search states
  const [productQuery, setProductQuery] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // auth + loading
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [updatingSale, setUpdatingSale] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<{ [key: string]: boolean }>({});

  // viewing sale items
  const [viewItems, setViewItems] = useState<SaleItemView[]>([]);
  const [viewItemsLoading, setViewItemsLoading] = useState(false);

  // confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete-sale' | 'delete-item' | 'update-sale' | 'update-items';
    id?: string;
    saleId?: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // toasts
  const { toasts, add: addToast, remove: removeToast } = useToasts();

  // refs to avoid stale timers
  const mountedRef = useRef(true);
  const customerSearchRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Stats
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    averageOrder: 0,
  });

  // Memoized price range to prevent infinite re-renders
  const priceRange = useMemo(() => ({ 
    min: 0, 
    max: 10000, 
    step: 100 
  }), []);

  // Memoized filters to prevent infinite re-renders
  const defaultFilters = useMemo(() => [
    {
      id: "price-range",
      label: "Price Range (ETB)",
      type: "range" as const,
      min: 0,
      max: 10000,
      step: 100,
      icon: <DollarSign className="w-4 h-4 text-gray-600" />,
      enabled: true
    },
    {
      id: "status",
      label: "Status",
      type: "select" as const,
      options: ["Active", "Pending", "Completed", "Cancelled"],
      icon: <Star className="w-4 h-4 text-gray-600" />,
      enabled: true
    },
    {
      id: "payment-method",
      label: "Payment Method",
      type: "select" as const,
      options: ["Cash", "Transfer", "Credit"],
      icon: <CreditCard className="w-4 h-4 text-gray-600" />,
      enabled: true
    },
    {
      id: "customer-type",
      label: "Customer Type",
      type: "multi-select" as const,
      options: ["Individual", "Business", "VIP", "Wholesale"],
      icon: <Users className="w-4 h-4 text-gray-600" />,
      enabled: true
    },
    {
      id: "date-range",
      label: "Date Range",
      type: "date" as const,
      options: ["Today", "Last 7 days", "Last 30 days", "This month", "Custom"],
      icon: <Calendar className="w-4 h-4 text-gray-600" />,
      enabled: true
    }
  ], []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (customerSearchRef.current) {
        clearTimeout(customerSearchRef.current);
      }
    };
  }, []);

  // decode JWT
  useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("erp_token") : null;
      if (!token) return;
      const decoded = (jwtDecode as any)(token) as JwtPayload;
      if (decoded?.userId) setUserId(decoded.userId);
    } catch (err) {
      console.error("JWT decode error:", err);
    }
  }, []);

  // auth headers
  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("erp_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  /* ------------------ Load Sales (with filters) ------------------ */

  const loadSales = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      
      // Apply advanced filters
      appliedFilters.forEach(filter => {
        switch (filter.type) {
          case 'status':
            params.status = filter.value;
            break;
          case 'payment':
            params.paymentMethod = filter.value;
            break;
          case 'amount':
            if (filter.value === '0-1000') {
              params.minTotal = 0;
              params.maxTotal = 1000;
            } else if (filter.value === '1000-5000') {
              params.minTotal = 1000;
              params.maxTotal = 5000;
            } else if (filter.value === '5000-10000') {
              params.minTotal = 5000;
              params.maxTotal = 10000;
            } else if (filter.value === '10000+') {
              params.minTotal = 10000;
            }
            break;
          case 'customer':
            params.customerType = filter.value;
            break;
          case 'date':
            // Handle date filters
            if (filter.value === 'today') {
              const today = new Date();
              params.fromDate = today.toISOString().split('T')[0];
              params.toDate = today.toISOString().split('T')[0];
            } else if (filter.value === 'week') {
              const today = new Date();
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
              params.fromDate = weekAgo.toISOString().split('T')[0];
              params.toDate = today.toISOString().split('T')[0];
            }
            break;
        }
      });

      const res = await axios.get("/api/sales", { headers: getAuthHeaders(), params });
      let payload = res.data;
      
      if (Array.isArray(payload)) {
        setSales(payload);
        calculateStats(payload);
      } else if (payload?.data && Array.isArray(payload.data)) {
        setSales(payload.data);
        calculateStats(payload.data);
      } else if (payload?.sales && Array.isArray(payload.sales)) {
        setSales(payload.sales);
        calculateStats(payload.sales);
      } else {
        setSales([]);
        calculateStats([]);
      }
    } catch (err) {
      console.error("Failed to load sales:", err);
      setSales([]);
      calculateStats([]);
      addToast("Failed to load sales", "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [searchQuery, appliedFilters, getAuthHeaders, addToast]);

  const calculateStats = useCallback((salesData: Sale[]) => {
    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const pendingOrders = salesData.filter(sale => sale.status === 'pending').length;
    const averageOrder = totalSales > 0 ? totalRevenue / totalSales : 0;

    setStats({
      totalSales,
      totalRevenue,
      pendingOrders,
      averageOrder,
    });
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  /* ------------------ Sorting ------------------ */

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key,
        direction: 'asc'
      };
    });
  }, []);

  // Apply sorting to sales
  const sortedSales = useMemo(() => {
    if (!sortConfig) return sales;

    return [...sales].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.key) {
        case 'customer':
          aValue = a.customer?.name || 'Walk-in Customer';
          bValue = b.customer?.name || 'Walk-in Customer';
          break;
        case 'amount':
          aValue = Number(a.totalAmount);
          bValue = Number(b.totalAmount);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'payment':
          aValue = a.paymentMethod;
          bValue = b.paymentMethod;
          break;
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [sales, sortConfig]);

  /* ------------------ Customer Search ------------------ */

  const searchCustomers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }

    setSearchingCustomers(true);
    try {
      const res = await axios.get("/api/customers", {
        headers: getAuthHeaders(),
        params: { search: searchTerm, limit: 10 }
      });
      
      let customerData: Customer[] = [];
      const data = res.data;
      
      if (Array.isArray(data)) {
        customerData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        customerData = data.data;
      } else if (data?.customers && Array.isArray(data.customers)) {
        customerData = data.customers;
      }
      
      setCustomers(customerData);
      setShowCustomerDropdown(true);
    } catch (err) {
      console.error("Failed to search customers:", err);
      setCustomers([]);
    } finally {
      setSearchingCustomers(false);
    }
  }, [getAuthHeaders]);

  // Debounced customer search
  useEffect(() => {
    if (customerSearchRef.current) {
      clearTimeout(customerSearchRef.current);
    }

    customerSearchRef.current = setTimeout(() => {
      searchCustomers(customerSearch);
    }, 300);

    return () => {
      if (customerSearchRef.current) {
        clearTimeout(customerSearchRef.current);
      }
    };
  }, [customerSearch, searchCustomers]);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  }, []);

  const clearCustomerSelection = useCallback(() => {
    setSelectedCustomer(null);
    setCustomerId("");
    setCustomerSearch("");
    setCustomers([]);
  }, []);

  /* ------------------ Product search & subbrands ------------------ */

  useEffect(() => {
    let canceled = false;
    if (!productQuery || productQuery.trim().length === 0) {
      setProducts([]);
      return;
    }
    (async () => {
      try {
        const res = await axios.get("/api/products", { 
          headers: getAuthHeaders(), 
          params: { search: productQuery } 
        });
        const p = res.data;
        if (!canceled) {
          if (Array.isArray(p)) setProducts(p);
          else if (p?.products && Array.isArray(p.products)) setProducts(p.products);
          else if (p?.data && Array.isArray(p.data)) setProducts(p.data);
          else setProducts([]);
        }
      } catch (err) {
        console.error("product search error", err);
        if (!canceled) setProducts([]);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [productQuery, getAuthHeaders]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/brands/subbrands", { headers: getAuthHeaders() });
        const d = res.data;
        if (Array.isArray(d)) setSubbrands(d);
        else if (d?.data && Array.isArray(d.data)) setSubbrands(d.data);
        else setSubbrands([]);
      } catch (err) {
        console.error("Failed loading subbrands", err);
        setSubbrands([]);
      }
    })();
  }, [getAuthHeaders]);

  /* ------------------ Selected items logic ------------------ */

  const toggleProduct = useCallback((p: Product) => {
    const exists = selectedItems.find((s) => s.productId === p.id);
    if (exists) {
      setSelectedItems((prev) => prev.filter((s) => s.productId !== p.id));
      return;
    }
    setSelectedItems((prev) => [
      ...prev,
      {
        productId: p.id,
        quantity: 1,
        subtotal: 0,
        category: "drink",
        drinkPrice: "",
        bottlePrice: "",
        subbrandId: p.subbrand?.id || "",
        note: "",
      },
    ]);
  }, [selectedItems]);

  const updateItemField = useCallback((productId: string, changes: Partial<typeof selectedItems[number]>) => {
    setSelectedItems((prev) =>
      prev.map((it) => {
        if (it.productId !== productId) return it;
        const updated = { ...it, ...changes };

        const normalizedQuantity = Number(updated.quantity || 0);
        const normalizedDrink =
          updated.drinkPrice === "" || updated.drinkPrice === undefined || updated.drinkPrice === null
            ? 0
            : Number(updated.drinkPrice);
        const normalizedBottle =
          updated.bottlePrice === "" || updated.bottlePrice === undefined || updated.bottlePrice === null
            ? 0
            : Number(updated.bottlePrice);

        const newSubtotal = computeSubtotalForItem({
          category: updated.category,
          quantity: normalizedQuantity,
          drinkPrice: normalizedDrink,
          bottlePrice: normalizedBottle,
        });

        return {
          ...updated,
          quantity: normalizedQuantity,
          drinkPrice: updated.drinkPrice === "" ? "" : normalizedDrink,
          bottlePrice: updated.bottlePrice === "" ? "" : normalizedBottle,
          subtotal: Number(newSubtotal || 0),
        };
      })
    );
  }, []);

  // Grand total from selectedItems
  useEffect(() => {
    const tot = selectedItems.reduce((s, it) => s + Number(it.subtotal || 0), 0);
    setTotalAmount(tot);
  }, [selectedItems]);

  /* ------------------ Update Sale ------------------ */

  const handleUpdateSale = useCallback(async (sale: Sale) => {
    setUpdatingSale(true);
    try {
      const payload = {
        customerId: sale.customer?.id || null,
        paymentMethod: sale.paymentMethod,
        status: sale.status,
        note: sale.note || "",
        totalAmount: Number(sale.totalAmount || 0),
      };

      await axios.patch(`/api/sales/${sale.id}`, payload, { headers: getAuthHeaders() });
      addToast("Sale updated successfully", "success");
      setEditingSale(null);
      await loadSales();
    } catch (err) {
      console.error("Failed to update sale:", err);
      addToast("Failed to update sale", "error");
    } finally {
      setUpdatingSale(false);
    }
  }, [getAuthHeaders, addToast, loadSales]);

  /* ------------------ Delete Sale ------------------ */

  const handleDeleteSale = useCallback(async (saleId: string) => {
    setConfirmAction({
      type: 'delete-sale',
      id: saleId,
      message: "Are you sure you want to delete this sale? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await axios.delete(`/api/sales/${saleId}`, { headers: getAuthHeaders() });
          addToast("Sale deleted successfully", "success");
          await loadSales();
        } catch (err) {
          console.error("Failed to delete sale:", err);
          addToast("Failed to delete sale", "error");
        } finally {
          setConfirmAction(null);
        }
      }
    });
  }, [getAuthHeaders, addToast, loadSales]);

  /* ------------------ Update Sale Item ------------------ */

  const handleUpdateSaleItem = useCallback(async (saleId: string, itemId: string, updatedItem: any) => {
    setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
    try {
      // Calculate new subtotal
      const newSubtotal = computeSubtotalForItem({
        category: updatedItem.category,
        quantity: updatedItem.quantity,
        drinkPrice: updatedItem.drinkPrice,
        bottlePrice: updatedItem.bottlePrice,
      });

      const payload = {
        ...updatedItem,
        subtotal: newSubtotal,
      };

      // Update the sale item
      await axios.patch(`/api/sales/${saleId}/salesitem/${itemId}`, payload, { 
        headers: getAuthHeaders() 
      });

      // Recalculate and update sale total
      const currentSale = sales.find(s => s.id === saleId);
      if (currentSale) {
        const currentItems = viewItems.filter(item => item.id !== itemId);
        const updatedItems = [...currentItems, { ...updatedItem, id: itemId, subtotal: newSubtotal }];
        const newTotal = updatedItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

        await axios.patch(`/api/sales/${saleId}`, 
          { totalAmount: newTotal }, 
          { headers: getAuthHeaders() }
        );
      }

      addToast("Item updated successfully", "success");
      setEditingItems(prev => {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      });
      await loadSales();
      
      // Refresh view items
      if (showSaleDetails.saleId === saleId) {
        await openSaleDetails(saleId);
      }
    } catch (err) {
      console.error("Failed to update sale item:", err);
      addToast("Failed to update sale item", "error");
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  }, [sales, viewItems, showSaleDetails.saleId, getAuthHeaders, addToast, loadSales]);

  /* ------------------ Delete Sale Item ------------------ */

  const handleDeleteSaleItem = useCallback(async (saleId: string, itemId: string) => {
    setConfirmAction({
      type: 'delete-item',
      id: itemId,
      saleId,
      message: "Are you sure you want to delete this item? This will update the sale total.",
      onConfirm: async () => {
        try {
          // Get the item to be deleted to calculate total adjustment
          const itemToDelete = viewItems.find(item => item.id === itemId);
          
          // Delete the sale item
          await axios.delete(`/api/sales/${saleId}/salesitem/${itemId}`, { 
            headers: getAuthHeaders() 
          });

          // Update sale total by subtracting the deleted item's subtotal
          if (itemToDelete) {
            const currentSale = sales.find(s => s.id === saleId);
            if (currentSale) {
              const newTotal = Number(currentSale.totalAmount) - Number(itemToDelete.subtotal || 0);
              await axios.patch(`/api/sales/${saleId}`, 
                { totalAmount: Math.max(0, newTotal) }, 
                { headers: getAuthHeaders() }
              );
            }
          }

          addToast("Item deleted successfully", "success");
          await loadSales();
          
          // Refresh view items
          if (showSaleDetails.saleId === saleId) {
            await openSaleDetails(saleId);
          }
        } catch (err) {
          console.error("Failed to delete sale item:", err);
          addToast("Failed to delete sale item", "error");
        } finally {
          setConfirmAction(null);
        }
      }
    });
  }, [sales, viewItems, showSaleDetails.saleId, getAuthHeaders, addToast, loadSales]);

  /* ------------------ Create sale ------------------ */

  const handleCreateSale = useCallback(async () => {
    if (!userId) {
      addToast("You must be logged in to create a sale", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        customerId: customerId || null,
        paymentMethod,
        status,
        note,
        totalAmount: Number(totalAmount || 0),
        userId,
      };
      const res = await axios.post("/api/sales", payload, { headers: getAuthHeaders() });
      const created: Sale = res.data;
      if (!created?.id) throw new Error("Create sale returned invalid data");
      setSaleId(created.id);
      setShowSaleModal(false);
      setShowItemsModal(true);
      addToast("Sale created — you can now add items", "success");
      
      // Reset form
      setCustomerId("");
      setSelectedCustomer(null);
      setCustomerSearch("");
      setPaymentMethod("cash");
      setStatus("pending");
      setNote("");
      setTotalAmount(0);
      
      await loadSales();
    } catch (err) {
      console.error("Failed to create sale:", err);
      addToast("Failed to create sale", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, customerId, paymentMethod, status, note, totalAmount, getAuthHeaders, addToast, loadSales]);

  /* ------------------ Save sale items ------------------ */

  const handleSaveItems = useCallback(async () => {
    if (!saleId) {
      addToast("Select or create a sale first", "warning");
      return;
    }
    if (selectedItems.length === 0) {
      addToast("No items selected to save", "warning");
      return;
    }

    // Validate required prices by category
    for (const it of selectedItems) {
      if (it.category === "drink" && (!it.drinkPrice || Number(it.drinkPrice) <= 0)) {
        addToast("Please enter drink price for all drink items", "warning");
        return;
      }
      if (it.category === "bottle" && (!it.bottlePrice || Number(it.bottlePrice) <= 0)) {
        addToast("Please enter bottle price for all bottle items", "warning");
        return;
      }
      if (
        it.category === "both" &&
        ((!it.drinkPrice || Number(it.drinkPrice) <= 0) || (!it.bottlePrice || Number(it.bottlePrice) <= 0))
      ) {
        addToast("Please enter both prices for 'both' items", "warning");
        return;
      }
    }

    setSavingItems(true);
    try {
      // Check for existing items to prevent duplicates
      const existingRes = await axios.get(`/api/sales/${saleId}/salesitem`, { headers: getAuthHeaders() });
      let existing: SaleItemView[] = [];
      const er = existingRes.data;
      if (Array.isArray(er)) existing = er;
      else if (er?.data && Array.isArray(er.data)) existing = er.data;
      else if (er?.items && Array.isArray(er.items)) existing = er.items;
      else existing = [];

      // Check for duplicates and update quantity if same product exists
      const itemsToCreate = [];
      const itemsToUpdate = [];

      for (const selectedItem of selectedItems) {
        const existingItem = existing.find((ex: any) => ex.productId === selectedItem.productId);
        
        if (existingItem) {
          // Update quantity for existing item
          const newQuantity = existingItem.quantity + selectedItem.quantity;
          const newSubtotal = computeSubtotalForItem({
            category: existingItem.category as SaleCategory,
            quantity: newQuantity,
            drinkPrice: existingItem.drinkPrice,
            bottlePrice: existingItem.bottlePrice,
          });

          itemsToUpdate.push({
            itemId: existingItem.id,
            data: {
              quantity: newQuantity,
              subtotal: newSubtotal,
            }
          });
        } else {
          // Create new item
          itemsToCreate.push({
            productId: selectedItem.productId,
            subbrandId: selectedItem.subbrandId || "",
            category: selectedItem.category,
            quantity: Number(selectedItem.quantity),
            drinkPrice: selectedItem.drinkPrice === "" ? null : Number(selectedItem.drinkPrice ?? null),
            bottlePrice: selectedItem.bottlePrice === "" ? null : Number(selectedItem.bottlePrice ?? null),
            subtotal: Number(selectedItem.subtotal),
            note: selectedItem.note || "",
          });
        }
      }

      // Create new items
      if (itemsToCreate.length > 0) {
        await axios.post(`/api/sales/${saleId}/salesitem`, itemsToCreate, { headers: getAuthHeaders() });
      }

      // Update existing items
      for (const update of itemsToUpdate) {
        await axios.patch(`/api/sales/${saleId}/salesitem/${update.itemId}`, update.data, { 
          headers: getAuthHeaders() 
        });
      }

      // Update sale total
      const saleFetch = await axios.get("/api/sales", { headers: getAuthHeaders(), params: { saleId } });
      let existingSaleTotal = 0;
      const sr = saleFetch.data;
      if (Array.isArray(sr)) {
        const found = sr.find((s: any) => s.id === saleId);
        existingSaleTotal = found ? Number(found.totalAmount || 0) : 0;
      } else if (sr?.data && Array.isArray(sr.data)) {
        const found = sr.data.find((s: any) => s.id === saleId);
        existingSaleTotal = found ? Number(found.totalAmount || 0) : 0;
      } else if (sr?.totalAmount !== undefined) {
        existingSaleTotal = Number(sr.totalAmount || 0);
      } else if (sr?.sales && Array.isArray(sr.sales)) {
        const found = sr.sales.find((s: any) => s.id === saleId);
        existingSaleTotal = found ? Number(found.totalAmount || 0) : 0;
      }

      const addedTotal = selectedItems.reduce((s, x) => s + Number(x.subtotal || 0), 0);
      const newTotal = Number(existingSaleTotal) + Number(addedTotal);

      await axios.patch(
        `/api/sales/${saleId}`,
        { totalAmount: newTotal },
        { headers: getAuthHeaders() }
      );

      if (itemsToUpdate.length > 0) {
        addToast(`Items saved - ${itemsToCreate.length} new items added, ${itemsToUpdate.length} existing items updated`, "success");
      } else {
        addToast("Items saved successfully", "success");
      }

      // cleanup UI
      setSelectedItems([]);
      setSaleId(null);
      setShowItemsModal(false);
      await loadSales();
    } catch (err) {
      console.error("Failed to save items:", err);
      addToast("Failed to save items. Check server logs", "error");
    } finally {
      if (mountedRef.current) setSavingItems(false);
    }
  }, [saleId, selectedItems, getAuthHeaders, addToast, loadSales]);

  /* ------------------ View sale details (items) ------------------ */

  const openSaleDetails = useCallback(async (id: string) => {
    setShowSaleDetails({ open: true, saleId: id });
    setViewItemsLoading(true);
    try {
      const res = await axios.get(`/api/sales/${id}/salesitem`, { headers: getAuthHeaders() });
      const d = res.data;
      if (Array.isArray(d)) setViewItems(d);
      else if (d?.data && Array.isArray(d.data)) setViewItems(d.data);
      else if (d?.items && Array.isArray(d.items)) setViewItems(d.items);
      else if (d?.saleItems && Array.isArray(d.saleItems)) setViewItems(d.saleItems);
      else {
        if (d && typeof d === "object" && d.id) setViewItems([d]);
        else setViewItems([]);
      }
    } catch (err) {
      console.error("Failed fetching sale items:", err);
      setViewItems([]);
      addToast("Failed to fetch sale items", "error");
    } finally {
      if (mountedRef.current) setViewItemsLoading(false);
    }
  }, [getAuthHeaders, addToast]);

  const closeSaleDetails = useCallback(() => {
    setShowSaleDetails({ open: false });
    setViewItems([]);
    setEditingItems({});
  }, []);

  const toggleExpandSale = useCallback((saleId: string) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  }, [expandedSale]);

  /* ------------------ Filter Handlers ------------------ */

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFiltersChange = useCallback((filters: AppliedFilter[]) => {
    setAppliedFilters(filters);
  }, []);

  const handleQuickFilter = useCallback((filter: AppliedFilter) => {
    // Check if this quick filter is already applied
    const existingIndex = appliedFilters.findIndex(f => f.id === filter.id);
    
    if (existingIndex >= 0) {
      // Remove if already applied
      const newFilters = [...appliedFilters];
      newFilters.splice(existingIndex, 1);
      setAppliedFilters(newFilters);
    } else {
      // Add the quick filter
      setAppliedFilters(prev => [...prev, filter]);
    }
  }, [appliedFilters]);

  const handleButtonClick = useCallback((buttonData: { label: string; action: string; timestamp: Date; data?: any }) => {
    console.log('Navbar button clicked:', buttonData);
    
    switch (buttonData.action) {
      case 'new_sale':
        setShowSaleModal(true);
        break;
      case 'add_items':
        setShowItemsModal(true);
        break;
      case 'refresh_data':
        loadSales();
        break;
      default:
        console.log('Unknown button action:', buttonData.action);
    }
  }, [loadSales]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'partially_paid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }, []);

  const getCustomerTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'bar': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'individual': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shop': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'restaurant': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }, []);

  const getPaymentMethodColor = useCallback((method: string) => {
    switch (method) {
      case 'cash': return 'bg-green-500/20 text-green-400';
      case 'transfer': return 'bg-blue-500/20 text-blue-400';
      case 'credit': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }, []);

  // Memoized navbar buttons
  const navbarButtons = useMemo(() => [
    {
      label: "New Sale",
      onClick: () => {},
      actionType: "new_sale",
      icon: <PlusCircle className="w-4 h-4" />,
      className: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
    },
    {
      label: "Add Items",
      onClick: () => {},
      actionType: "add_items", 
      icon: <ShoppingCart className="w-4 h-4" />,
      variant: "outline" as const,
      className: "bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
    },
    {
      label: "Refresh",
      onClick: () => {},
      actionType: "refresh_data",
      icon: <RefreshCw className="w-4 h-4" />,
      variant: "outline" as const,
      className: "bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
    }
  ], []);

  // Memoized quick stats
  const quickStats = useMemo<
    {
      label: string;
      value: string;
      icon: React.ReactNode;
      trend?: "up" | "down" | "neutral";
    }[]
  >(() => [
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: <DollarSign className="w-3 h-3 text-green-400" />,
      trend: "up"
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders.toString(),
      icon: <Package className="w-3 h-3 text-yellow-400" />,
      trend: (stats.pendingOrders > 0 ? "up" : "neutral")
    },
    {
      label: "Total Sales",
      value: stats.totalSales.toString(),
      icon: <ShoppingBag className="w-3 h-3 text-blue-400" />,
      trend: "up"
    }
  ], [stats]);

  // Memoized view mode buttons
  const viewModeButtons = useMemo(() => [
    {
      label: "Card View",
      onClick: () => setViewMode('card'),
      icon: <LayoutGrid className="w-4 h-4" />,
      variant: viewMode === 'card' ? "default" as const : "outline" as const,
      className: viewMode === 'card' 
        ? "bg-blue-600 text-white" 
        : "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
    },
    {
      label: "Table View", 
      onClick: () => setViewMode('table'),
      icon: <Table className="w-4 h-4" />,
      variant: viewMode === 'table' ? "default" as const : "outline" as const,
      className: viewMode === 'table'
        ? "bg-blue-600 text-white"
        : "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
    },
    {
      label: "List View",
      onClick: () => setViewMode('list'),
      icon: <List className="w-4 h-4" />,
      variant: viewMode === 'list' ? "default" as const : "outline" as const,
      className: viewMode === 'list'
        ? "bg-blue-600 text-white" 
        : "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
    }
  ], [viewMode]);

  /* ------------------ UI - Render ------------------ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Advanced Navbar */}
      <AdvancedNavbar
        navTitle="Sales Dashboard"
        onButtonClick={handleButtonClick}
        createButtons={navbarButtons}
        theme="sales"
        quickStats={quickStats}
        className="border-b border-green-500/20"
        enabledFeatures={{
          search: false,
          filters: false,
          title: true,
          createButtons: true
        }}
      />

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Toasts */}
        <div className="fixed top-20 right-4 z-50 flex flex-col-reverse gap-3">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={`w-80 p-4 rounded-xl shadow-lg border backdrop-blur-sm ${
                  t.kind === "success"
                    ? "bg-green-600/90 border-green-500"
                    : t.kind === "error"
                    ? "bg-red-600/90 border-red-500"
                    : t.kind === "warning"
                    ? "bg-yellow-600/90 border-yellow-500"
                    : "bg-blue-600/90 border-blue-500"
                } flex justify-between items-start gap-3`}
              >
                <div className="flex-1">
                  <div className="font-semibold capitalize flex items-center gap-2">
                    {t.kind === "success" && <CheckCircle size={16} />}
                    {t.kind === "error" && <AlertTriangle size={16} />}
                    {t.kind === "warning" && <AlertTriangle size={16} />}
                    {t.kind}
                  </div>
                  <div className="text-sm text-white/90 mt-1">{t.message}</div>
                </div>
                <button 
                  onClick={() => removeToast(t.id)} 
                  className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition"
                  aria-label="close"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {confirmAction && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-yellow-500" size={24} />
                  <h3 className="text-lg font-semibold">Confirm Action</h3>
                </div>
                
                <p className="text-gray-300 mb-6">{confirmAction.message}</p>
                
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition font-medium"
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition font-medium flex items-center gap-2"
                    onClick={confirmAction.onConfirm}
                  >
                    <Trash2 size={16} />
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Sales"
            value={stats.totalSales.toString()}
            change="+12% from last month"
            trend="up"
            icon={<ShoppingBag className="w-6 h-6 text-blue-400" />}
            color="bg-blue-500"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            change="+8% from last month"
            trend="up"
            icon={<DollarSign className="w-6 h-6 text-green-400" />}
            color="bg-green-500"
          />
          <StatsCard
            title="Pending Orders"
            value={stats.pendingOrders.toString()}
            change="-3% from last week"
            trend="down"
            icon={<Package className="w-6 h-6 text-yellow-400" />}
            color="bg-yellow-500"
          />
          <StatsCard
            title="Average Order"
            value={formatCurrency(stats.averageOrder)}
            change="+5% from last month"
            trend="up"
            icon={<BarChart3 className="w-6 h-6 text-purple-400" />}
            color="bg-purple-500"
          />
        </div>

        {/* Search and Filter System */}
        <SearchAndFilterSystem
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          appliedFilters={appliedFilters}
          onFiltersChange={handleFiltersChange}
          sales={sales}
          onQuickFilter={handleQuickFilter}
        />

        {/* View Controls and Quick Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center my-8 gap-4">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {viewModeButtons.map((button, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={button.onClick}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  button.variant === 'default' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {button.icon}
                {button.label}
              </motion.button>
            ))}
          </div>

          {/* Results Count and Sort */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{sortedSales.length} sales found</span>
            {appliedFilters.length > 0 && (
              <span className="flex items-center gap-1">
                <Filter size={14} />
                {appliedFilters.length} filter{appliedFilters.length !== 1 ? 's' : ''} applied
              </span>
            )}
          </div>
        </div>

        {/* Sales Content based on View Mode */}
        <section className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center p-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700">
              <Loader2 className="animate-spin text-green-400" size={32} />
            </div>
          ) : sortedSales.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700"
            >
              <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {appliedFilters.length > 0 || searchQuery ? "No matching sales found" : "No Sales Found"}
              </h3>
              <p className="text-gray-400 mb-6">
                {appliedFilters.length > 0 || searchQuery 
                  ? "Try adjusting your filters or search query" 
                  : "Get started by creating your first sale"
                }
              </p>
              {(appliedFilters.length > 0 || searchQuery) && (
                <button
                  onClick={() => {
                    setAppliedFilters([]);
                    setSearchQuery('');
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2 mx-auto"
                >
                  <RotateCcw size={16} />
                  Clear Filters & Search
                </button>
              )}
            </motion.div>
          ) : viewMode === 'table' ? (
            <SalesTable
              sales={sortedSales}
              onViewItems={openSaleDetails}
              onAddItems={(saleId) => { setSaleId(saleId); setShowItemsModal(true); }}
              onEdit={setEditingSale}
              onDelete={handleDeleteSale}
              onExpand={toggleExpandSale}
              expandedSale={expandedSale}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          ) : (
            /* Card View (Default) */
            sortedSales.map((sale) => (
              <motion.article
                key={sale.id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-all"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* Sale Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-750/50 transition"
                  onClick={() => toggleExpandSale(sale.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {sale.customer ? (
                          <>
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <User size={16} className="text-blue-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-lg flex items-center gap-2">
                                {sale.customer.name}
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getCustomerTypeColor(sale.customer.type)}`}>
                                  {sale.customer.type}
                                </span>
                              </div>
                              <div className="text-sm text-gray-400 mt-1 flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  {sale.customer?.address || "No address"}
                                </div>
                                {sale.customer?.phones?.[0] && (
                                  <div className="flex items-center gap-1">
                                    <Phone size={14} />
                                    {sale.customer.phones[0].phoneNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-500/20 rounded-lg">
                              <User size={16} className="text-gray-400" />
                            </div>
                            <span className="text-gray-400 text-lg font-semibold">Walk-in Customer</span>
                          </div>
                        )}
                      </div>

                      {sale.note && (
                        <div className="text-sm text-gray-500 mt-2 italic bg-gray-750/50 p-2 rounded-lg">"{sale.note}"</div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-xl">
                        {formatCurrency(Number(sale.totalAmount))}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{formatDate(sale.createdAt)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(sale.status)}`}>
                        {sale.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getPaymentMethodColor(sale.paymentMethod)}`}>
                        {sale.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openSaleDetails(sale.id);
                        }} 
                        className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition flex items-center gap-2"
                      >
                        <Eye size={14} />
                        View Items
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSaleId(sale.id);
                          setShowItemsModal(true);
                        }}
                        className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm transition flex items-center gap-2"
                      >
                        <PlusCircle size={14} />
                        Add Items
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSale(sale);
                        }}
                        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm transition flex items-center gap-2"
                      >
                        <Edit size={14} />
                        Edit
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSale(sale.id);
                        }}
                        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm transition flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </div>
                

                {/* Expanded Sale Details */}
                <AnimatePresence>
                  {expandedSale === sale.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-700 p-6 bg-gray-850/50">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400 font-medium mb-1">Sale ID</div>
                            <div className="font-mono text-green-400 text-xs">{sale.id}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 font-medium mb-1">Created</div>
                            <div>{formatDate(sale.createdAt)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 font-medium mb-1">Status</div>
                            <div className="capitalize">{sale.status}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 font-medium mb-1">Payment Method</div>
                            <div className="capitalize">{sale.paymentMethod}</div>
                          </div>
                          {sale.customer && (
                            <>
                              <div>
                                <div className="text-gray-400 font-medium mb-1">Customer Type</div>
                                <div className="capitalize">{sale.customer.type}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 font-medium mb-1">Customer Address</div>
                                <div>{sale.customer.address}</div>
                              </div>
                              {sale.customer.phones && sale.customer.phones.length > 0 && (
                                <div>
                                  <div className="text-gray-400 font-medium mb-1">Phone</div>
                                  <div>{sale.customer.phones[0].phoneNumber}</div>
                                </div>
                              )}
                            </>
                          )}
                          {sale.note && (
                            <div className="md:col-span-2 lg:col-span-4">
                              <div className="text-gray-400 font-medium mb-1">Note</div>
                              <div className="italic">{sale.note}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))
          )}
        </section>
      </div>

      {/* Edit Sale Modal */}
      <AnimatePresence>
        {editingSale && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-blue-400">Edit Sale</h3>
                <X 
                  className="cursor-pointer hover:bg-gray-700 rounded-lg p-1 transition" 
                  size={24}
                  onClick={() => setEditingSale(null)} 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-2 block">Customer</label>
                  <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                    {editingSale.customer ? (
                      <div>
                        <div className="font-medium">{editingSale.customer.name}</div>
                        <div className="text-sm text-gray-400">{editingSale.customer.address}</div>
                        <div className="text-xs text-gray-500 capitalize">{editingSale.customer.type}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400">Walk-in Customer</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 font-medium mb-2 block">Payment Method</label>
                    <select 
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                      value={editingSale.paymentMethod} 
                      onChange={(e) => setEditingSale({
                        ...editingSale, 
                        paymentMethod: e.target.value as "cash" | "transfer" | "credit"
                      })}
                    >
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 font-medium mb-2 block">Status</label>
                    <select 
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                      value={editingSale.status} 
                      onChange={(e) => setEditingSale({
                        ...editingSale, 
                        status: e.target.value as "pending" | "completed" | "cancelled" | "partially_paid"
                      })}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="partially_paid">Partially Paid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 font-medium mb-2 block">Note</label>
                  <textarea 
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition resize-none"
                    placeholder="Add a note about this sale..."
                    rows={3}
                    value={editingSale.note || ""} 
                    onChange={(e) => setEditingSale({...editingSale, note: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 font-medium mb-2 block">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                    value={Number(editingSale.totalAmount)}
                    onChange={(e) => setEditingSale({
                      ...editingSale, 
                      totalAmount: Number(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition font-medium" 
                  onClick={() => setEditingSale(null)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium flex items-center gap-2" 
                  onClick={() => handleUpdateSale(editingSale)}
                  disabled={updatingSale}
                >
                  {updatingSale && <Loader2 className="animate-spin" size={16} />} 
                  Update Sale
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Sale Modal with Customer Search */}
      <AnimatePresence>
        {showSaleModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-green-400">Create New Sale</h3>
                <X 
                  className="cursor-pointer hover:bg-gray-700 rounded-lg p-1 transition" 
                  size={24}
                  onClick={() => {
                    setShowSaleModal(false);
                    clearCustomerSelection();
                  }} 
                />
              </div>

              <div className="space-y-4">
                {/* Customer Search Field */}
                <div className="relative">
                  <label className="text-sm text-gray-400 font-medium mb-2 block">Customer (Optional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition pr-10"
                      placeholder="Search customers by name, address, or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() => {
                        if (customerSearch && customers.length === 0) {
                          searchCustomers(customerSearch);
                        }
                      }}
                    />
                    {customerSearch && (
                      <button
                        onClick={clearCustomerSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {searchingCustomers ? (
                        <div className="p-4 text-center text-gray-400">
                          <Loader2 className="animate-spin inline mr-2" size={16} />
                          Searching customers...
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                          No customers found
                        </div>
                      ) : (
                        customers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-3 border-b border-gray-700 hover:bg-gray-750 cursor-pointer transition"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-white flex items-center gap-2">
                                  {customer.name}
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getCustomerTypeColor(customer.type)}`}>
                                    {customer.type}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                  <MapPin size={12} />
                                  {customer.address}
                                </div>
                                {customer.phones && customer.phones.length > 0 && (
                                  <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                    <Phone size={12} />
                                    {customer.phones[0].phoneNumber}
                                    {customer.phones[0].contactName && ` (${customer.phones[0].contactName})`}
                                  </div>
                                )}
                              </div>
                              {selectedCustomer?.id === customer.id && (
                                <Check size={16} className="text-green-400 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Customer Display */}
                {selectedCustomer && (
                  <div className="bg-green-900/20 border border-green-700 rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-green-400 flex items-center gap-2">
                          <User size={16} />
                          {selectedCustomer.name}
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getCustomerTypeColor(selectedCustomer.type)}`}>
                            {selectedCustomer.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mt-1">{selectedCustomer.address}</div>
                        {selectedCustomer.phones && selectedCustomer.phones.length > 0 && (
                          <div className="text-sm text-gray-300 mt-1">
                            📞 {selectedCustomer.phones[0].phoneNumber}
                            {selectedCustomer.phones[0].contactName && ` (${selectedCustomer.phones[0].contactName})`}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={clearCustomerSelection}
                        className="text-gray-400 hover:text-white transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 font-medium mb-2 block">Payment Method</label>
                    <select 
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                    >
                      <option value="cash">Cash</option>
                      <option value="transfer">Transfer</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 font-medium mb-2 block">Status</label>
                    <select 
                      className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
                      value={status} 
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="partially_paid">Partially Paid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 font-medium mb-2 block">Note (Optional)</label>
                  <textarea 
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition resize-none"
                    placeholder="Add a note about this sale..."
                    rows={3}
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                  />
                </div>

                <div className="bg-gray-750 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-300">Initial total (add items later to update)</div>
                    <div className="text-green-400 font-semibold text-lg">{formatCurrency(totalAmount)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition font-medium" 
                  onClick={() => {
                    setShowSaleModal(false);
                    clearCustomerSelection();
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition font-medium flex items-center gap-2" 
                  onClick={handleCreateSale}
                  disabled={loading}
                >
                  {loading && <Loader2 className="animate-spin" size={16} />} 
                  Create Sale
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Items Modal */}
      <AnimatePresence>
        {showItemsModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-auto py-8 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-700"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-green-400">Add Items to Sale</h3>
                <X 
                  className="cursor-pointer hover:bg-gray-700 rounded-lg p-1 transition" 
                  onClick={() => setShowItemsModal(false)} 
                />
              </div>

              <div className="mb-6 grid md:grid-cols-3 gap-4">
                <select
                  className="p-3 rounded-lg bg-gray-700 border border-gray-600 text-white md:col-span-2 focus:border-green-500 focus:outline-none transition"
                  value={saleId || ""}
                  onChange={(e) => setSaleId(e.target.value || null)}
                >
                  <option value="">Select existing sale to add items (or create a new sale first)</option>
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.customer?.name || "Walk-in Customer"} — {s.paymentMethod} — {formatCurrency(Number(s.totalAmount))}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    className="p-3 rounded-lg bg-gray-700 border border-gray-600 w-full focus:border-green-500 focus:outline-none transition"
                    placeholder="Search products..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  <button
                    className="px-3 rounded-lg bg-gray-700 border border-gray-600 hover:bg-gray-600 transition"
                    onClick={() => {
                      setProductQuery("");
                      setProducts([]);
                    }}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 max-h-60 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="col-span-full text-gray-400 p-4 text-center">
                    {productQuery ? "No products found. Try a different search term." : "Search for products to add items."}
                  </div>
                ) : (
                  products.map((p) => {
                    const chosen = selectedItems.find((s) => s.productId === p.id);
                    return (
                      <motion.div
                        key={p.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleProduct(p)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          chosen 
                            ? "border-green-500 bg-green-900/20 hover:bg-green-900/30" 
                            : "border-gray-700 hover:border-green-500 hover:bg-gray-750"
                        }`}
                      >
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-gray-400 mt-1">Category: {p.category || "—"}</div>
                        <div className="text-sm text-gray-400 mt-2">Enter prices manually below</div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Selected items list */}
              <div className="space-y-4 max-h-[45vh] overflow-y-auto mb-6">
                {selectedItems.map((it) => {
                  const prod = products.find((p) => p.id === it.productId) ?? { name: "Unknown", id: it.productId } as any;
                  return (
                    <motion.div 
                      key={it.productId} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800 p-4 rounded-xl border border-gray-700"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-green-400 font-semibold">{prod.name}</div>
                          <div className="text-sm text-gray-400">{it.subbrandId ? (subbrands.find((s) => s.id === it.subbrandId)?.name ?? "") : ""}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-300">Subtotal</div>
                          <div className="text-green-400 font-bold">{Number(it.subtotal || 0).toFixed(2)} Br</div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-3 mt-4">
                        <select
                          className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
                          value={it.category}
                          onChange={(e) => updateItemField(it.productId, { category: e.target.value as SaleCategory })}
                        >
                          <option value="drink">Drink</option>
                          <option value="bottle">Bottle</option>
                          <option value="both">Both</option>
                        </select>

                        <input
                          type="number"
                          min={1}
                          className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
                          value={it.quantity}
                          onChange={(e) => updateItemField(it.productId, { quantity: Number(e.target.value || 0) })}
                        />

                        {["drink", "both"].includes(it.category) && (
                          <input
                            type="number"
                            step="0.01"
                            className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
                            placeholder="Drink price"
                            value={it.drinkPrice ?? ""}
                            onChange={(e) =>
                              updateItemField(it.productId, { drinkPrice: e.target.value === "" ? "" : Number(e.target.value) })
                            }
                          />
                        )}

                        {["bottle", "both"].includes(it.category) && (
                          <input
                            type="number"
                            step="0.01"
                            className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
                            placeholder="Bottle price"
                            value={it.bottlePrice ?? ""}
                            onChange={(e) =>
                              updateItemField(it.productId, { bottlePrice: e.target.value === "" ? "" : Number(e.target.value) })
                            }
                          />
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mt-4">
                        <select
                          className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
                          value={it.subbrandId || ""}
                          onChange={(e) => updateItemField(it.productId, { subbrandId: e.target.value })}
                        >
                          <option value="">Select Subbrand</option>
                          {subbrands.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.brand.name} - {s.name}
                            </option>
                          ))}
                        </select>

                        <input
                          className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
                          placeholder="Note (optional)"
                          value={it.note ?? ""}
                          onChange={(e) => updateItemField(it.productId, { note: e.target.value })}
                        />
                      </div>

                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                          Computed: {it.category === "both" ? "(drink + bottle) x qty" : it.category === "drink" ? "drink x qty" : "bottle x qty"}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                            onClick={() => setSelectedItems((prev) => prev.filter((x) => x.productId !== it.productId))}
                          >
                            Remove
                          </button>
                          <button
                            className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 transition"
                            onClick={() => updateItemField(it.productId, { quantity: it.quantity || 1 })}
                          >
                            Recalc
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-green-400 font-semibold text-lg">Total: {formatCurrency(totalAmount)}</div>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition font-medium" 
                    onClick={() => setShowItemsModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition font-medium flex items-center gap-2" 
                    onClick={handleSaveItems} 
                    disabled={savingItems}
                  >
                    {savingItems && <Loader2 className="animate-spin" size={16} />} 
                    Save Items
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sale details popover (items) */}
      <AnimatePresence>
        {showSaleDetails.open && showSaleDetails.saleId && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700"
              initial={{ y: 20 }} 
              animate={{ y: 0 }} 
              exit={{ y: 20 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-green-400">Sale Items</h3>
                <div className="flex gap-2 items-center">
                  <button 
                    className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition" 
                    onClick={closeSaleDetails}
                  >
                    Close
                  </button>
                  <X 
                    className="cursor-pointer hover:bg-gray-700 rounded-lg p-1 transition" 
                    onClick={closeSaleDetails} 
                  />
                </div>
              </div>

              {viewItemsLoading ? (
                <div className="flex items-center justify-center p-6 flex-1">
                  <Loader2 className="animate-spin text-green-400" />
                </div>
              ) : viewItems.length === 0 ? (
                <div className="text-gray-400 p-4 text-center flex-1">No items found for this sale.</div>
              ) : (
                <div className="space-y-4 overflow-y-auto flex-1">
                  {viewItems.map((it) => {
                    const isEditing = editingItems[it.id];
                    const item = isEditing ? editingItems[it.id] : it;
                    
                    return (
                      <motion.div 
                        key={it.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-800 p-4 rounded-xl border border-gray-700"
                      >
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold text-blue-400">{item.product?.name || "Product"}</div>
                                <div className="text-sm text-gray-400">Editing...</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-300">Subtotal</div>
                                <div className="text-green-400 font-bold">
                                  {computeSubtotalForItem({
                                    category: item.category as SaleCategory,
                                    quantity: item.quantity,
                                    drinkPrice: item.drinkPrice,
                                    bottlePrice: item.bottlePrice,
                                  }).toFixed(2)} Br
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-4 gap-3">
                              <select
                                className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                                value={item.category}
                                onChange={(e) => setEditingItems(prev => ({
                                  ...prev,
                                  [it.id]: { ...item, category: e.target.value }
                                }))}
                              >
                                <option value="drink">Drink</option>
                                <option value="bottle">Bottle</option>
                                <option value="both">Both</option>
                              </select>

                              <input
                                type="number"
                                min={1}
                                className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                                value={item.quantity}
                                onChange={(e) => setEditingItems(prev => ({
                                  ...prev,
                                  [it.id]: { ...item, quantity: Number(e.target.value) }
                                }))}
                              />

                              {["drink", "both"].includes(item.category) && (
                                <input
                                  type="number"
                                  step="0.01"
                                  className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                                  placeholder="Drink price"
                                  value={item.drinkPrice || ""}
                                  onChange={(e) => setEditingItems(prev => ({
                                    ...prev,
                                    [it.id]: { ...item, drinkPrice: e.target.value ? Number(e.target.value) : null }
                                  }))}
                                />
                              )}

                              {["bottle", "both"].includes(item.category) && (
                                <input
                                  type="number"
                                  step="0.01"
                                  className="p-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                                  placeholder="Bottle price"
                                  value={item.bottlePrice || ""}
                                  onChange={(e) => setEditingItems(prev => ({
                                    ...prev,
                                    [it.id]: { ...item, bottlePrice: e.target.value ? Number(e.target.value) : null }
                                  }))}
                                />
                              )}
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                                onClick={() => setEditingItems(prev => {
                                  const newItems = { ...prev };
                                  delete newItems[it.id];
                                  return newItems;
                                })}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2"
                                onClick={() => handleUpdateSaleItem(showSaleDetails.saleId!, it.id, item)}
                                disabled={updatingItems[it.id]}
                              >
                                {updatingItems[it.id] && <Loader2 className="animate-spin" size={14} />}
                                <Save size={14} />
                                Update
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold">{it.product?.name || "Product"}</div>
                              <div className="text-sm text-gray-400">
                                {it.subbrand?.name || ""} • {it.category} • {it.quantity}x
                              </div>
                              {it.note && (
                                <div className="text-xs text-gray-500 mt-1">Note: {it.note}</div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                Prices: Drink: {it.drinkPrice || "0"} ETB | Bottle: {it.bottlePrice || "0"} ETB
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-bold">{Number(it.subtotal || 0).toFixed(2)} ETB</div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => setEditingItems(prev => ({ ...prev, [it.id]: it }))}
                                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm flex items-center gap-2 transition"
                                >
                                  <Edit size={14} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSaleItem(showSaleDetails.saleId!, it.id)}
                                  className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm flex items-center gap-2 transition"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
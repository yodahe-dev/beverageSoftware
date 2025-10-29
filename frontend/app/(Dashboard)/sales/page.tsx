"use client";

import React, { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import {jwtDecode} from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";

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

/* --------------------------- Toasts -------------------------------- */

type ToastKind = "success" | "error" | "info" | "warning";
interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = (message: string, kind: ToastKind = "info", ms = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((t) => [{ id, message, kind }, ...t]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  };
  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));
  return { toasts, add, remove };
}

/* --------------------------- Component ----------------------------- */

export default function SalesPage() {
  // Data lists
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subbrands, setSubbrands] = useState<Subbrand[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

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

  // Filters & search
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPayment, setFilterPayment] = useState<string>("");
  const [totalRange, setTotalRange] = useState<
    | ""
    | "under1k"
    | "1k-3k"
    | "3k-10k"
    | "10k-20k"
    | "20k-30k"
    | "30k-plus"
    | "custom"
  >("");
  const [customMin, setCustomMin] = useState<string>("");
  const [customMax, setCustomMax] = useState<string>("");
  const [customerType, setCustomerType] = useState<string>("");

  // Search states
  const [productQuery, setProductQuery] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

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
  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("erp_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /* ------------------ Load Sales (with filters) ------------------ */

  const loadSales = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPayment) params.paymentMethod = filterPayment;
      if (customerType) params.customerType = customerType;

      if (totalRange && totalRange !== "custom") {
        switch (totalRange) {
          case "under1k":
            params.minTotal = 0;
            params.maxTotal = 1000;
            break;
          case "1k-3k":
            params.minTotal = 1000;
            params.maxTotal = 3000;
            break;
          case "3k-10k":
            params.minTotal = 3000;
            params.maxTotal = 10000;
            break;
          case "10k-20k":
            params.minTotal = 10000;
            params.maxTotal = 20000;
            break;
          case "20k-30k":
            params.minTotal = 20000;
            params.maxTotal = 30000;
            break;
          case "30k-plus":
            params.minTotal = 30001;
            break;
        }
      } else if (totalRange === "custom") {
        if (customMin) params.minTotal = customMin;
        if (customMax) params.maxTotal = customMax;
      }

      const res = await axios.get("/api/sales", { headers: getAuthHeaders(), params });
      let payload = res.data;
      
      if (Array.isArray(payload)) {
        setSales(payload);
      } else if (payload?.data && Array.isArray(payload.data)) {
        setSales(payload.data);
      } else if (payload?.sales && Array.isArray(payload.sales)) {
        setSales(payload.sales);
      } else {
        setSales([]);
      }
    } catch (err) {
      console.error("Failed to load sales:", err);
      setSales([]);
      addToast("Failed to load sales", "error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  /* ------------------ Customer Search ------------------ */

  const searchCustomers = async (searchTerm: string) => {
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
  };

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
  }, [customerSearch]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerId("");
    setCustomerSearch("");
    setCustomers([]);
  };

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
  }, [productQuery]);

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
  }, []);

  /* ------------------ Selected items logic ------------------ */

  const toggleProduct = (p: Product) => {
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
  };

  const updateItemField = (productId: string, changes: Partial<typeof selectedItems[number]>) => {
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
  };

  // Grand total from selectedItems
  useEffect(() => {
    const tot = selectedItems.reduce((s, it) => s + Number(it.subtotal || 0), 0);
    setTotalAmount(tot);
  }, [selectedItems]);

  /* ------------------ Update Sale ------------------ */

  const handleUpdateSale = async (sale: Sale) => {
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
  };

  /* ------------------ Delete Sale ------------------ */

  const handleDeleteSale = async (saleId: string) => {
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
  };

  /* ------------------ Update Sale Item ------------------ */

  const handleUpdateSaleItem = async (saleId: string, itemId: string, updatedItem: any) => {
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
  };

  /* ------------------ Delete Sale Item ------------------ */

  const handleDeleteSaleItem = async (saleId: string, itemId: string) => {
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
  };

  /* ------------------ Create sale ------------------ */

  const handleCreateSale = async () => {
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
  };

  /* ------------------ Save sale items ------------------ */

  const handleSaveItems = async () => {
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
  };

  /* ------------------ View sale details (items) ------------------ */

  const openSaleDetails = async (id: string) => {
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
  };

  const closeSaleDetails = () => {
    setShowSaleDetails({ open: false });
    setViewItems([]);
    setEditingItems({});
  };

  const toggleExpandSale = (saleId: string) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  /* ------------------ Filter submit ------------------ */

  const handleFilterSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await loadSales();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-700';
      case 'pending': return 'bg-yellow-600';
      case 'cancelled': return 'bg-red-700';
      case 'partially_paid': return 'bg-blue-600';
      default: return 'bg-gray-700';
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'bar': return 'bg-purple-600';
      case 'individual': return 'bg-blue-600';
      case 'shop': return 'bg-orange-600';
      case 'restaurant': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  /* ------------------ UI - Render ------------------ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col-reverse gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`w-80 p-4 rounded-lg shadow-lg border ${
                t.kind === "success"
                  ? "bg-green-700 border-green-600"
                  : t.kind === "error"
                  ? "bg-red-700 border-red-600"
                  : t.kind === "warning"
                  ? "bg-yellow-600 border-yellow-500"
                  : "bg-gray-800 border-gray-700"
              } flex justify-between items-start gap-3`}
            >
              <div className="flex-1">
                <div className="font-semibold capitalize">{t.kind}</div>
                <div className="text-sm text-gray-200 mt-1">{t.message}</div>
              </div>
              <button 
                onClick={() => removeToast(t.id)} 
                className="flex-shrink-0 hover:bg-white/10 rounded p-1 transition"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-md shadow-lg border border-gray-700"
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
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition font-medium"
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 transition font-medium flex items-center gap-2"
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

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="text-green-400" /> Sales Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Fast sales entry & management — prices entered by user; totals update automatically.
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => {
              setShowSaleModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-black px-4 py-2 rounded-lg font-semibold transition"
          >
            <PlusCircle /> Create Sale
          </button>

          <button
            onClick={() => {
              setShowItemsModal(true);
            }}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition"
          >
            <PlusCircle /> Add Items to Sale
          </button>
        </div>
      </header>

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="bg-gray-800 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
            placeholder="Search customers, address, note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="bg-gray-700 p-2 rounded text-sm border border-gray-600"
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="partially_paid">Partially Paid</option>
        </select>

        <select 
          className="bg-gray-700 p-2 rounded text-sm border border-gray-600"
          value={filterPayment} 
          onChange={(e) => setFilterPayment(e.target.value)}
        >
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="credit">Credit</option>
        </select>

        <div className="flex gap-2 items-center">
          <select
            className="bg-gray-700 p-2 rounded text-sm border border-gray-600 flex-1"
            value={totalRange}
            onChange={(e) => setTotalRange(e.target.value as any)}
          >
            <option value="">Total Range</option>
            <option value="under1k">Under 1,000</option>
            <option value="1k-3k">1,000 - 3,000</option>
            <option value="3k-10k">3,000 - 10,000</option>
            <option value="10k-20k">10,000 - 20,000</option>
            <option value="20k-30k">20,000 - 30,000</option>
            <option value="30k-plus">30,000+</option>
            <option value="custom">Custom</option>
          </select>

          {totalRange === "custom" && (
            <>
              <input
                className="bg-gray-700 p-2 rounded w-24 text-sm border border-gray-600"
                placeholder="Min"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                type="number"
              />
              <input
                className="bg-gray-700 p-2 rounded w-24 text-sm border border-gray-600"
                placeholder="Max"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                type="number"
              />
            </>
          )}
        </div>

        <div className="md:col-span-4 flex gap-2 justify-between items-center">
          <select 
            className="bg-gray-700 p-2 rounded text-sm border border-gray-600"
            value={customerType} 
            onChange={(e) => setCustomerType(e.target.value)}
          >
            <option value="">All Customer Types</option>
            <option value="bar">Bar</option>
            <option value="individual">Individual</option>
            <option value="shop">Shop</option>
            <option value="restaurant">Restaurant</option>
            <option value="other">Other</option>
          </select>

          <div className="flex gap-2">
            <button 
              type="submit" 
              className="bg-green-600 px-4 py-2 rounded font-semibold text-white text-sm hover:bg-green-700 transition"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilterStatus("");
                setFilterPayment("");
                setTotalRange("");
                setCustomMin("");
                setCustomMax("");
                setCustomerType("");
                loadSales();
              }}
              className="bg-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-600 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Sales Grid */}
      <section className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="animate-spin text-green-400" size={32} />
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <ShoppingBag className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Sales Found</h3>
            <p className="text-gray-400 mb-4">Get started by creating your first sale</p>
            <button
              onClick={() => setShowSaleModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Create Sale
            </button>
          </div>
        ) : (
          sales.map((sale) => (
            <motion.article
              key={sale.id}
              className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              {/* Sale Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-750 transition"
                onClick={() => toggleExpandSale(sale.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-lg flex items-center gap-2">
                      {sale.customer ? (
                        <>
                          <User size={18} className="text-blue-400" />
                          {sale.customer.name}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCustomerTypeColor(sale.customer.type)}`}>
                            {sale.customer.type}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">Walk-in Customer</span>
                      )}
                      {expandedSale === sale.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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

                    {sale.note && (
                      <div className="text-sm text-gray-500 mt-1 italic">"{sale.note}"</div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">
                      {formatCurrency(Number(sale.totalAmount))}
                    </div>
                    <div className="text-xs text-gray-400">{formatDate(sale.createdAt)}</div>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(sale.status)}`}>
                      {sale.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CreditCard size={12} />
                      {sale.paymentMethod}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openSaleDetails(sale.id);
                      }} 
                      className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm transition"
                    >
                      View Items
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSaleId(sale.id);
                        setShowItemsModal(true);
                      }}
                      className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm transition"
                    >
                      Add Items
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSale(sale);
                      }}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm transition flex items-center gap-1"
                    >
                      <Edit size={14} />
                      Edit
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSale(sale.id);
                      }}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-sm transition flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
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
                    <div className="border-t border-gray-700 p-4 bg-gray-850">
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400 font-medium">Sale ID</div>
                          <div className="font-mono text-green-400">{sale.id}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-medium">Created</div>
                          <div>{formatDate(sale.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-medium">Status</div>
                          <div className="capitalize">{sale.status}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-medium">Payment Method</div>
                          <div className="capitalize">{sale.paymentMethod}</div>
                        </div>
                        {sale.customer && (
                          <>
                            <div>
                              <div className="text-gray-400 font-medium">Customer Type</div>
                              <div className="capitalize">{sale.customer.type}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 font-medium">Customer Address</div>
                              <div>{sale.customer.address}</div>
                            </div>
                            {sale.customer.phones && sale.customer.phones.length > 0 && (
                              <div>
                                <div className="text-gray-400 font-medium">Phone</div>
                                <div>{sale.customer.phones[0].phoneNumber}</div>
                              </div>
                            )}
                          </>
                        )}
                        {sale.note && (
                          <div className="md:col-span-2 lg:col-span-4">
                            <div className="text-gray-400 font-medium">Note</div>
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

      {/* Edit Sale Modal */}
      <AnimatePresence>
        {editingSale && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-lg shadow-lg border border-gray-700"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-blue-400">Edit Sale</h3>
                <X 
                  className="cursor-pointer hover:bg-gray-700 rounded p-1 transition" 
                  size={24}
                  onClick={() => setEditingSale(null)} 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 font-medium mb-2 block">Customer</label>
                  <div className="p-3 bg-gray-700 rounded border border-gray-600">
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
                      className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
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
                      className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
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
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition resize-none"
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
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
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
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition font-medium" 
                  onClick={() => setEditingSale(null)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition font-medium flex items-center gap-2" 
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-lg shadow-lg border border-gray-700"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-green-400">Create New Sale</h3>
                <X 
                  className="cursor-pointer hover:bg-gray-700 rounded p-1 transition" 
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
                      className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition pr-10"
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
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
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
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCustomerTypeColor(customer.type)}`}>
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
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-green-400 flex items-center gap-2">
                          <User size={16} />
                          {selectedCustomer.name}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCustomerTypeColor(selectedCustomer.type)}`}>
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
                      className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
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
                      className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition"
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
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-green-500 focus:outline-none transition resize-none"
                    placeholder="Add a note about this sale..."
                    rows={3}
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                  />
                </div>

                <div className="bg-gray-750 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-300">Initial total (add items later to update)</div>
                    <div className="text-green-400 font-semibold text-lg">{formatCurrency(totalAmount)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition font-medium" 
                  onClick={() => {
                    setShowSaleModal(false);
                    clearCustomerSelection();
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition font-medium flex items-center gap-2" 
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
            className="fixed inset-0 z-50 flex items-start md:items-center justify-center overflow-auto py-8 bg-black/70"
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-green-400">Add Items to Sale</h3>
                <X 
                  className="cursor-pointer hover:bg-gray-700 rounded p-1 transition" 
                  onClick={() => setShowItemsModal(false)} 
                />
              </div>

              <div className="mb-3 grid md:grid-cols-3 gap-3">
                <select
                  className="p-3 rounded bg-gray-700 border border-gray-600 text-white md:col-span-2"
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
                    className="p-3 rounded bg-gray-700 border border-gray-600 w-full focus:border-green-500 focus:outline-none transition"
                    placeholder="Search products..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  <button
                    className="px-3 rounded bg-gray-700 border border-gray-600 hover:bg-gray-600 transition"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4 max-h-60 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="col-span-full text-gray-400 p-4 text-center">
                    {productQuery ? "No products found. Try a different search term." : "Search for products to add items."}
                  </div>
                ) : (
                  products.map((p) => {
                    const chosen = selectedItems.find((s) => s.productId === p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          chosen 
                            ? "border-green-500 bg-green-900/20 hover:bg-green-900/30" 
                            : "border-gray-700 hover:border-green-500 hover:bg-gray-750"
                        }`}
                      >
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-gray-400 mt-1">Category: {p.category || "—"}</div>
                        <div className="text-sm text-gray-400 mt-2">Enter prices manually below</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected items list */}
              <div className="space-y-3 max-h-[45vh] overflow-y-auto mb-4">
                {selectedItems.map((it) => {
                  const prod = products.find((p) => p.id === it.productId) ?? { name: "Unknown", id: it.productId } as any;
                  return (
                    <div key={it.productId} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
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

                      <div className="grid md:grid-cols-4 gap-2 mt-3">
                        <select
                          className="p-2 rounded bg-gray-700 border border-gray-600"
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
                          className="p-2 rounded bg-gray-700 border border-gray-600"
                          value={it.quantity}
                          onChange={(e) => updateItemField(it.productId, { quantity: Number(e.target.value || 0) })}
                        />

                        {["drink", "both"].includes(it.category) && (
                          <input
                            type="number"
                            step="0.01"
                            className="p-2 rounded bg-gray-700 border border-gray-600"
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
                            className="p-2 rounded bg-gray-700 border border-gray-600"
                            placeholder="Bottle price"
                            value={it.bottlePrice ?? ""}
                            onChange={(e) =>
                              updateItemField(it.productId, { bottlePrice: e.target.value === "" ? "" : Number(e.target.value) })
                            }
                          />
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-2 mt-3">
                        <select
                          className="p-2 rounded bg-gray-700 border border-gray-600"
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
                          className="p-2 rounded bg-gray-700 border border-gray-600"
                          placeholder="Note (optional)"
                          value={it.note ?? ""}
                          onChange={(e) => updateItemField(it.productId, { note: e.target.value })}
                        />
                      </div>

                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                          Computed: {it.category === "both" ? "(drink + bottle) x qty" : it.category === "drink" ? "drink x qty" : "bottle x qty"}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition"
                            onClick={() => setSelectedItems((prev) => prev.filter((x) => x.productId !== it.productId))}
                          >
                            Remove
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 transition"
                            onClick={() => updateItemField(it.productId, { quantity: it.quantity || 1 })}
                          >
                            Recalc
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-green-400 font-semibold text-lg">Total: {formatCurrency(totalAmount)}</div>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition font-medium" 
                    onClick={() => setShowItemsModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition font-medium flex items-center gap-2" 
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-4xl shadow-lg max-h-[90vh] overflow-hidden flex flex-col border border-gray-700"
              initial={{ y: 20 }} 
              animate={{ y: 0 }} 
              exit={{ y: 20 }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-green-400">Sale Items</h3>
                <div className="flex gap-2 items-center">
                  <button 
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition" 
                    onClick={closeSaleDetails}
                  >
                    Close
                  </button>
                  <X 
                    className="cursor-pointer hover:bg-gray-700 rounded p-1 transition" 
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
                <div className="space-y-3 overflow-y-auto flex-1">
                  {viewItems.map((it) => {
                    const isEditing = editingItems[it.id];
                    const item = isEditing ? editingItems[it.id] : it;
                    
                    return (
                      <div key={it.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        {isEditing ? (
                          <div className="space-y-3">
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

                            <div className="grid md:grid-cols-4 gap-2">
                              <select
                                className="p-2 rounded bg-gray-700 border border-gray-600"
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
                                className="p-2 rounded bg-gray-700 border border-gray-600"
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
                                  className="p-2 rounded bg-gray-700 border border-gray-600"
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
                                  className="p-2 rounded bg-gray-700 border border-gray-600"
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
                                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition"
                                onClick={() => setEditingItems(prev => {
                                  const newItems = { ...prev };
                                  delete newItems[it.id];
                                  return newItems;
                                })}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2"
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
                                Prices: Drink: {it.drinkPrice || "0"} | Bottle: {it.bottlePrice || "0"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-bold">{Number(it.subtotal || 0).toFixed(2)} Br</div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => setEditingItems(prev => ({ ...prev, [it.id]: it }))}
                                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs flex items-center gap-1 transition"
                                >
                                  <Edit size={12} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSaleItem(showSaleDetails.saleId!, it.id)}
                                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-xs flex items-center gap-1 transition"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
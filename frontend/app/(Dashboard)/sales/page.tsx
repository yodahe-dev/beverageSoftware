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

interface Sale {
  id: string;
  totalAmount: number | string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  customer?: { id: string; name?: string; address?: string } | null;
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

  // Sale form
  const [customerId, setCustomerId] = useState("");
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
  // Replaced minTotal/maxTotal inputs with range select
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

  // product search
  const [productQuery, setProductQuery] = useState("");

  // auth + loading
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);

  // viewing sale items
  const [viewItems, setViewItems] = useState<SaleItemView[]>([]);
  const [viewItemsLoading, setViewItemsLoading] = useState(false);

  // toasts
  const { toasts, add: addToast, remove: removeToast } = useToasts();

  // refs to avoid stale timers
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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
      // ignore
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
      // Build params
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPayment) params.paymentMethod = filterPayment;
      if (customerType) params.customerType = customerType;

      // total range mapping
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
      // handle varied shapes
      let payload = res.data;
      if (!payload) {
        setSales([]);
      } else if (Array.isArray(payload)) {
        setSales(payload);
      } else if (payload.data && Array.isArray(payload.data)) {
        setSales(payload.data);
      } else if (payload.sales && Array.isArray(payload.sales)) {
        setSales(payload.sales);
      } else {
        // try to coerce single object into array
        if (payload.id) setSales([payload]);
        else setSales([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const res = await axios.get("/api/products", { headers: getAuthHeaders(), params: { search: productQuery } });
        const p = res.data;
        if (!canceled) {
          if (!p) setProducts([]);
          else if (Array.isArray(p)) setProducts(p);
          else if (p.products && Array.isArray(p.products)) setProducts(p.products);
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
        else if (d.data && Array.isArray(d.data)) setSubbrands(d.data);
        else setSubbrands([]);
      } catch (err) {
        console.error("Failed loading subbrands", err);
        setSubbrands([]);
      }
    })();
  }, []);

  /* ------------------ Selected items logic ------------------ */

  // Add/remove product to selectedItems (prevents duplicates)
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
        subtotal: 0, // 0 until prices provided
        category: "drink",
        drinkPrice: "",
        bottlePrice: "",
        subbrandId: p.subbrand?.id || "",
        note: "",
      },
    ]);
  };

  // Update item fields and recompute subtotal
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
      // Prevent duplicates: fetch existing items for this sale and ensure no selected product is already present
      const existingRes = await axios.get(`/api/sales/${saleId}/salesitem`, { headers: getAuthHeaders() });
      let existing: SaleItemView[] = [];
      const er = existingRes.data;
      if (Array.isArray(er)) existing = er;
      else if (er?.data && Array.isArray(er.data)) existing = er.data;
      else if (er?.items && Array.isArray(er.items)) existing = er.items;
      else existing = [];

      const dupProducts = selectedItems.filter((sel) => existing.some((ex) => (ex as any).productId === sel.productId));
      if (dupProducts.length > 0) {
        const names = dupProducts.map((d) => {
          const p = products.find((pp) => pp.id === d.productId);
          return p?.name || d.productId;
        });
        addToast(`These products already exist in this sale: ${names.join(", ")}`, "error");
        setSavingItems(false);
        return;
      }

      // Build payload
      const payload = selectedItems.map((it) => ({
        productId: it.productId,
        subbrandId: it.subbrandId || "",
        category: it.category,
        quantity: Number(it.quantity),
        drinkPrice: it.drinkPrice === "" ? null : Number(it.drinkPrice ?? null),
        bottlePrice: it.bottlePrice === "" ? null : Number(it.bottlePrice ?? null),
        subtotal: Number(it.subtotal),
        note: it.note || "",
      }));

      // Send create-many sequentially (server route supports creating each item)
      // We POST one request with array - our backend route handles array or loop create.
      await axios.post(`/api/sales/${saleId}/salesitem`, payload, { headers: getAuthHeaders() });

      // Update sale totalAmount: get current sale and patch
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

      const addedTotal = payload.reduce((s, x) => s + Number(x.subtotal || 0), 0);
      const newTotal = Number(existingSaleTotal) + Number(addedTotal);

      // Try patching the sale total (best-effort)
      try {
        await axios.patch(
          `/api/sales/${saleId}`,
          { totalAmount: newTotal },
          {
            headers: getAuthHeaders(),
          }
        );
      } catch (patchErr) {
        // If patch fails, log but consider items created — notify user to sync totals manually
        console.warn("Patch sale total failed:", patchErr);
      }

      addToast("Items saved and sale updated", "success");

      // cleanup UI
      setSelectedItems([]);
      setSaleId(null);
      setShowItemsModal(false);

      // refresh sales
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
      // Robust handling: could be array, or { data: [...] }
      if (Array.isArray(d)) setViewItems(d);
      else if (d?.data && Array.isArray(d.data)) setViewItems(d.data);
      else if (d?.items && Array.isArray(d.items)) setViewItems(d.items);
      else if (d?.saleItems && Array.isArray(d.saleItems)) setViewItems(d.saleItems);
      else {
        // if single object, wrap or set empty
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
  };

  /* ------------------ Filter submit ------------------ */

  const handleFilterSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await loadSales();
  };

  /* ------------------ UI - Render ------------------ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col-reverse gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`w-80 p-3 rounded shadow-lg border ${
              t.kind === "success"
                ? "bg-green-700 border-green-600"
                : t.kind === "error"
                ? "bg-red-700 border-red-600"
                : t.kind === "warning"
                ? "bg-yellow-600 border-yellow-500"
                : "bg-gray-800 border-gray-700"
            } flex justify-between items-start gap-3`}
          >
            <div>
              <div className="font-semibold">{t.kind.toUpperCase()}</div>
              <div className="text-sm text-gray-200 mt-1">{t.message}</div>
            </div>
            <div className="pl-2">
              <button onClick={() => removeToast(t.id)} aria-label="close">
                <X />
              </button>
            </div>
          </div>
        ))}
      </div>

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
        <div className="flex items-center gap-2 bg-transparent">
          <Search />
          <input
            className="bg-transparent outline-none w-full text-sm"
            placeholder="Search customers, address, note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="bg-gray-700 p-2 rounded text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="partially_paid">Partially Paid</option>
        </select>

        <select className="bg-gray-700 p-2 rounded text-sm" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
          <option value="">Payment Method</option>
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="credit">Credit</option>
        </select>

        <div className="flex gap-2 items-center">
          <select
            className="bg-gray-700 p-2 rounded text-sm"
            value={totalRange}
            onChange={(e) => setTotalRange(e.target.value as any)}
          >
            <option value="">Total range</option>
            <option value="under1k">Under 1,000</option>
            <option value="1k-3k">1,000 - 3,000</option>
            <option value="3k-10k">3,000 - 10,000</option>
            <option value="10k-20k">10,000 - 20,000</option>
            <option value="20k-30k">20,000 - 30,000</option>
            <option value="30k-plus">More than 30,000</option>
            <option value="custom">Custom</option>
          </select>

          {totalRange === "custom" && (
            <>
              <input
                className="bg-gray-700 p-2 rounded w-24 text-sm"
                placeholder="Min"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                type="number"
              />
              <input
                className="bg-gray-700 p-2 rounded w-24 text-sm"
                placeholder="Max"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                type="number"
              />
            </>
          )}
        </div>

        <div className="md:col-span-4 flex gap-2 justify-end">
          <select className="bg-gray-700 p-2 rounded text-sm" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
            <option value="">Customer Type</option>
            <option value="bar">Bar</option>
            <option value="individual">Individual</option>
            <option value="shop">Shop</option>
            <option value="restaurant">Restaurant</option>
            <option value="other">Other</option>
          </select>

          <button type="submit" className="bg-green-600 px-4 py-2 rounded font-semibold text-black">Apply</button>
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
            className="bg-gray-700 px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Sales Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 flex justify-center items-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : sales.length === 0 ? (
          <div className="col-span-full text-gray-400 p-6 rounded-lg bg-gray-800">No sales found.</div>
        ) : (
          sales.map((s) => (
            <motion.article
              key={s.id}
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700 cursor-pointer hover:shadow-lg"
              whileHover={{ y: -6 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{s.customer?.name || "Customer (N/A)"}</div>
                  <div className="text-sm text-gray-400 mt-1">{s.customer?.address || s.note || "No address / note"}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{Number(s.totalAmount || 0).toFixed(2)} Br</div>
                  <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <div className={`px-2 py-1 rounded text-xs ${s.status === "completed" ? "bg-green-700" : "bg-gray-700"}`}>
                    {s.status}
                  </div>
                  <div className="text-xs text-gray-400">{s.paymentMethod}</div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openSaleDetails(s.id)} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm">
                    View Items
                  </button>

                  <button
                    onClick={() => {
                      setSaleId(s.id);
                      setShowItemsModal(true);
                    }}
                    className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm"
                  >
                    Add Items
                  </button>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </section>

      {/* Create Sale Modal */}
      <AnimatePresence>
        {showSaleModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-lg shadow-lg"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-green-400">Create New Sale</h3>
                <X className="cursor-pointer" onClick={() => setShowSaleModal(false)} />
              </div>

              <div className="space-y-3">
                <input className="w-full p-2 rounded bg-gray-700" placeholder="Customer ID (optional)" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
                <select className="w-full p-2 rounded bg-gray-700" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="credit">Credit</option>
                </select>

                <select className="w-full p-2 rounded bg-gray-700" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="partially_paid">Partially Paid</option>
                </select>

                <textarea className="w-full p-2 rounded bg-gray-700" placeholder="Note..." value={note} onChange={(e) => setNote(e.target.value)} />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-300">Initial total (leave 0 and add items later)</div>
                  <div className="text-green-400 font-semibold">{totalAmount.toFixed(2)} Br</div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button className="px-4 py-2 rounded bg-gray-700" onClick={() => setShowSaleModal(false)}>Cancel</button>
                <button className="px-4 py-2 rounded bg-green-600 flex items-center gap-2" onClick={handleCreateSale}>
                  {loading && <Loader2 className="animate-spin" />} Create Sale
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
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-5xl shadow-2xl"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-green-400">Add Items to Sale</h3>
                <X className="cursor-pointer" onClick={() => setShowItemsModal(false)} />
              </div>

              <div className="mb-3 grid md:grid-cols-3 gap-3">
                <select
                  className="p-2 rounded bg-gray-700 text-white md:col-span-2"
                  value={saleId || ""}
                  onChange={(e) => setSaleId(e.target.value || null)}
                >
                  <option value="">Select existing sale to add items (or create a new sale first)</option>
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.customer?.name || "Customer"} — {s.paymentMethod} — {Number(s.totalAmount).toFixed(2)} Br
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    className="p-2 rounded bg-gray-700 w-full"
                    placeholder="Search products..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  <button
                    className="px-3 rounded bg-gray-700"
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
                  <div className="text-gray-400 p-3">No products. Search to find products.</div>
                ) : (
                  products.map((p) => {
                    const chosen = selectedItems.find((s) => s.productId === p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p)}
                        className={`p-3 rounded-xl border ${
                          chosen ? "border-green-500 bg-green-900/20" : "border-gray-700 hover:border-green-500"
                        } cursor-pointer transition`}
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
                    <div key={it.productId} className="bg-gray-800 p-4 rounded-lg">
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
                          className="p-2 rounded bg-gray-700"
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
                          className="p-2 rounded bg-gray-700"
                          value={it.quantity}
                          onChange={(e) => updateItemField(it.productId, { quantity: Number(e.target.value || 0) })}
                        />

                        {["drink", "both"].includes(it.category) && (
                          <input
                            type="number"
                            className="p-2 rounded bg-gray-700"
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
                            className="p-2 rounded bg-gray-700"
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
                          className="p-2 rounded bg-gray-700"
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
                          className="p-2 rounded bg-gray-700"
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
                            className="px-3 py-1 rounded bg-gray-700"
                            onClick={() => setSelectedItems((prev) => prev.filter((x) => x.productId !== it.productId))}
                          >
                            Remove
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-green-600"
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
                <div className="text-green-400 font-semibold">Total: {Number(totalAmount || 0).toFixed(2)} Br</div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded bg-gray-700" onClick={() => setShowItemsModal(false)}>Cancel</button>
                  <button className="px-4 py-2 rounded bg-green-600 flex items-center gap-2" onClick={handleSaveItems} disabled={savingItems}>
                    {savingItems && <Loader2 className="animate-spin" />} Save Items
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
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl w-full max-w-2xl shadow-lg" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-green-400">Sale Items</h3>
                <div className="flex gap-2 items-center">
                  <button className="px-3 py-1 rounded bg-gray-700" onClick={() => { setShowSaleDetails({ open: false }); setViewItems([]); }}>
                    Close
                  </button>
                  <X className="cursor-pointer" onClick={closeSaleDetails} />
                </div>
              </div>

              {viewItemsLoading ? (
                <div className="flex items-center justify-center p-6"><Loader2 className="animate-spin" /></div>
              ) : viewItems.length === 0 ? (
                <div className="text-gray-400 p-4">No items found for this sale.</div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {viewItems.map((it) => (
                    <div key={it.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{it.product?.name || "Product"}</div>
                        <div className="text-sm text-gray-400">{it.subbrand?.name || ""} • {it.category}</div>
                        <div className="text-xs text-gray-400">Note: {it.note || "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">{Number(it.subtotal || 0).toFixed(2)} Br</div>
                        <div className="text-xs text-gray-400">{it.quantity}x</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

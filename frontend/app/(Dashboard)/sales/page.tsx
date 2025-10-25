"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { X, PlusCircle, ShoppingBag, Loader2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  price: number;
  sellPrice: number | null;
  category: string;
  subbrand?: { id: string; name: string; brand?: { id: string; name: string } | null } | null;
}

interface Subbrand {
  id: string;
  name: string;
  brand: { id: string; name: string };
}

type SaleCategory = "drink" | "bottle" | "both";

interface JwtPayload {
  userId: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export default function SalesPage() {
  const [showSalePopover, setShowSalePopover] = useState(false);
  const [showItemsPopover, setShowItemsPopover] = useState(false);
  const [saleId, setSaleId] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "credit">("cash");
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled" | "partially_paid">("pending");
  const [note, setNote] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const [searchProducts, setSearchProducts] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    {
      productId: string;
      quantity: number;
      subtotal: number;
      category: SaleCategory;
      drinkPrice?: number;
      bottlePrice?: number;
      subbrandId: string;
      note?: string;
    }[]
  >([]);

  const [subbrands, setSubbrands] = useState<Subbrand[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // decode JWT
  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    if (!token) return;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      setUserId(decoded.userId);
    } catch (err) {
      console.error("Invalid token", err);
    }
  }, []);

  // fetch products
  useEffect(() => {
    if (!searchProducts) return;
    axios.get(`/api/products?search=${searchProducts}`).then((res) => setProducts(res.data.products));
  }, [searchProducts]);

  // fetch subbrands
  useEffect(() => {
    axios.get(`/api/brands/subbrands`).then((res) => setSubbrands(res.data));
  }, []);

  // calculate total
  useEffect(() => {
    const total = selectedItems.reduce((sum, i) => sum + i.subtotal, 0);
    setTotalAmount(total);
  }, [selectedItems]);

  const createSale = async () => {
    if (!userId) return alert("User not logged in");
    setLoading(true);
    try {
      const { data: sale } = await axios.post("/api/sales", {
        customerId: customerId || null,
        paymentMethod,
        status,
        note,
        totalAmount,
        userId,
      });
      if (!sale?.id) return alert("Failed to get sale ID");
      setSaleId(sale.id);
      setShowSalePopover(false);
      setShowItemsPopover(true);
    } catch (err) {
      console.error(err);
      alert("Failed to create sale");
    } finally {
      setLoading(false);
    }
  };

  const saveSaleItems = async () => {
    if (!saleId) return alert("Sale ID missing");
    if (selectedItems.length === 0) return alert("No items selected");
    setLoading(true);
    try {
      await axios.post(`/api/sales/${saleId}/salesitem`, selectedItems);
      alert("Sale items saved successfully");
      setShowItemsPopover(false);
      setSelectedItems([]);
      setSaleId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save sale items");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (p: Product) => {
    const existing = selectedItems.find((i) => i.productId === p.id);
    if (existing) {
      setSelectedItems(selectedItems.filter((i) => i.productId !== p.id));
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          productId: p.id,
          quantity: 1,
          subtotal: p.sellPrice || p.price,
          category: "drink",
          subbrandId: p.subbrand?.id || "",
        },
      ]);
    }
  };

  const updateQuantity = (id: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => {
        if (i.productId !== id) return i;
        let base = 0;
        if (i.category === "drink") base = i.drinkPrice || 0;
        else if (i.category === "bottle") base = i.bottlePrice || 0;
        else base = (i.drinkPrice || 0) + (i.bottlePrice || 0);
        return { ...i, quantity: qty, subtotal: base * qty };
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingBag className="text-green-400" /> Sales Management
        </h1>
        <button
          onClick={() => setShowSalePopover(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition"
        >
          <PlusCircle size={18} /> Create Sale
        </button>
      </div>

      <div className="text-gray-400 text-sm">Track, manage, and record your beverage sales easily.</div>

      {/* Create Sale Modal */}
      <AnimatePresence>
        {showSalePopover && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-400">New Sale</h2>
                <X className="cursor-pointer" onClick={() => setShowSalePopover(false)} />
              </div>

              <div className="space-y-3">
                <input
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="Customer ID (optional)"
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="credit">Credit</option>
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="partially_paid">Partially Paid</option>
                </select>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note..."
                  className="w-full p-2 rounded bg-gray-700 text-white"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowSalePopover(false)} className="px-4 py-2 rounded bg-gray-700">
                  Cancel
                </button>
                <button
                  onClick={createSale}
                  disabled={loading}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items Modal */}
      <AnimatePresence>
        {showItemsPopover && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-5xl overflow-y-auto max-h-[90vh]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-400">Add Sale Items</h2>
                <X className="cursor-pointer" onClick={() => setShowItemsPopover(false)} />
              </div>

              <input
                value={searchProducts}
                onChange={(e) => setSearchProducts(e.target.value)}
                placeholder="Search products..."
                className="w-full p-2 rounded bg-gray-700 text-white mb-3"
              />

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 max-h-60 overflow-y-auto">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => toggleProductSelection(p)}
                    className={`cursor-pointer p-3 rounded-xl border ${
                      selectedItems.find((i) => i.productId === p.id)
                        ? "border-green-500 bg-green-900/30"
                        : "border-gray-700 hover:border-green-500"
                    } transition`}
                  >
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-gray-400">{p.sellPrice || p.price} Br</div>
                  </div>
                ))}
              </div>

              {selectedItems.map((item) => {
                const p = products.find((prod) => prod.id === item.productId);
                return (
                  <div key={item.productId} className="bg-gray-800 p-4 rounded-lg mb-3">
                    <div className="font-semibold text-green-400 mb-2">{p?.name}</div>

                    <div className="grid md:grid-cols-2 gap-2">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          setSelectedItems((prev) =>
                            prev.map((i) =>
                              i.productId === item.productId ? { ...i, category: e.target.value as SaleCategory } : i
                            )
                          )
                        }
                        className="p-2 rounded bg-gray-700 text-white"
                      >
                        <option value="drink">Drink</option>
                        <option value="bottle">Bottle</option>
                        <option value="both">Both</option>
                      </select>

                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                        className="p-2 rounded bg-gray-700 text-white"
                        placeholder="Quantity"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 mt-2">
                      {["drink", "both"].includes(item.category) && (
                        <input
                          type="number"
                          placeholder="Drink Price"
                          value={item.drinkPrice || ""}
                          onChange={(e) =>
                            setSelectedItems((prev) =>
                              prev.map((i) =>
                                i.productId === item.productId ? { ...i, drinkPrice: parseFloat(e.target.value) } : i
                              )
                            )
                          }
                          className="p-2 rounded bg-gray-700 text-white"
                        />
                      )}
                      {["bottle", "both"].includes(item.category) && (
                        <input
                          type="number"
                          placeholder="Bottle Price"
                          value={item.bottlePrice || ""}
                          onChange={(e) =>
                            setSelectedItems((prev) =>
                              prev.map((i) =>
                                i.productId === item.productId ? { ...i, bottlePrice: parseFloat(e.target.value) } : i
                              )
                            )
                          }
                          className="p-2 rounded bg-gray-700 text-white"
                        />
                      )}
                    </div>

                    <select
                      value={item.subbrandId}
                      onChange={(e) =>
                        setSelectedItems((prev) =>
                          prev.map((i) =>
                            i.productId === item.productId ? { ...i, subbrandId: e.target.value } : i
                          )
                        )
                      }
                      className="w-full p-2 rounded bg-gray-700 text-white mt-2"
                    >
                      <option value="">Select Subbrand</option>
                      {subbrands.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.brand.name} - {s.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={item.note || ""}
                      onChange={(e) =>
                        setSelectedItems((prev) =>
                          prev.map((i) =>
                            i.productId === item.productId ? { ...i, note: e.target.value } : i
                          )
                        )
                      }
                      placeholder="Note..."
                      className="w-full p-2 rounded bg-gray-700 text-white mt-2"
                    />

                    <div className="mt-2 text-sm text-green-400 font-semibold">
                      Subtotal: {item.subtotal.toFixed(2)} Br
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 flex justify-between items-center">
                <div className="text-green-400 font-semibold text-lg">Total: {totalAmount.toFixed(2)} Br</div>
                <div className="flex gap-2">
                  <button onClick={() => setShowItemsPopover(false)} className="px-4 py-2 rounded bg-gray-700">
                    Cancel
                  </button>
                  <button
                    onClick={saveSaleItems}
                    disabled={loading}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    {loading && <Loader2 className="animate-spin" size={18} />} Save Items
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

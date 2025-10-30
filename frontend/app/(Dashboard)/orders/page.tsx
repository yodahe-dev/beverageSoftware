"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, Search } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* shadcn calendar + popover pattern */
import { Calendar } from "@/components/ui/calendar"; // ensure you have shadcn calendar component
import { cn } from "@/lib/utils";

interface Sale {
  id: string;
  reference?: string;
  name?: string;
  totalAmount?: number;
}

interface Customer {
  id: string;
  name: string;
}

interface Order {
  id: string;
  name: string;
  location: string;
  phoneNumbers: string[];
  note?: string;
  status: string;
  deliveryPerson?: string | null;
  deliveryDate?: string | null;
  createdAt?: string;
}

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];

/**
 * Orders page - full file
 */
export default function OrdersPage() {
  // Orders listing
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [listSearch, setListSearch] = useState("");

  // Create dialog + form
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    salesId: "",
    customerId: "",
    salesName: "", // for display in input
    customerName: "", // for display in input
    location: "",
    note: "",
    deliveryPerson: "",
    deliveryDate: "" as string, // ISO string or empty
    phoneNumbers: [""],
    status: "pending",
  });

  // Sales & customer search dropdowns
  const [salesOptions, setSalesOptions] = useState<Sale[]>([]);
  const [salesSearch, setSalesSearch] = useState("");
  const [salesLoading, setSalesLoading] = useState(false);
  const salesTimer = useRef<NodeJS.Timeout | null>(null);

  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerLoading, setCustomerLoading] = useState(false);
  const customerTimer = useRef<NodeJS.Timeout | null>(null);

  // Date picker state (Date | undefined)
  const [deliveryDateObj, setDeliveryDateObj] = useState<Date | undefined>(undefined);

  // ------------------------
  // Fetch orders (safe parsing so orders.map won't fail)
  // ------------------------
  const fetchOrders = async (query = "") => {
    try {
      setLoading(true);
      const url = `/api/orders${query ? `?search=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      // backend may return different shapes: { items: [] } or { data: [] } or [] directly
      if (Array.isArray(data)) {
        setOrders(data as Order[]);
      } else if (Array.isArray((data as any).items)) {
        setOrders((data as any).items as Order[]);
      } else if (Array.isArray((data as any).data)) {
        setOrders((data as any).data as Order[]);
      } else {
        // fallback: try to find array in object
        const maybeArray = Object.values(data).find((v) => Array.isArray(v));
        setOrders((maybeArray as any) || []);
      }
    } catch (err) {
      console.error("fetchOrders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ------------------------
  // Sales search (debounced)
  // ------------------------
  useEffect(() => {
    if (salesTimer.current) clearTimeout(salesTimer.current);
    salesTimer.current = setTimeout(() => {
      if (!salesSearch || salesSearch.trim().length < 1) {
        setSalesOptions([]);
        setSalesLoading(false);
        return;
      }
      (async () => {
        try {
          setSalesLoading(true);
          const res = await fetch(`/api/sales?search=${encodeURIComponent(salesSearch)}`);
          const data = await res.json();
          // API returns array of sales or object
          if (Array.isArray(data)) setSalesOptions(data);
          else if (Array.isArray((data as any).data)) setSalesOptions((data as any).data);
          else setSalesOptions([]);
        } catch (err) {
          console.error("fetchSales", err);
          setSalesOptions([]);
        } finally {
          setSalesLoading(false);
        }
      })();
    }, 450);
    // cleanup handled in next effect call
  }, [salesSearch]);

  // ------------------------
  // Customer search (debounced)
  // ------------------------
  useEffect(() => {
    if (customerTimer.current) clearTimeout(customerTimer.current);
    customerTimer.current = setTimeout(() => {
      if (!customerSearch || customerSearch.trim().length < 1) {
        setCustomerOptions([]);
        setCustomerLoading(false);
        return;
      }
      (async () => {
        try {
          setCustomerLoading(true);
          const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`);
          const data = await res.json();
          if (Array.isArray((data as any).data)) setCustomerOptions((data as any).data);
          else if (Array.isArray(data)) setCustomerOptions(data);
          else setCustomerOptions([]);
        } catch (err) {
          console.error("fetchCustomers", err);
          setCustomerOptions([]);
        } finally {
          setCustomerLoading(false);
        }
      })();
    }, 450);
  }, [customerSearch]);

  // ------------------------
  // Handlers
  // ------------------------
  const handleSelectSale = (sale: Sale) => {
    setForm((s) => ({ ...s, salesId: sale.id, salesName: sale.name || sale.reference || "" }));
    setSalesSearch(sale.name || sale.reference || "");
    setSalesOptions([]);
  };

  const handleSelectCustomer = (cust: Customer) => {
    setForm((s) => ({ ...s, customerId: cust.id, customerName: cust.name }));
    setCustomerSearch(cust.name);
    setCustomerOptions([]);
  };

  const handleAddPhone = () =>
    setForm((s) => ({ ...s, phoneNumbers: [...s.phoneNumbers, ""] }));

  const handlePhoneChange = (index: number, value: string) => {
    setForm((s) => {
      const next = [...s.phoneNumbers];
      next[index] = value;
      return { ...s, phoneNumbers: next };
    });
  };

  const handleDeliveryDatePick = (date?: Date) => {
    setDeliveryDateObj(date);
    setForm((s) => ({ ...s, deliveryDate: date ? date.toISOString() : "" }));
  };

  const handleCreate = async () => {
    // basic validation
    if (!form.salesId) return alert("Please select a sale.");
    if (!form.customerId) return alert("Please select a customer.");

    // remove display-only fields from payload
    const payload = {
      salesId: form.salesId,
      customerId: form.customerId,
      name: form.salesName || undefined, // optional fallback
      location: form.location || "",
      note: form.note || undefined,
      phoneNumbers: form.phoneNumbers.filter(Boolean),
      status: form.status,
      deliveryPerson: form.deliveryPerson || undefined,
      deliveryDate: form.deliveryDate || undefined,
    };

    try {
      setLoading(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Create order failed:", err);
        alert("Failed to create order: " + (err?.error || res.statusText));
        return;
      }

      // success: reset form and refresh list
      setForm({
        salesId: "",
        customerId: "",
        salesName: "",
        customerName: "",
        location: "",
        note: "",
        deliveryPerson: "",
        deliveryDate: "",
        phoneNumbers: [""],
        status: "pending",
      });
      setDeliveryDateObj(undefined);
      setSalesSearch("");
      setCustomerSearch("");
      setOpenCreate(false);
      fetchOrders(listSearch);
    } catch (err) {
      console.error("handleCreate error:", err);
      alert("Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    try {
      setLoading(true);
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
      fetchOrders(listSearch);
    } catch (err) {
      console.error("delete order error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search orders in list (debounced)
  const listSearchTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (listSearchTimer.current) clearTimeout(listSearchTimer.current);
    listSearchTimer.current = setTimeout(() => {
      fetchOrders(listSearch);
    }, 400);
  }, [listSearch]);

  // ------------------------
  // UI render
  // ------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-sm text-gray-400 mt-1">Create, search and manage orders</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders..."
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>

              <div className="grid gap-3 py-4">
                {/* Sale search */}
                <div className="relative">
                  <Label>Sale (search)</Label>
                  <Input
                    value={salesSearch || form.salesName}
                    onChange={(e) => {
                      setSalesSearch(e.target.value);
                      // clear previously chosen id if user types
                      if (form.salesId) setForm((s) => ({ ...s, salesId: "", salesName: "" }));
                    }}
                    placeholder="Search sale by ref or customer..."
                    className="bg-gray-800 border-gray-700"
                  />
                  {salesLoading && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {salesOptions.length > 0 && salesSearch && (
                    <div className="absolute z-50 bg-gray-800 border border-gray-700 w-full mt-1 max-h-52 overflow-y-auto rounded">
                      {salesOptions.map((s) => (
                        <div
                          key={s.id}
                          className="p-2 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleSelectSale(s)}
                        >
                          <div className="font-medium">{s.name || s.reference}</div>
                          {typeof s.totalAmount === "number" && (
                            <div className="text-xs text-gray-400">Total: {s.totalAmount}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer search */}
                <div className="relative">
                  <Label>Customer (search)</Label>
                  <Input
                    value={customerSearch || form.customerName}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      if (form.customerId) setForm((s) => ({ ...s, customerId: "", customerName: "" }));
                    }}
                    placeholder="Search customer..."
                    className="bg-gray-800 border-gray-700"
                  />
                  {customerLoading && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
                  )}
                  {customerOptions.length > 0 && customerSearch && (
                    <div className="absolute z-50 bg-gray-800 border border-gray-700 w-full mt-1 max-h-52 overflow-y-auto rounded">
                      {customerOptions.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleSelectCustomer(c)}
                        >
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={form.location}
                      onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                      placeholder="Delivery location"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div>
                    <Label>Delivery person (optional)</Label>
                    <Input
                      value={form.deliveryPerson}
                      onChange={(e) => setForm((s) => ({ ...s, deliveryPerson: e.target.value }))}
                      placeholder="Deliverer name"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                {/* Delivery date picker (optional) using shadcn calendar + popover */}
                <div className="flex flex-col">
                  <Label>Delivery date (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full text-left bg-gray-800 border-gray-700">
                          {deliveryDateObj ? format(deliveryDateObj, "PP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border border-gray-700">
                        <Calendar
                          mode="single"
                          selected={deliveryDateObj}
                          onSelect={(d: Date | undefined) => {
                            handleDeliveryDatePick(d);
                          }}
                        />
                        <div className="p-2 flex gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              handleDeliveryDatePick(undefined);
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Phones */}
                <div>
                  <Label>Phone numbers</Label>
                  {form.phoneNumbers.map((p, i) => (
                    <div className="flex gap-2 mt-2" key={i}>
                      <Input
                        value={p}
                        onChange={(e) => handlePhoneChange(i, e.target.value)}
                        placeholder={`Phone ${i + 1}`}
                        className="bg-gray-800 border-gray-700"
                      />
                      {i === form.phoneNumbers.length - 1 && (
                        <Button onClick={handleAddPhone} className="bg-green-600 hover:bg-green-700">
                          Add
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <Label>Note</Label>
                  <Textarea
                    value={form.note}
                    onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                    placeholder="Extra notes"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(val) => setForm((s) => ({ ...s, status: val }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <Button onClick={handleCreate} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save order"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Orders grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length === 0 && !loading ? (
          <div className="text-gray-400">No orders found.</div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{order.name}</span>
                  <span className="text-xs text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm"><strong>Location:</strong> {order.location}</p>
                <p className="text-sm"><strong>Phone(s):</strong> {order.phoneNumbers?.join(", ")}</p>
                {order.note && <p className="text-sm"><strong>Note:</strong> {order.note}</p>}
                <p className="text-sm mt-2"><strong>Status:</strong> {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                {order.deliveryPerson && <p className="text-sm"><strong>Deliverer:</strong> {order.deliveryPerson}</p>}
                {order.deliveryDate && (
                  <p className="text-sm"><strong>Delivery date:</strong> {new Date(order.deliveryDate).toLocaleDateString()}</p>
                )}

                <div className="mt-3">
                  <Button variant="ghost" className="mr-2" onClick={() => {
                    // open edit flow would go here (not implemented)
                    alert("Edit not implemented in this view. Use create to add new orders.");
                  }}>
                    Edit
                  </Button>

                  <Button onClick={() => handleDelete(order.id)} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

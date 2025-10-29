"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Pencil, Plus, User } from "lucide-react";

type PhoneType = "mobile" | "work" | "home" | "other";

interface CustomerPhone {
  phoneNumber: string;
  type: PhoneType;
  note?: string;
  contactName?: string;
}

interface Store {
  id: string;
  name: string;
  address?: string;
}

interface Customer {
  id: string;
  name: string;
  address?: string;
  store?: Store;
  phones: CustomerPhone[];
  user?: { name: string };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    address: "",
    storeId: "",
    phones: [] as CustomerPhone[],
  });

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  useEffect(() => {
    fetchStores();
    fetchCustomers(true);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCustomers([]);
      setPage(1);
      setHasMore(true);
      fetchCustomers(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  async function fetchStores() {
    try {
      const res = await axios.get("/api/stores");
      setStores(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch stores");
    }
  }

  async function fetchCustomers(reset = false) {
    setLoading(true);
    try {
      const res = await axios.get("/api/customers", { params: { page, limit, search } });
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setCustomers((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(data.length === limit);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  }

  function addPhone() {
    setForm((prev) => ({
      ...prev,
      phones: [...prev.phones, { phoneNumber: "", type: "mobile", note: "", contactName: "" }],
    }));
  }

  function updatePhone(index: number, field: keyof CustomerPhone, value: string) {
    const newPhones = [...form.phones];
    if (field === "type") newPhones[index][field] = value as PhoneType;
    else newPhones[index][field] = value;
    setForm({ ...form, phones: newPhones });
  }

  function removePhone(index: number) {
    const newPhones = [...form.phones];
    newPhones.splice(index, 1);
    setForm({ ...form, phones: newPhones });
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!form.name || !form.storeId || form.phones.length === 0) {
      setError("Name, store, and at least one phone are required.");
      return;
    }

    setSaving(true);
    try {
      let customerId = form.id;

      if (!form.id) {
        // Create new customer
        const res = await axios.post("/api/customers", {
          storeId: form.storeId,
          name: form.name,
          address: form.address,
        });
        customerId = res.data.id;

        // Add phones separately
        await axios.post(`/api/customers/${customerId}/phone`, form.phones);
        setSuccess("Customer and phone(s) created successfully");
      } else {
        // Update existing customer
        await axios.put(`/api/customers/${customerId}`, {
          storeId: form.storeId,
          name: form.name,
          address: form.address,
        });

        // Reset phones (optional: could also append)
        await axios.post(`/api/customers/${customerId}/phone`, form.phones);
        setSuccess("Customer and phones updated successfully");
      }

      setForm({ id: "", name: "", address: "", storeId: "", phones: [] });
      setOpen(false);
      setCustomers([]);
      setPage(1);
      setHasMore(true);
      fetchCustomers(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(c: Customer) {
    setForm({
      id: c.id,
      name: c.name,
      address: c.address || "",
      storeId: c.store?.id || "",
      phones: c.phones || [],
    });
    setOpen(true);
  }

  function loadMore() {
    if (!hasMore) return;
    setPage((prev) => prev + 1);
    fetchCustomers();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600">
              <Plus size={18} /> {form.id ? "Edit Customer" : "Add Customer"}
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-gray-900 border border-gray-700 max-w-xl rounded-xl shadow-lg p-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {form.id ? "Edit Customer" : "Add Customer"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {error && <p className="text-red-400">{error}</p>}
              {success && <p className="text-green-400">{success}</p>}

              <Input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
              <Input
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />

              <select
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                className="w-full bg-gray-800 border-gray-700 text-gray-100 p-2 rounded"
              >
                <option value="">Select Store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.address && `- ${s.address}`}
                  </option>
                ))}
              </select>

              <div className="space-y-2">
                <h2 className="font-semibold">Phones</h2>
                {form.phones.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap">
                    <Input
                      placeholder="Phone Number"
                      value={p.phoneNumber}
                      onChange={(e) => updatePhone(i, "phoneNumber", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-100 flex-1 min-w-[120px]"
                    />
                    <Input
                      placeholder="Contact Name"
                      value={p.contactName || ""}
                      onChange={(e) => updatePhone(i, "contactName", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-100 flex-1 min-w-[120px]"
                    />
                    <select
                      value={p.type}
                      onChange={(e) => updatePhone(i, "type", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                    >
                      <option value="mobile">Mobile</option>
                      <option value="work">Work</option>
                      <option value="home">Home</option>
                      <option value="other">Other</option>
                    </select>
                    <Input
                      placeholder="Note"
                      value={p.note || ""}
                      onChange={(e) => updatePhone(i, "note", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-gray-100 flex-1 min-w-[120px]"
                    />
                    <Button onClick={() => removePhone(i)} className="bg-red-600 hover:bg-red-500">
                      Delete
                    </Button>
                  </div>
                ))}
                <Button onClick={addPhone} className="bg-gray-700 hover:bg-gray-600 flex items-center gap-1">
                  <Plus size={16} /> Add Phone
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                disabled={saving}
              >
                {saving ? "Saving..." : form.id ? "Update Customer" : "Save Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search customers or phones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border-gray-700 text-gray-100 flex-1"
        />
        <Button
          onClick={() => {
            setCustomers([]);
            setPage(1);
            setHasMore(true);
            fetchCustomers(true);
          }}
          className="bg-gray-700 hover:bg-gray-600"
        >
          Search
        </Button>
      </div>

      <InfiniteScroll
        dataLength={customers.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<Loader2 className="animate-spin mx-auto my-4" />}
        endMessage={<p className="text-center text-gray-500 mt-4">No more customers</p>}
      >
        <div className="grid md:grid-cols-2 gap-4">
          {customers.map((c) => (
            <Card key={c.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>{c.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                    <Pencil size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-gray-300 text-sm space-y-1">
                <p><User size={14} /> {c.user?.name || "-"}</p>
                <p><strong>Address:</strong> {c.address || "-"}</p>
                <p><strong>Store:</strong> {c.store?.name || "-"}</p>
                <div>
                  <strong>Phones:</strong>
                  <ul className="list-disc list-inside">
                    {c.phones.map((p, i) => (
                      <li key={i}>
                        {p.phoneNumber} ({p.type}) {p.contactName && `— ${p.contactName}`} {p.note && `— ${p.note}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2, Phone, Edit, Check } from "lucide-react";

type Store = { id: string; name: string; address?: string };
type SupplierPhone = {
  id?: string;
  phoneNumber: string;
  contactName?: string;
  type?: "mobile" | "work" | "home" | "other";
  note?: string | null;
};
type Supplier = {
  id: string;
  name: string;
  email?: string | null;
  location: string;
  note?: string | null;
  store?: Store | null;
  phones?: SupplierPhone[];
  createdAt?: string;
};

export default function SuppliersPage() {
  // data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openPhone, setOpenPhone] = useState(false);
  const [selectedSupplierForPhone, setSelectedSupplierForPhone] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");

  // create supplier form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState(""); // backend requires non-undefined
  const [note, setNote] = useState("");
  const [storeId, setStoreId] = useState<string | null>(null);

  // phone form (dynamic list)
  const [phones, setPhones] = useState<SupplierPhone[]>([
    { phoneNumber: "", contactName: "", type: "mobile", note: null },
  ]);

  // fetch suppliers and stores
  async function fetchStores() {
    try {
      const res = await axios.get("/api/stores");
      const data = Array.isArray(res.data) ? res.data : [];
      setStores(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch stores");
    }
  }

  async function fetchSuppliers() {
    setLoading(true);
    try {
      // your suppliers API returns { data, pagination, filters }
      const res = await axios.get("/api/suppliers", {
        params: { search, limit: 50, sort_by: "createdAt", sort_order: "desc" },
      });
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      setSuppliers(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStores();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    // simple debounce for search
    const t = setTimeout(() => fetchSuppliers(), 350);
    return () => clearTimeout(t);
  }, [search]);

  // supplier create
  async function handleCreateSupplier() {
    if (!name.trim()) return toast.error("Supplier name required");
    if (!storeId) return toast.error("Select a store");

    try {
      const payload = {
        name: name.trim(),
        email: email ? email.trim() : undefined,
        location: location ? location.trim() : "", // backend expects string for location
        note: note ? note.trim() : undefined,
        storeId,
      };

      const res = await axios.post("/api/suppliers", payload);
      const created: Supplier = res.data;
      toast.success("Supplier created");

      // reset create form
      setName("");
      setEmail("");
      setLocation("");
      setNote("");
      setStoreId(null);
      setOpenCreate(false);

      // after create we open phone dialog for this supplier
      setSelectedSupplierForPhone(created);
      setPhones([{ phoneNumber: "", contactName: "", type: "mobile", note: null }]);
      setOpenPhone(true);

      // refresh list
      fetchSuppliers();
    } catch (err: any) {
      console.error("create supplier error:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Failed to create supplier");
    }
  }

  // phones handling
  function addPhoneRow() {
    setPhones((p) => [...p, { phoneNumber: "", contactName: "", type: "mobile", note: null }]);
  }
  function updatePhoneRow(idx: number, field: keyof SupplierPhone, value: any) {
    setPhones((prev) => {
      const cp = [...prev];
      cp[idx] = { ...cp[idx], [field]: value };
      return cp;
    });
  }
  function removePhoneRow(idx: number) {
    setPhones((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSavePhones() {
    if (!selectedSupplierForPhone) return toast.error("No supplier selected");
    const supplierId = selectedSupplierForPhone.id;

    // validate at least one phoneNumber filled
    const validPhones = phones
      .map((p) => ({
        phoneNumber: (p.phoneNumber || "").trim(),
        contactName: p.contactName ? String(p.contactName).trim() : undefined,
        type: p.type || undefined,
        note: p.note ?? undefined,
      }))
      .filter((p) => p.phoneNumber.length > 0);

    if (validPhones.length === 0) return toast.error("Enter at least one phone number");

    try {
      // POST phones one by one (API supports creating single phone per endpoint)
      for (const ph of validPhones) {
        await axios.post(`/api/suppliers/${supplierId}/phone`, ph);
      }
      toast.success("Phone(s) saved");
      setOpenPhone(false);
      setSelectedSupplierForPhone(null);
      fetchSuppliers();
    } catch (err: any) {
      console.error("save phones error:", err);
      toast.error(err?.response?.data?.error || "Failed to save phones");
    }
  }

  // delete supplier (soft delete via backend if implemented; otherwise permanent)
  async function handleDeleteSupplier(id: string) {
    if (!confirm("Delete supplier? This may be permanent.")) return;
    try {
      await axios.delete(`/api/suppliers/${id}`);
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete supplier");
    }
  }

  // UI pieces
  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-green-400 to-emerald-400">
            Suppliers
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage suppliers and phone contacts</p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search name, email, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border-gray-700 text-white"
          />

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-400 to-green-500 text-black flex items-center gap-2">
                <Plus size={16} /> New Supplier
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-black/60 backdrop-blur-md border border-gray-700 rounded-xl p-4 max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Supplier</DialogTitle>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <Label>Store</Label>
                <Select value={storeId || ""} onValueChange={(v) => setStoreId(v || null)}>
                  <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.address ? `— ${s.address}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-black/30 border-gray-700" placeholder="Supplier name" />

                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-black/30 border-gray-700" placeholder="Optional email" />

                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-black/30 border-gray-700" placeholder="City / Address (required by model)" />

                <Label>Note</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} className="bg-black/30 border-gray-700" placeholder="Optional note" />
              </div>

              <DialogFooter>
                <div className="flex gap-2 w-full">
                  <Button variant="ghost" onClick={() => setOpenCreate(false)}>Cancel</Button>
                  <Button className="ml-auto bg-gradient-to-r from-green-400 to-green-500 text-black" onClick={handleCreateSupplier}>
                    Create & Add Phone
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Suppliers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-gray-400">Loading...</div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full text-center text-gray-400">No suppliers found</div>
        ) : (
          suppliers.map((s) => (
            <Card key={s.id} className="bg-black/40 border border-gray-800 shadow-md">
              <CardHeader className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-300">{s.name}</h3>
                  <p className="text-xs text-gray-400">{s.store?.name || "No store"}</p>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    title="Add / edit phones"
                    onClick={() => {
                      setSelectedSupplierForPhone(s);
                      setPhones([{ phoneNumber: "", contactName: "", type: "mobile", note: null }]);
                      setOpenPhone(true);
                    }}
                    className="p-2 rounded-md hover:bg-gray-800/40"
                  >
                    <Phone size={16} />
                  </button>

                  <button
                    title="Delete supplier"
                    onClick={() => handleDeleteSupplier(s.id)}
                    className="p-2 rounded-md hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                <p className="text-sm text-gray-300">{s.email || "-"}</p>
                <p className="text-sm text-gray-300">Location: {s.location || "-"}</p>
                {s.note && <p className="text-sm text-gray-400 italic">Note: {s.note}</p>}

                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    Phones
                  </h4>
                  <ul className="text-sm text-gray-300 mt-1 list-disc list-inside space-y-1">
                    {s.phones && s.phones.length > 0 ? (
                      s.phones.map((p, i) => (
                        <li key={i}>
                          {p.phoneNumber} {p.contactName ? `— ${p.contactName}` : ""} <span className="text-xs text-gray-400">({p.type})</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No phones</li>
                    )}
                  </ul>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSupplierForPhone(s);
                      // prefill with existing phones if any
                      setPhones(s.phones && s.phones.length > 0 ? s.phones.map(ph => ({ ...ph })) : [{ phoneNumber: "", contactName: "", type: "mobile", note: null }]);
                      setOpenPhone(true);
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-green-400 to-green-500 text-black rounded-md"
                  >
                    <Edit size={14} /> &nbsp; Manage Phones
                  </button>

                  <div className="ml-auto text-xs text-gray-400">
                    Added: {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Phone dialog */}
      <Dialog open={openPhone} onOpenChange={(v) => { setOpenPhone(v); if (!v) setSelectedSupplierForPhone(null); }}>
        <DialogContent className="bg-black/60 backdrop-blur-md border border-gray-700 rounded-xl p-4 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSupplierForPhone ? `Phones for ${selectedSupplierForPhone.name}` : "Add Phones"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {selectedSupplierForPhone && (
              <p className="text-sm text-gray-300">Supplier: <strong>{selectedSupplierForPhone.name}</strong> — Store: <span className="text-gray-400">{selectedSupplierForPhone.store?.name || "-"}</span></p>
            )}

            {phones.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Label>Phone</Label>
                  <Input
                    value={p.phoneNumber}
                    onChange={(e) => updatePhoneRow(i, "phoneNumber", e.target.value)}
                    placeholder="e.g., 0912345678"
                    className="bg-black/30 border-gray-700"
                  />
                </div>

                <div className="col-span-4">
                  <Label>Contact</Label>
                  <Input
                    value={p.contactName}
                    onChange={(e) => updatePhoneRow(i, "contactName", e.target.value)}
                    placeholder="Contact name"
                    className="bg-black/30 border-gray-700"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Type</Label>
                  <Select value={p.type || "mobile"} onValueChange={(v) => updatePhoneRow(i, "type", v as any)}>
                    <SelectTrigger className="bg-black/30 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">mobile</SelectItem>
                      <SelectItem value="work">work</SelectItem>
                      <SelectItem value="home">home</SelectItem>
                      <SelectItem value="other">other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 flex items-end">
                  <button title="Remove" onClick={() => removePhoneRow(i)} className="p-2 text-red-400 hover:text-red-300">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="col-span-12">
                  <Label>Note</Label>
                  <Input
                    value={p.note ?? ""}
                    onChange={(e) => updatePhoneRow(i, "note", e.target.value)}
                    placeholder="Optional note"
                    className="bg-black/30 border-gray-700"
                  />
                </div>
              </div>
            ))}

            <div>
              <Button variant="ghost" onClick={addPhoneRow} className="text-gray-300">
                <Plus size={14} /> Add another phone
              </Button>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button variant="ghost" onClick={() => { setOpenPhone(false); setSelectedSupplierForPhone(null); }}>Cancel</Button>
              <Button className="ml-auto bg-gradient-to-r from-green-400 to-green-500 text-black" onClick={handleSavePhones}>
                <Check size={14} /> &nbsp; Save Phones
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

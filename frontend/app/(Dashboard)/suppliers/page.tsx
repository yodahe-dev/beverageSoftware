"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, RefreshCcw, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    location: "",
    note: "",
    storeId: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/suppliers?search=${search}&page=${page}`);
      setSuppliers(res.data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchStores = async () => {
    try {
      const res = await axios.get("/api/stores");
      setStores(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newSupplier.name || !newSupplier.storeId)
      return alert("Name and store required");
    setCreating(true);
    try {
      await axios.post("/api/suppliers", newSupplier);
      setOpen(false);
      setNewSupplier({
        name: "",
        email: "",
        location: "",
        note: "",
        storeId: "",
      });
      fetchSuppliers();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to create supplier");
    }
    setCreating(false);
  };

  useEffect(() => {
    fetchSuppliers();
    fetchStores();
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Suppliers</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500"
          />
          <Button
            onClick={() => fetchSuppliers()}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
          >
            <RefreshCcw className="h-4 w-4 mr-1" /> Search
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus className="h-4 w-4 mr-1" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-gray-900 border border-gray-800 text-gray-100">
              <DialogHeader>
                <DialogTitle>New Supplier</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newSupplier.name}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, name: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={newSupplier.email}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, email: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={newSupplier.location}
                    onChange={(e) =>
                      setNewSupplier({
                        ...newSupplier,
                        location: e.target.value,
                      })
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>
                <div>
                  <Label>Note</Label>
                  <Input
                    value={newSupplier.note}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, note: e.target.value })
                    }
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                </div>
                <div>
                  <Label>Store *</Label>
                  <Select
                    value={newSupplier.storeId}
                    onValueChange={(v) =>
                      setNewSupplier({ ...newSupplier, storeId: v })
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-gray-100">
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}{" "}
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-gray-900 border border-gray-800 text-gray-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-200">Supplier List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : suppliers.length === 0 ? (
            <p className="text-sm text-gray-400">No suppliers found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Location</TableHead>
                  <TableHead className="text-gray-400">Store</TableHead>
                  <TableHead className="text-gray-400">Phones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <SupplierRow key={s.id} supplier={s} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SupplierRow({ supplier }: { supplier: any }) {
  const [phones, setPhones] = useState<any[]>(supplier.phones || []);
  const [openPhone, setOpenPhone] = useState(false);
  const [newPhone, setNewPhone] = useState({
    phoneNumber: "",
    contactName: "",
    type: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  const addPhone = async () => {
    if (!newPhone.phoneNumber) return alert("Phone number required");
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/suppliers/${supplier.id}/phone`,
        newPhone
      );
      setPhones([res.data, ...phones]);
      setOpenPhone(false);
      setNewPhone({ phoneNumber: "", contactName: "", type: "", note: "" });
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || "Failed to add phone");
    }
    setLoading(false);
  };

  return (
    <TableRow className="border-gray-800 hover:bg-gray-800/40">
      <TableCell>{supplier.name}</TableCell>
      <TableCell className="text-gray-400">{supplier.email || "-"}</TableCell>
      <TableCell className="text-gray-400">
        {supplier.location || "-"}
      </TableCell>
      <TableCell className="text-gray-400">
        {supplier.store?.name || "-"}
      </TableCell>
      <TableCell>
        <Dialog open={openPhone} onOpenChange={setOpenPhone}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
            >
              <Phone className="h-4 w-4 mr-1" /> {phones.length}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800 text-gray-100">
            <DialogHeader>
              <DialogTitle>Phones for {supplier.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {phones.length === 0 && (
                <p className="text-sm text-gray-400">No phones yet.</p>
              )}
              {phones.map((p) => (
                <div
                  key={p.id}
                  className="border border-gray-800 p-2 rounded-md text-sm bg-gray-800/60"
                >
                  <p className="text-gray-200 font-semibold">
                    {p.phoneNumber}
                  </p>
                  {p.contactName && (
                    <p className="text-gray-400">{p.contactName}</p>
                  )}
                  {p.type && (
                    <p className="text-xs text-gray-500 italic">{p.type}</p>
                  )}
                </div>
              ))}
              <div className="border-t border-gray-800 pt-2">
                <Label>New phone</Label>
                <Input
                  placeholder="Phone number"
                  value={newPhone.phoneNumber}
                  onChange={(e) =>
                    setNewPhone({ ...newPhone, phoneNumber: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-gray-200"
                />
                <Input
                  placeholder="Contact name"
                  value={newPhone.contactName}
                  onChange={(e) =>
                    setNewPhone({
                      ...newPhone,
                      contactName: e.target.value,
                    })
                  }
                  className="bg-gray-800 border-gray-700 text-gray-200"
                />
                <Select
                  value={newPhone.type}
                  onValueChange={(v) => setNewPhone({ ...newPhone, type: v })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                    <SelectValue placeholder="Phone type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-gray-100">
                    <SelectItem value="MOBILE">Mobile</SelectItem>
                    <SelectItem value="WORK">Work</SelectItem>
                    <SelectItem value="HOME">Home</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Note"
                  value={newPhone.note}
                  onChange={(e) =>
                    setNewPhone({ ...newPhone, note: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700 text-gray-200"
                />
                <Button
                  onClick={addPhone}
                  disabled={loading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  )}{" "}
                  Add Phone
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}

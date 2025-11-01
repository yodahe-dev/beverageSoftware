"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {jwtDecode} from "jwt-decode";

interface Credit {
  id: string;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  status: string;
  note?: string;
  createdAt: string;
  customer?: { name: string };
  user?: { name: string };
}

interface Customer {
  id: string;
  name: string;
}

interface Sale {
  id: string;
  totalAmount: string;
}

interface SaleItem {
  id: string;
  subtotal: string;
  note?: string;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    saleId: "",
    saleItemId: "",
    quantity: 1,
    creditPrice: 0,
    returnPrice: 0,
    totalAmount: 0,
    paidAmount: 0,
    balance: 0,
    status: "active",
    dueDate: "",
    note: "",
  });

  const [userId, setUserId] = useState<string>("");

  // Decode userId from JWT
  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserId(decoded.userId);
      } catch {
        console.error("Invalid JWT token");
      }
    }
  }, []);

  // Fetch credits
  const fetchCredits = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/credits", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      url.searchParams.set("userId", userId);

      const res = await fetch(url.toString());
      const data = await res.json();
      setCredits(data);
    } catch (err) {
      console.error("Error fetching credits:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, userId]);

  useEffect(() => {
    if (userId) fetchCredits();
  }, [fetchCredits, userId]);

  // Fetch customers and sales
  useEffect(() => {
    (async () => {
      try {
        const [custRes, saleRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/sales"),
        ]);
        const custData = await custRes.json();
        const saleData = await saleRes.json();
        setCustomers(custData.data || []);
        setSales(saleData || []);
      } catch (err) {
        console.error("Error fetching customers or sales:", err);
      }
    })();
  }, []);

  // Fetch sale items when a sale is selected
  useEffect(() => {
    if (!form.saleId) {
      setSaleItems([]);
      setForm(f => ({ ...f, saleItemId: "" }));
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/sales/${form.saleId}`);
        const data = await res.json();
        setSaleItems(data.items || []);
      } catch (err) {
        console.error("Error fetching sale items:", err);
      }
    })();
  }, [form.saleId]);

  // Auto calculate balance
  useEffect(() => {
    const total = parseFloat(form.totalAmount.toString());
    const paid = parseFloat(form.paidAmount.toString());
    setForm(f => ({ ...f, balance: Math.max(total - paid, 0) }));
  }, [form.totalAmount, form.paidAmount]);

  const handleCreate = async () => {
    if (!form.customerId || !form.saleId || !form.saleItemId || form.totalAmount <= 0) {
      return alert("Missing required fields");
    }
    try {
      const payload = { ...form, userId };
      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({
          customerId: "",
          saleId: "",
          saleItemId: "",
          quantity: 1,
          creditPrice: 0,
          returnPrice: 0,
          totalAmount: 0,
          paidAmount: 0,
          balance: 0,
          status: "active",
          dueDate: "",
          note: "",
        });
        fetchCredits();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create credit");
      }
    } catch (error) {
      console.error("Create credit error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-6 text-white">
      {/* CREATE CREDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4 bg-green-600 hover:bg-green-700">+ Add Credit</Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Create New Credit</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">

            <div className="flex flex-col">
              <Label>Customer *</Label>
              <Select
                value={form.customerId}
                onValueChange={(v) => setForm(f => ({ ...f, customerId: v }))}
              >
                <SelectTrigger className="bg-gray-700 text-white">
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <Label>Sale *</Label>
              <Select
                value={form.saleId}
                onValueChange={(v) => setForm(f => ({ ...f, saleId: v, saleItemId: "" }))}
              >
                <SelectTrigger className="bg-gray-700 text-white">
                  <SelectValue placeholder="Select Sale" />
                </SelectTrigger>
                <SelectContent>
                  {sales.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.id.slice(0, 6)} - {s.totalAmount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <Label>Sale Item *</Label>
              <Select
                value={form.saleItemId}
                onValueChange={v => setForm(f => ({ ...f, saleItemId: v }))}
              >
                <SelectTrigger className="bg-gray-700 text-white">
                  <SelectValue placeholder="Select Sale Item" />
                </SelectTrigger>
                <SelectContent>
                  {saleItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.note || "Item"} - {item.subtotal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))}
                className="bg-gray-700 text-white"
              />
            </div>

            <div className="flex flex-col">
              <Label>Credit Price</Label>
              <Input
                type="number"
                value={form.creditPrice}
                onChange={e => setForm(f => ({ ...f, creditPrice: +e.target.value }))}
                className="bg-gray-700 text-white"
              />
            </div>

            <div className="flex flex-col">
              <Label>Return Price</Label>
              <Input
                type="number"
                value={form.returnPrice}
                onChange={e => setForm(f => ({ ...f, returnPrice: +e.target.value }))}
                className="bg-gray-700 text-white"
              />
            </div>

            <div className="flex flex-col">
              <Label>Total Amount *</Label>
              <Input
                type="number"
                value={form.totalAmount}
                onChange={e => setForm(f => ({ ...f, totalAmount: +e.target.value }))}
                className="bg-gray-700 text-white"
              />
            </div>

            <div className="flex flex-col">
              <Label>Paid Amount</Label>
              <Input
                type="number"
                value={form.paidAmount}
                onChange={e => setForm(f => ({ ...f, paidAmount: +e.target.value }))}
                className="bg-gray-700 text-white"
              />
            </div>

            <div className="flex flex-col">
              <Label>Balance</Label>
              <Input
                type="number"
                value={form.balance}
                disabled
                className="bg-gray-600 text-gray-300 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={v => setForm(f => ({ ...f, status: v }))}
              >
                <SelectTrigger className="bg-gray-700 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-white bg-gray-700">
                    {form.dueDate ? format(new Date(form.dueDate), "PPP") : "Select Due Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.dueDate ? new Date(form.dueDate) : undefined}
                    onSelect={date => setForm(f => ({ ...f, dueDate: date?.toISOString() || "" }))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col">
              <Label>Note</Label>
              <Input
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                className="bg-gray-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 w-full mt-3">
              Create Credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREDITS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {loading ? (
          <p>Loading...</p>
        ) : (
          credits.map(c => (
            <Card key={c.id} className="bg-gray-800 border border-gray-700 hover:scale-105 transition-transform">
              <CardHeader>
                <CardTitle>{c.customer?.name || "Unknown Customer"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p>Total: {c.totalAmount}</p>
                <p>Paid: {c.paidAmount}</p>
                <p>Balance: {c.balance}</p>
                <p>Status: {c.status}</p>
                <p>Note: {c.note || "-"}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

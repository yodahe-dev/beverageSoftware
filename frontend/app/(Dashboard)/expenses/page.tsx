"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Expense = {
  id: string;
  title: string;
  amount: number;
  quantity: number;
  category: string;
  note?: string | null;
  createdAt: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    quantity: "1",
    category: "other",
    note: "",
  });
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const res = await axios.get(`/api/expenses?search=${search}`);
      setExpenses(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      if (!form.title || !form.amount) {
        toast.error("Title and amount are required");
        return;
      }

      const payload = {
        title: form.title,
        amount: parseFloat(form.amount),
        quantity: parseInt(form.quantity, 10) || 1,
        category: form.category,
        note: form.note || null,
      };

      const res = await axios.post("/api/expenses", payload);
      toast.success("Expense added");
      setForm({ title: "", amount: "", quantity: "1", category: "other", note: "" });
      setOpen(false);
      fetchExpenses();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  const totalETB = expenses.reduce((sum, e) => sum + e.amount * e.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-semibold">Expenses</h1>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchExpenses()}
              className="pl-8"
            />
          </div>
          <Button onClick={fetchExpenses} variant="outline">
            Search
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                <Plus size={16} />
                Add
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Expense title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Amount (ETB)</Label>
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    placeholder="1"
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="both">Both</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Note</Label>
                  <Input
                    placeholder="Optional note"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-emerald-200 shadow-md bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader>
          <CardTitle className="text-emerald-700">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-700">{totalETB.toFixed(2)} ETB</div>
          <p className="text-gray-500 text-sm mt-1">
            Based on {expenses.length} recorded expense{expenses.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin w-6 h-6 text-emerald-600" />
        </div>
      ) : expenses.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No expenses found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {expenses.map((e) => (
            <Card
              key={e.id}
              className="border border-emerald-100 shadow-sm hover:shadow-md transition bg-gradient-to-br from-white to-emerald-50"
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{e.title}</span>
                  <span className="text-emerald-700 font-semibold">{e.amount} ETB</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>
                  <strong>Qty:</strong> {e.quantity}
                </p>
                <p>
                  <strong>Category:</strong> {e.category}
                </p>
                {e.note && (
                  <p className="text-gray-500 italic mt-1">
                    “{e.note}”
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(e.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

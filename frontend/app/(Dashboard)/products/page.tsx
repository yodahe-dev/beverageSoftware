'use client';

import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  subbrand?: { id: string; name: string; brand?: { name: string } };
  category: "drink" | "bottle" | "both";
  costPrice?: number;
  sellPrice?: number;
  note?: string;
  quantity: number;
}

interface SubBrand {
  id: string;
  name: string;
  brand?: { name: string };
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [subbrands, setSubbrands] = useState<SubBrand[]>([]);
  const [searchSub, setSearchSub] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [subbrandId, setSubbrandId] = useState("");
  const [category, setCategory] = useState<"drink" | "bottle" | "both">("drink");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState("");

  // Fetch Products
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`/api/products?search=${search}`);
      const data = Array.isArray(res.data) ? res.data : res.data.products || [];
      setProducts(data);
    } catch (err) {
      console.error("Fetch products error:", err);
      setProducts([]);
    }
  };

  // Fetch SubBrands
  const fetchSubBrands = async (q = "") => {
    try {
      const res = await axios.get(`/api/brands/subbrands?search=${q}`);
      const data = Array.isArray(res.data) ? res.data : res.data.subbrands || [];
      setSubbrands(data);
    } catch (err) {
      console.error("Fetch subbrands error:", err);
      setSubbrands([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  useEffect(() => {
    const delay = setTimeout(() => fetchSubBrands(searchSub), 300);
    return () => clearTimeout(delay);
  }, [searchSub]);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setPrice("");
    setSubbrandId("");
    setCategory("drink");
    setCostPrice("");
    setSellPrice("");
    setNote("");
    setQuantity("");
  };

  const handleSave = async () => {
    if (!subbrandId) return toast.error("Please select a SubBrand");
    if (!name.trim()) return toast.error("Product name required");
    if (!price.trim()) return toast.error("Price required");

    try {
      const payload = {
        name,
        price: Number(price),
        subbrandId,
        category,
        costPrice: costPrice ? Number(costPrice) : undefined,
        sellPrice: sellPrice ? Number(sellPrice) : undefined,
        note: note || undefined,
        quantity: quantity ? Number(quantity) : 0,
      };

      if (editing) {
        await axios.patch(`/api/products/${editing.id}`, payload);
        toast.success("Product updated");
      } else {
        await axios.post("/api/products", payload);
        toast.success("Product created");
      }

      setOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error("Save product error:", err);
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success("Deleted");
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      toast.error("Failed");
    }
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setPrice(p.price.toString());
    setSubbrandId(p.subbrand?.id || "");
    setCategory(p.category);
    setCostPrice(p.costPrice?.toString() || "");
    setSellPrice(p.sellPrice?.toString() || "");
    setNote(p.note || "");
    setQuantity(p.quantity.toString());
    setOpen(true);
  };

  return (
    <div className="p-6 bg-gradient-to-b from-gray-900 to-black text-white min-h-screen">
      <div className="flex justify-between mb-6 items-center">
        <div className="flex items-center gap-2 w-1/3">
          <Search className="text-gray-400" />
          <Input
            placeholder="Search Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 border-none text-white"
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-green-500 text-black font-semibold hover:bg-green-400 transition-all">
              <Plus /> {editing ? "Edit Product" : "Add Product"}
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-gray-800 border border-gray-700 text-white rounded-xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editing ? "Edit Product" : "Add Product"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <Input
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-700"
              />
              <Input
                placeholder="Price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-gray-700"
              />
              <Input
                placeholder="Cost Price"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="bg-gray-700"
              />
              <Input
                placeholder="Sell Price"
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="bg-gray-700"
              />
              <Input
                placeholder="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-gray-700"
              />
              <Input
                placeholder="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-gray-700"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="bg-gray-700 p-2 rounded-lg w-full text-black"
              >
                <option value="drink">Drink</option>
                <option value="bottle">Bottle</option>
                <option value="both">Both</option>
              </select>

              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="mb-2 text-gray-300 font-semibold">Select SubBrand:</p>
                <Input
                  placeholder="Search SubBrand..."
                  value={searchSub}
                  onChange={(e) => setSearchSub(e.target.value)}
                  className="bg-gray-800 mb-2"
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {subbrands.map((sb) => (
                    <div
                      key={sb.id}
                      onClick={() => setSubbrandId(sb.id)}
                      className={`cursor-pointer px-3 py-2 rounded-lg text-sm transition ${
                        subbrandId === sb.id ? "bg-blue-500 text-white" : "hover:bg-gray-600"
                      }`}
                    >
                      <span className="font-semibold">{sb.name}</span>{" "}
                      <span className="text-gray-400 text-xs">({sb.brand?.name || "No brand"})</span>
                    </div>
                  ))}
                  {subbrands.length === 0 && (
                    <p className="text-gray-400 text-sm text-center">No subbrands found</p>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-blue-500 hover:bg-blue-400 text-black font-semibold"
                onClick={handleSave}
              >
                Save Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table className="bg-gray-800 w-full rounded-lg overflow-hidden">
        <TableHeader>
          <TableRow className="bg-gray-700 text-gray-300">
            <TableCell>Name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Cost</TableCell>
            <TableCell>Sell</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Brand</TableCell>
            <TableCell>SubBrand</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(products) && products.length > 0 ? (
            products.map((p) => (
              <TableRow
                key={p.id}
                className="hover:bg-gray-700 transition-all border-b border-gray-700"
              >
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.price}</TableCell>
                <TableCell>{p.costPrice || "-"}</TableCell>
                <TableCell>{p.sellPrice || "-"}</TableCell>
                <TableCell>{p.quantity}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.subbrand?.brand?.name || "No brand"}</TableCell>
                <TableCell>{p.subbrand?.name || "No subbrand"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => openEdit(p)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(p.id)}
                    className="bg-red-600 hover:bg-red-500 text-white"
                  >
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-400 py-4">
                No products found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

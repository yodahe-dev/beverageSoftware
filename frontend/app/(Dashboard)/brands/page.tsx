'use client';

import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Brand {
  id: string;
  name: string;
  type: string;
  note?: string;
  subbrands?: SubBrand[];
  store?: { id: string; name: string };
}

interface SubBrand {
  id: string;
  name: string;
  note?: string;
  brand?: { id: string; name: string };
}

interface Store {
  id: string;
  name: string;
  address?: string;
}

const BRAND_TYPES = ['softdrink', 'alcohol', 'other'];

export default function BrandPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subbrands, setSubbrands] = useState<SubBrand[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [openBrand, setOpenBrand] = useState(false);
  const [openSubBrand, setOpenSubBrand] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'brand' | 'subbrand', id: string } | null>(null);

  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandType, setBrandType] = useState('softdrink');
  const [brandNote, setBrandNote] = useState('');
  const [brandStoreId, setBrandStoreId] = useState<string | null>(null);

  const [editingSubBrand, setEditingSubBrand] = useState<SubBrand | null>(null);
  const [subBrandName, setSubBrandName] = useState('');
  const [subBrandNote, setSubBrandNote] = useState('');
  const [subBrandBrand, setSubBrandBrand] = useState<Brand | null>(null);

  // fetch brands, subbrands and stores
  const fetchData = async () => {
    try {
      const [brandRes, subRes, storeRes] = await Promise.all([
        axios.get(`/api/brands?search=${encodeURIComponent(searchQuery)}`),
        axios.get(`/api/brands/subbrands?search=${encodeURIComponent(searchQuery)}`),
        axios.get(`/api/stores`),
      ]);

      const brandsData: Brand[] = Array.isArray(brandRes.data.brands) ? brandRes.data.brands : Array.isArray(brandRes.data) ? brandRes.data : [];
      const subData: SubBrand[] = Array.isArray(subRes.data.data) ? subRes.data.data : (Array.isArray(subRes.data) ? subRes.data : []);
      const storesData: Store[] = Array.isArray(storeRes.data) ? storeRes.data : [];

      const validSubbrands = subData.filter(s => (s.brand && s.brand.id) || (s as any).brandId);

      const brandsWithSubs = brandsData.map(b => ({
        ...b,
        subbrands: validSubbrands.filter(s => s.brand?.id === b.id || (s as any).brandId === b.id)
      }));

      setBrands(brandsWithSubs);
      setSubbrands(validSubbrands);
      setStores(storesData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch brands, subbrands or stores");
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  // Save Brand
  const handleSaveBrand = async () => {
    if (!brandName) return toast.error("Brand name required");
    if (!brandStoreId) return toast.error("Please select a store for the brand");

    try {
      if (editingBrand) {
        await axios.put(`/api/brands/${editingBrand.id}`, {
          name: brandName,
          type: brandType,
          note: brandNote,
          storeId: brandStoreId,
        });
        toast.success("Brand updated");
      } else {
        await axios.post(`/api/brands`, {
          name: brandName,
          type: brandType,
          note: brandNote,
          storeId: brandStoreId,
        });
        toast.success("Brand created");
      }
      setBrandName(''); setBrandNote(''); setBrandType('softdrink'); setBrandStoreId(null); setEditingBrand(null); setOpenBrand(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save brand");
    }
  };

  // Save SubBrand
  const handleSaveSubBrand = async () => {
    if (!subBrandName || !subBrandBrand)
      return toast.error("SubBrand name and brand required");
    try {
      if (editingSubBrand) {
        await axios.put(`/api/brands/subbrands/${editingSubBrand.id}`, {
          name: subBrandName,
          note: subBrandNote,
          brandId: subBrandBrand.id,
        });
        toast.success("SubBrand updated");
      } else {
        await axios.post(`/api/brands/subbrands`, {
          name: subBrandName,
          note: subBrandNote,
          brandId: subBrandBrand.id,
        });
        toast.success("SubBrand created");
      }
      setSubBrandName(''); setSubBrandNote(''); setSubBrandBrand(null); setEditingSubBrand(null); setOpenSubBrand(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save subbrand");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'brand') {
        await axios.delete(`/api/brands/${deleteTarget.id}`);
        toast.success("Brand deleted");
      } else {
        await axios.delete(`/api/brands/subbrands/${deleteTarget.id}`);
        toast.success("SubBrand deleted");
      }
      setDeleteDialogOpen(false); setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="h-screen w-full p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00b894] via-[#00cec9] to-[#a8eb12]">
          Brands & SubBrands
        </h1>

        <div className="flex gap-2 flex-wrap">
          <Dialog open={openBrand} onOpenChange={setOpenBrand}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#00b894] to-[#00cec9] text-black flex items-center gap-2">
                <Plus /> {editingBrand ? "Edit Brand" : "Add Brand"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121212] rounded-xl border border-gray-700 shadow-xl p-4 space-y-3">
              <DialogHeader>
                <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
              </DialogHeader>

              <Label>Store</Label>
              <Select value={brandStoreId || ''} onValueChange={(v) => setBrandStoreId(v || null)}>
                <SelectTrigger className="bg-[#121212] text-white border-gray-700">
                  <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Label>Name</Label>
              <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Brand Name" className="bg-[#121212] text-white border-gray-700" />

              <Label>Type</Label>
              <Select value={brandType} onValueChange={setBrandType}>
                <SelectTrigger className="bg-[#121212] text-white border-gray-700"><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>{BRAND_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>

              <Label>Note</Label>
              <Input value={brandNote} onChange={e => setBrandNote(e.target.value)} placeholder="Optional note" className="bg-[#121212] text-white border-gray-700" />

              <Button onClick={handleSaveBrand} className="w-full bg-gradient-to-r from-[#00cec9] to-[#a8eb12] text-black">
                {editingBrand ? "Update Brand" : "Save Brand"}
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog open={openSubBrand} onOpenChange={setOpenSubBrand}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#ff7f50] to-[#ff6f91] text-black flex items-center gap-2">
                <Plus /> {editingSubBrand ? "Edit SubBrand" : "Add SubBrand"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121212] rounded-xl border border-gray-700 shadow-xl p-4 space-y-3">
              <DialogHeader>
                <DialogTitle>{editingSubBrand ? "Edit SubBrand" : "Add SubBrand"}</DialogTitle>
              </DialogHeader>

              <Label>Brand</Label>
              <Select value={subBrandBrand?.id || ''} onValueChange={id => setSubBrandBrand(brands.find(b => b.id === id) || null)}>
                <SelectTrigger className="bg-[#121212] text-white border-gray-700"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>

              <Label>Name</Label>
              <Input value={subBrandName} onChange={e => setSubBrandName(e.target.value)} placeholder="SubBrand Name" className="bg-[#121212] text-white border-gray-700" />

              <Label>Note</Label>
              <Input value={subBrandNote} onChange={e => setSubBrandNote(e.target.value)} placeholder="Optional note" className="bg-[#121212] text-white border-gray-700" />

              <Button onClick={handleSaveSubBrand} className="w-full bg-gradient-to-r from-[#ff6f91] to-[#ff9f43] text-black">
                {editingSubBrand ? "Update SubBrand" : "Save SubBrand"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search brands or subbrands..." className="w-full mb-6 bg-[#121212] border-gray-700 text-white" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map(b => (
          <Card key={b.id} className="bg-gray-900 border border-gray-700 shadow-lg hover:shadow-2xl transition-transform hover:scale-105">
            <CardHeader className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00b894] via-[#00cec9] to-[#a8eb12]">{b.name}</h2>
                <p className="text-xs text-gray-400">{b.store?.name || ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingBrand(b); setBrandName(b.name); setBrandType(b.type); setBrandNote(b.note || ''); setBrandStoreId(b.store?.id || null); setOpenBrand(true); }}>
                  <Edit className="w-5 h-5 text-gray-300 hover:text-white" />
                </button>
                <button onClick={() => { setDeleteTarget({ type: 'brand', id: b.id }); setDeleteDialogOpen(true); }}>
                  <Trash2 className="w-5 h-5 text-red-500 hover:text-red-700" />
                </button>
              </div>
            </CardHeader>

            <CardContent>
              {b.note && <p className="text-gray-400 italic mb-2">{b.note}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {b.subbrands?.map(s => (
                  <span key={s.id} className="px-3 py-1 bg-gradient-to-r from-[#ff7f50] to-[#ff6f91] rounded-full text-black flex items-center gap-1 shadow-md hover:scale-105 transition-transform">
                    {s.name}
                    <button onClick={() => { setEditingSubBrand(s); setSubBrandName(s.name); setSubBrandNote(s.note || ''); setSubBrandBrand(b); setOpenSubBrand(true); }}>
                      <Edit className="w-4 h-4 text-gray-800" />
                    </button>
                    <button onClick={() => { setDeleteTarget({ type: 'subbrand', id: s.id }); setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4 text-red-700" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#121212] text-white rounded-xl p-6 border border-gray-700">
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p className="my-4 text-gray-300">Are you sure you want to delete this {deleteTarget?.type}?</p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeleteDialogOpen(false)} className="bg-gray-700">Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, Edit2, Plus, RefreshCw, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import axios from 'axios';

interface Store {
  id: string;
  name: string;
  address: string;
  note?: string;
  isActive: boolean;
  brands?: string[];
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editStore, setEditStore] = useState<Store | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const initialForm = { name: '', address: '', note: '', isActive: true };
  const [form, setForm] = useState(initialForm);

  // ---------------- Fetch Stores ----------------
  const fetchStores = async (reset = false) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/stores?page=${reset ? 1 : page}&limit=50&search=${search}`);
      const data: Store[] = res.data;
      if (reset) setStores(data);
      else setStores((prev) => [...prev, ...data]);
      setHasMore(data.length === 50);
      setPage(reset ? 2 : page + 1);
    } catch (err) {
      toast.error('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(true);
  }, [search]);

  const debounce = (fn: Function, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };
  const handleSearch = useCallback(debounce((v: string) => setSearch(v), 500), []);

  // ---------------- Save / Update Store ----------------
  const handleSaveStore = async () => {
    if (!form.name || !form.address) return toast.error('Name and address required');
    setFormLoading(true);
    try {
      if (editStore) {
        await axios.put(`/api/stores/${editStore.id}`, form);
        toast.success('Store updated');
      } else {
        await axios.post(`/api/stores`, form);
        toast.success('Store created');
      }
      setForm(initialForm);
      setEditStore(null);
      setOpenForm(false);
      fetchStores(true);
    } catch (err) {
      toast.error('Failed to save store');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (s: Store) => {
    setEditStore(s);
    setForm({ name: s.name, address: s.address, note: s.note || '', isActive: s.isActive });
    setOpenForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/stores/${id}`);
      toast.success('Store deleted');
      fetchStores(true);
    } catch {
      toast.error('Failed to delete store');
    }
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleSelectAll = () => setSelected(selected.size === stores.length ? new Set() : new Set(stores.map((s) => s.id)));
  const handleBulkDelete = async () => {
    if (selected.size === 0) return toast.error('No store selected');
    try {
      await Promise.all([...selected].map((id) => axios.delete(`/api/stores/${id}`)));
      toast.success('Selected deleted');
      setSelected(new Set());
      fetchStores(true);
    } catch {
      toast.error('Failed to delete selected');
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="h-screen w-full p-6 text-white bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Stores</h1>
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gradient-to-r from-[#00b894] to-[#00cec9] text-black font-semibold hover:opacity-90">
              <Plus size={18} /> {editStore ? 'Edit' : 'Add'} Store
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121212] text-white border border-gray-700 rounded-xl shadow-xl">
            <DialogHeader>
              <DialogTitle>{editStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#121212] border-gray-700 text-white" />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-[#121212] border-gray-700 text-white" />
              </div>
              <div>
                <Label>Note</Label>
                <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="bg-[#121212] border-gray-700 text-white" />
              </div>
              <div className="flex gap-2 items-center">
                <Checkbox checked={form.isActive} onCheckedChange={(val) => setForm({ ...form, isActive: val as boolean })} />
                <span>Active</span>
              </div>
              <Button onClick={handleSaveStore} disabled={formLoading} className="w-full bg-gradient-to-r from-[#00cec9] to-[#a8eb12] text-black font-semibold">
                {formLoading ? <Loader2 className="animate-spin mr-2" /> : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Bulk */}
      <div className="flex justify-between items-center mb-4 gap-2">
        <Input placeholder="Search stores..." onChange={(e) => handleSearch(e.target.value)} className="w-full max-w-md bg-[#121212] border-gray-700 text-white" />
        <div className="flex gap-2">
          <Button onClick={toggleSelectAll}>Select All</Button>
          <Button onClick={handleBulkDelete} className="bg-red-800">Delete Selected</Button>
          <Button onClick={() => fetchStores(true)} className="bg-gray-600"><RefreshCw size={16} /></Button>
        </div>
      </div>

      {/* Infinite Scroll */}
      <InfiniteScroll dataLength={stores.length} next={() => fetchStores(false)} hasMore={hasMore} loader={<div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>}>
        <Card className="bg-[#121212] border border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="sticky top-0 bg-[#121212] z-10">
            <CardTitle>Store List</CardTitle>
          </CardHeader>
          <CardContent>
            {stores.length === 0 ? <p className="text-gray-400 text-center py-6">No stores found</p> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                  <thead className="bg-gradient-to-r from-[#00b894] to-[#00cec9] text-black sticky top-0">
                    <tr>
                      <th className="px-4 py-2"><Checkbox checked={selected.size === stores.length} onCheckedChange={toggleSelectAll} /></th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Address</th>
                      <th className="px-4 py-2">Note</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Brands</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((s) => (
                      <tr key={s.id} className={`border-b border-gray-700 transition ${selected.has(s.id) ? 'bg-[#00cec9]/20' : 'hover:bg-[#1a1a1a]'}`}>
                        <td className="px-4 py-3"><Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></td>
                        <td className="px-4 py-3">{s.name}</td>
                        <td className="px-4 py-3">{s.address}</td>
                        <td className="px-4 py-3">{s.note}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button className="text-white p-1 bg-gray-700"><Eye size={16} /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="bg-[#121212] text-white border border-gray-700">
                              {s.brands?.length ? s.brands.map((b, i) => <div key={i} className="py-1">{b}</div>) : <div className="py-1 text-gray-400">No brands</div>}
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-4 py-3 flex gap-1">
                          <Button onClick={() => handleEdit(s)} className="bg-blue-600 p-1"><Edit2 size={16} /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className="bg-red-600 p-1"><Trash2 size={16} /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#121212] text-white border border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Store?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <div className="flex justify-end gap-2 mt-4">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-red-700">Delete</AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </InfiniteScroll>
    </div>
  );
}

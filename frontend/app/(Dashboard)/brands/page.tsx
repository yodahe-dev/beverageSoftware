'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { useBrands } from "./hooks/useBrands";
import * as brandService from "./services/brandService";
import { Brand, SubBrand, BrandType } from "@/app/common/types/brand";
import { FormPopover } from "@/app/common/components/FormPopover";
import { ConfirmDialog } from "@/app/common/components/ConfirmDialog";

const BRAND_TYPES: BrandType[] = ['softdrink', 'alcohol', 'other'];

export default function BrandPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { brands, stores, fetchData } = useBrands(searchQuery);

  // --- Delete state ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'brand' | 'subbrand', id: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      if (deleteTarget.type === 'brand') await brandService.deleteBrand(deleteTarget.id);
      else await brandService.deleteSubBrand(deleteTarget.id);
      toast.success(`${deleteTarget.type} deleted`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for FormPopover ---
  const handleSaveBrand = async (values: Record<string, string | number | null>, editingBrand?: Brand | null) => {
    try {
      if (editingBrand) {
        await brandService.updateBrand(editingBrand.id, {
          name: values['Brand Name'] as string,
          type: values['Type'] as BrandType,
          note: values['Note'] as string,
          storeId: values['Store'] as string,
        });
        toast.success("Brand updated");
      } else {
        await brandService.createBrand({
          name: values['Brand Name'] as string,
          type: values['Type'] as BrandType,
          note: values['Note'] as string,
          storeId: values['Store'] as string,
        });
        toast.success("Brand created");
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save brand");
    }
  };

  const handleSaveSubBrand = async (values: Record<string, string | number | null>, editingSubBrand?: SubBrand | null) => {
    try {
      if (editingSubBrand) {
        await brandService.updateSubBrand(editingSubBrand.id, {
          name: values['SubBrand Name'] as string,
          note: values['Note'] as string,
          brandId: values['Brand'] as string,
        });
        toast.success("SubBrand updated");
      } else {
        await brandService.createSubBrand({
          name: values['SubBrand Name'] as string,
          note: values['Note'] as string,
          brandId: values['Brand'] as string,
        });
        toast.success("SubBrand created");
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save subbrand");
    }
  };

  return (
    <div className="h-screen w-full p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00b894] via-[#00cec9] to-[#a8eb12]">
          Brands & SubBrands
        </h1>
        <div className="flex gap-2 flex-wrap">
          {/* Add Brand */}
          <FormPopover
            trigger={<Button className="bg-gradient-to-r from-[#00b894] to-[#00cec9] text-black flex items-center gap-2"><Plus /> Add Brand</Button>}
            fields={[
              { label: 'Store', type: 'select', value: '', options: stores.map(s => ({ label: s.name, value: s.id })), required: true },
              { label: 'Brand Name', type: 'text', value: '', required: true },
              { label: 'Type', type: 'select', value: 'softdrink', options: BRAND_TYPES.map(t => ({ label: t, value: t })), required: true },
              { label: 'Note', type: 'text', value: '' },
            ]}
            title="Add New Brand"
            confirmText="Save Brand"
            onSave={handleSaveBrand}
          />

          {/* Add SubBrand */}
          <FormPopover
            trigger={<Button className="bg-gradient-to-r from-[#ff7f50] to-[#ff6f91] text-black flex items-center gap-2"><Plus /> Add SubBrand</Button>}
            fields={[
              { label: 'Brand', type: 'select', value: '', options: brands.map(b => ({ label: b.name, value: b.id })), required: true },
              { label: 'SubBrand Name', type: 'text', value: '', required: true },
              { label: 'Note', type: 'text', value: '' },
            ]}
            title="Add New SubBrand"
            confirmText="Save SubBrand"
            onSave={handleSaveSubBrand}
          />
        </div>
      </div>

      {/* Search */}
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search brands or subbrands..."
        className="w-full mb-6 bg-[#121212] border border-gray-700 text-white p-2 rounded"
      />

      {/* Brand List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map(b => (
          <Card key={b.id} className="bg-gray-900 border border-gray-700 shadow-lg hover:shadow-2xl transition-transform hover:scale-105">
            <CardHeader className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00b894] via-[#00cec9] to-[#a8eb12]">{b.name}</h2>
                <p className="text-xs text-gray-400">{b.store?.name || ''}</p>
              </div>
              <div className="flex gap-2">
                {/* Edit Brand */}
                <FormPopover
                  trigger={<div className="cursor-pointer"><Edit className="w-5 h-5 text-gray-300 hover:text-white" /></div>}
                  fields={[
                    { label: 'Store', type: 'select', value: b.store?.id || '', options: stores.map(s => ({ label: s.name, value: s.id })), required: true },
                    { label: 'Brand Name', type: 'text', value: b.name, required: true },
                    { label: 'Type', type: 'select', value: b.type, options: BRAND_TYPES.map(t => ({ label: t, value: t })), required: true },
                    { label: 'Note', type: 'text', value: b.note || '' },
                  ]}
                  title="Edit Brand"
                  confirmText="Update Brand"
                  onSave={(values) => handleSaveBrand(values, b)}
                />
                <Trash2
                  className="w-5 h-5 text-red-500 hover:text-red-700 cursor-pointer"
                  onClick={() => { setDeleteTarget({ type: 'brand', id: b.id }); setDeleteDialogOpen(true); }}
                />
              </div>
            </CardHeader>

            <CardContent>
              {b.note && <p className="text-gray-400 italic mb-2">{b.note}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {b.subbrands?.map(s => (
                  <span key={s.id} className="px-3 py-1 bg-gradient-to-r from-[#ff7f50] to-[#ff6f91] rounded-full text-black flex items-center gap-1 shadow-md hover:scale-105 transition-transform">
                    {s.name}
                    {/* Edit SubBrand */}
                    <FormPopover
                      trigger={<div className="cursor-pointer"><Edit className="w-4 h-4 text-gray-800" /></div>}
                      fields={[
                        { label: 'Brand', type: 'select', value: b.id, options: brands.map(b => ({ label: b.name, value: b.id })), required: true },
                        { label: 'SubBrand Name', type: 'text', value: s.name, required: true },
                        { label: 'Note', type: 'text', value: s.note || '' },
                      ]}
                      title="Edit SubBrand"
                      confirmText="Update SubBrand"
                      onSave={(values) => handleSaveSubBrand(values, s)}
                    />
                    <Trash2
                      className="w-4 h-4 text-red-700 cursor-pointer"
                      onClick={() => { setDeleteTarget({ type: 'subbrand', id: s.id }); setDeleteDialogOpen(true); }}
                    />
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirm Delete"
        description={`Are you sure you want to delete this ${deleteTarget?.type}?`}
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={loading}
        onConfirm={handleDelete}
      />
    </div>
  );
}

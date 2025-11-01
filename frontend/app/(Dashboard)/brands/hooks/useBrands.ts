import { useState, useEffect } from "react";
import { Brand, SubBrand, Store } from "@/app/common/types/brand";
import * as brandService from "../services/brandService";
import toast from "react-hot-toast";

export const useBrands = (searchQuery: string) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subbrands, setSubbrands] = useState<SubBrand[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [brandsData, subbrandsData, storesData] = await Promise.all([
        brandService.fetchBrands(searchQuery),
        brandService.fetchSubBrands(searchQuery),
        brandService.fetchStores()
      ]);

      const validSubbrands = subbrandsData.filter(s => (s.brand && s.brand.id) || (s as any).brandId);

      const brandsWithSubs = brandsData.map(b => ({
        ...b,
        subbrands: validSubbrands.filter(s => s.brand?.id === b.id || (s as any).brandId === b.id)
      }));

      setBrands(brandsWithSubs);
      setSubbrands(validSubbrands);
      setStores(storesData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  return { brands, subbrands, stores, loading, fetchData };
};

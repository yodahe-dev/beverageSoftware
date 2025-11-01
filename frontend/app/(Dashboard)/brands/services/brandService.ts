import axios from "axios";
import { Brand, SubBrand, Store } from "@/app/common/types/brand";

export const fetchBrands = async (search: string = ''): Promise<Brand[]> => {
  const res = await axios.get(`/api/brands?search=${encodeURIComponent(search)}`);
  return Array.isArray(res.data.brands)
    ? res.data.brands
    : Array.isArray(res.data)
    ? res.data
    : [];
};

export const fetchSubBrands = async (search: string = ''): Promise<SubBrand[]> => {
  const res = await axios.get(`/api/brands/subbrands?search=${encodeURIComponent(search)}`);
  return Array.isArray(res.data.data)
    ? res.data.data
    : Array.isArray(res.data)
    ? res.data
    : [];
};

export const fetchStores = async (): Promise<Store[]> => {
  const res = await axios.get('/api/stores');
  return Array.isArray(res.data) ? res.data : [];
};

export const createBrand = async (data: { name: string; type: string; note?: string; storeId: string }) => {
  return axios.post('/api/brands', data);
};

export const updateBrand = async (id: string, data: { name: string; type: string; note?: string; storeId: string }) => {
  return axios.patch(`/api/brands/${id}`, data);
};

export const deleteBrand = async (id: string) => {
  return axios.delete(`/api/brands/${id}`);
};

export const createSubBrand = async (data: { name: string; note?: string; brandId: string }) => {
  return axios.post('/api/brands/subbrands', data);
};

export const updateSubBrand = async (id: string, data: { name: string; note?: string; brandId: string }) => {
  return axios.patch(`/api/brands/subbrands/${id}`, data);
};

export const deleteSubBrand = async (id: string) => {
  return axios.delete(`/api/brands/subbrands/${id}`);
};

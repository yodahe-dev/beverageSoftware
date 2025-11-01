export interface Store {
  id: string;
  name: string;
  address?: string;
}

export interface SubBrand {
  id: string;
  name: string;
  note?: string;
  brand?: { id: string; name: string };
}

export interface Brand {
  id: string;
  name: string;
  type: string;
  note?: string;
  subbrands?: SubBrand[];
  store?: Store;
}

export type BrandType = 'softdrink' | 'alcohol' | 'other';

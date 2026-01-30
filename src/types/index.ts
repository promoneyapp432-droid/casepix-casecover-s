export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
}

export interface MobileBrand {
  id: string;
  name: string;
  logo?: string;
}

export interface MobileModel {
  id: string;
  brandId: string;
  name: string;
}

export type CaseType = 'metal' | 'snap';

export interface ProductVariant {
  id: string;
  productId: string;
  caseType: CaseType;
  title: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  categoryId: string;
  images?: string[];
  isNew?: boolean;
  isTopDesign?: boolean;
  createdAt: string;
  variants?: ProductVariant[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  brandId: string;
  modelId: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

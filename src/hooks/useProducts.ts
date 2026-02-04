import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DBProduct {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  image: string | null;
  category_id: string | null;
  is_new: boolean | null;
  is_top_design: boolean | null;
  created_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  product_variants: {
    id: string;
    case_type: 'metal' | 'snap';
    price: number;
    image: string | null;
    title: string;
    description: string | null;
  }[];
}

// Transform DB product to match the frontend Product type
export interface TransformedProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  categoryId: string;
  isNew: boolean;
  isTopDesign: boolean;
  createdAt: string;
  categorySlug?: string;
}

const transformProduct = (product: DBProduct): TransformedProduct => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  basePrice: product.base_price,
  image: product.image || '/placeholder.svg',
  categoryId: product.category_id || '',
  isNew: product.is_new || false,
  isTopDesign: product.is_top_design || false,
  createdAt: product.created_at,
  categorySlug: product.category?.slug,
});

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          image,
          category_id,
          is_new,
          is_top_design,
          created_at,
          category:categories(id, name, slug, icon),
          product_variants(id, case_type, price, image, title, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as DBProduct[]).map(transformProduct);
    },
  });
};

export const useTopDesigns = () => {
  return useQuery({
    queryKey: ['products', 'top-designs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          image,
          category_id,
          is_new,
          is_top_design,
          created_at,
          category:categories(id, name, slug, icon),
          product_variants(id, case_type, price, image, title, description)
        `)
        .eq('is_top_design', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data as DBProduct[]).map(transformProduct);
    },
  });
};

export const useNewArrivals = () => {
  return useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          image,
          category_id,
          is_new,
          is_top_design,
          created_at,
          category:categories(id, name, slug, icon),
          product_variants(id, case_type, price, image, title, description)
        `)
        .eq('is_new', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data as DBProduct[]).map(transformProduct);
    },
  });
};

export const useProductsByCategory = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          image,
          category_id,
          is_new,
          is_top_design,
          created_at,
          category:categories(id, name, slug, icon),
          product_variants(id, case_type, price, image, title, description)
        `)
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return (data as DBProduct[]).map(transformProduct);
    },
    enabled: !!categoryId,
  });
};

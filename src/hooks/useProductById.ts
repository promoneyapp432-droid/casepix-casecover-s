import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  image: string | null;
  image_2: string | null;
  image_3: string | null;
  image_4: string | null;
  image_5: string | null;
  image_6: string | null;
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
    stock: number | null;
  }[];
}

export const useProductById = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          image,
          image_2,
          image_3,
          image_4,
          image_5,
          image_6,
          category_id,
          is_new,
          is_top_design,
          created_at,
          category:categories(id, name, slug, icon),
          product_variants(id, case_type, price, image, title, description, stock)
        `)
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      return data as ProductDetail | null;
    },
    enabled: !!productId,
  });
};

export const useRelatedProducts = (categoryId: string | undefined, excludeId: string | undefined) => {
  return useQuery({
    queryKey: ['products', 'related', categoryId, excludeId],
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
          is_new,
          is_top_design,
          created_at
        `)
        .eq('category_id', categoryId)
        .neq('id', excludeId || '')
        .limit(4);

      if (error) throw error;
      return data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        basePrice: p.base_price,
        image: p.image || '/placeholder.svg',
        isNew: p.is_new || false,
        isTopDesign: p.is_top_design || false,
        createdAt: p.created_at,
      }));
    },
    enabled: !!categoryId,
  });
};

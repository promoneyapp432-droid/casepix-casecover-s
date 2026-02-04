import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DBCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  created_at: string;
}

export interface TransformedCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
}

const transformCategory = (category: DBCategory): TransformedCategory => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  icon: category.icon || '📦',
  image: category.image || undefined,
});

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as DBCategory[]).map(transformCategory);
    },
  });
};

export const useCategoryBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['categories', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data ? transformCategory(data as DBCategory) : null;
    },
    enabled: !!slug,
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database, Json } from '@/integrations/supabase/types';
import { ContentBlock } from '@/types/aplus';

type CaseType = Database['public']['Enums']['case_type'];

export interface APlusContent {
  id: string;
  case_type: CaseType;
  title: string | null;
  description: string | null;
  features: string[];
  price: number;
  compare_price: number | null;
  default_image_2: string | null;
  default_image_3: string | null;
  default_image_4: string | null;
  default_image_5: string | null;
  default_image_6: string | null;
  content_blocks: ContentBlock[];
  created_at: string;
  updated_at: string;
}

// Helper to safely parse content blocks from JSON
const parseContentBlocks = (json: Json | null): ContentBlock[] => {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as ContentBlock[];
};

// Helper to safely parse features from JSON
const parseFeatures = (json: Json | null): string[] => {
  if (!json || !Array.isArray(json)) return [];
  return json as unknown as string[];
};

export const useAPlusContent = () => {
  return useQuery({
    queryKey: ['a-plus-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('a_plus_content')
        .select('*')
        .order('case_type');
      
      if (error) throw error;
      
      // Parse content_blocks and features from JSON
      return (data || []).map(item => ({
        ...item,
        features: parseFeatures(item.features),
        content_blocks: parseContentBlocks(item.content_blocks),
        price: item.price ?? 499,
        compare_price: item.compare_price ?? null,
      })) as APlusContent[];
    },
  });
};

export const useAPlusContentByCaseType = (caseType: CaseType) => {
  return useQuery({
    queryKey: ['a-plus-content', caseType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('a_plus_content')
        .select('*')
        .eq('case_type', caseType)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        ...data,
        features: parseFeatures(data.features),
        content_blocks: parseContentBlocks(data.content_blocks),
        price: data.price ?? 499,
        compare_price: data.compare_price ?? null,
      } as APlusContent;
    },
  });
};

export const useUpdateAPlusContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      caseType, 
      data 
    }: { 
      caseType: CaseType; 
      data: Partial<Omit<APlusContent, 'id' | 'case_type' | 'created_at' | 'updated_at'>> 
    }) => {
      // Convert content_blocks to JSON-compatible format
      const updateData = {
        ...data,
        content_blocks: data.content_blocks as unknown as Json,
        features: data.features as unknown as Json,
      };
      
      const { error } = await supabase
        .from('a_plus_content')
        .update(updateData)
        .eq('case_type', caseType);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['a-plus-content'] });
      toast.success('A+ Content updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
};

export const useUpsertAPlusContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<APlusContent, 'id' | 'created_at' | 'updated_at'>) => {
      // Convert to JSON-compatible format for Supabase
      const upsertData = {
        case_type: data.case_type,
        title: data.title,
        description: data.description,
        features: data.features as unknown as Json,
        price: data.price,
        compare_price: data.compare_price,
        default_image_2: data.default_image_2,
        default_image_3: data.default_image_3,
        default_image_4: data.default_image_4,
        default_image_5: data.default_image_5,
        default_image_6: data.default_image_6,
        content_blocks: data.content_blocks as unknown as Json,
      };
      
      const { error } = await supabase
        .from('a_plus_content')
        .upsert(upsertData, { onConflict: 'case_type' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['a-plus-content'] });
      toast.success('A+ Content saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });
};

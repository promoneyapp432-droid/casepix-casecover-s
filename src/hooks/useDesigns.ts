import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Design {
  id: string;
  name: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
  design_images?: DesignImage[];
}

export interface DesignImage {
  id: string;
  design_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface CaseTemplate {
  id: string;
  name: string;
  case_type: 'metal' | 'snap';
  template_image: string;
  mask_x: number;
  mask_y: number;
  mask_width: number;
  mask_height: number;
  created_at: string;
}

export const useDesigns = () => {
  return useQuery({
    queryKey: ['designs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designs')
        .select('*, category:categories(id, name), design_images(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Design[];
    },
  });
};

export const useDesignsByCategory = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['designs', 'category', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designs')
        .select('*, design_images(*)')
        .eq('category_id', categoryId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Design[];
    },
    enabled: !!categoryId,
  });
};

export const useAddDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; category_id: string | null }) => {
      const { data: design, error } = await supabase
        .from('designs')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return design;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
};

export const useUpdateDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; category_id: string | null } }) => {
      const { error } = await supabase.from('designs').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
};

export const useDeleteDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('designs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
};

export const useAddDesignImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { design_id: string; image_url: string; sort_order: number }) => {
      const { error } = await supabase.from('design_images').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
};

export const useDeleteDesignImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('design_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designs'] });
    },
  });
};

export const useCaseTemplates = () => {
  return useQuery({
    queryKey: ['case-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('case_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CaseTemplate[];
    },
  });
};

export const useAddCaseTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CaseTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('case_templates').insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-templates'] });
    },
  });
};

export const useUpdateCaseTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CaseTemplate> }) => {
      const { error } = await supabase.from('case_templates').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-templates'] });
    },
  });
};

export const useDeleteCaseTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('case_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-templates'] });
    },
  });
};

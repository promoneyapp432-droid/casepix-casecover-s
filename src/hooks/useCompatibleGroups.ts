import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type CaseType = Database['public']['Enums']['case_type'];

export interface CompatibleGroup {
  id: string;
  model_id: string;
  case_type: CaseType;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompatibleGroupWithModel extends CompatibleGroup {
  model: {
    id: string;
    name: string;
    brand: {
      id: string;
      name: string;
    };
  };
}

export const useCompatibleGroups = (caseType?: CaseType) => {
  return useQuery({
    queryKey: ['compatible-groups', caseType],
    queryFn: async () => {
      let query = supabase
        .from('compatible_groups')
        .select(`
          *,
          model:mobile_models(
            id,
            name,
            brand:mobile_brands(id, name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (caseType) {
        query = query.eq('case_type', caseType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CompatibleGroupWithModel[];
    },
  });
};

export const useVisibleModelsForCaseType = (caseType: CaseType) => {
  return useQuery({
    queryKey: ['visible-models', caseType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compatible_groups')
        .select(`
          model_id,
          model:mobile_models(
            id,
            name,
            brand_id,
            brand:mobile_brands(id, name)
          )
        `)
        .eq('case_type', caseType)
        .eq('is_visible', true);
      
      if (error) throw error;
      return data;
    },
  });
};

export const useAddToCompatibleGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { model_id: string; case_type: CaseType; is_visible?: boolean }) => {
      const { data: result, error } = await supabase
        .from('compatible_groups')
        .insert({
          model_id: data.model_id,
          case_type: data.case_type,
          is_visible: data.is_visible ?? true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compatible-groups'] });
      queryClient.invalidateQueries({ queryKey: ['visible-models'] });
      toast.success('Model added to compatible group');
    },
    onError: (error) => {
      toast.error('Failed to add model: ' + error.message);
    },
  });
};

export const useUpdateCompatibleGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase
        .from('compatible_groups')
        .update({ is_visible })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compatible-groups'] });
      queryClient.invalidateQueries({ queryKey: ['visible-models'] });
      toast.success('Visibility updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });
};

export const useRemoveFromCompatibleGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compatible_groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compatible-groups'] });
      queryClient.invalidateQueries({ queryKey: ['visible-models'] });
      toast.success('Model removed from compatible group');
    },
    onError: (error) => {
      toast.error('Failed to remove: ' + error.message);
    },
  });
};

export const useBulkAddToCompatibleGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: { model_id: string; case_type: CaseType }[]) => {
      const { error } = await supabase
        .from('compatible_groups')
        .upsert(
          items.map(item => ({
            model_id: item.model_id,
            case_type: item.case_type,
            is_visible: true,
          })),
          { onConflict: 'model_id,case_type' }
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compatible-groups'] });
      queryClient.invalidateQueries({ queryKey: ['visible-models'] });
      toast.success('Models added to compatible group');
    },
    onError: (error) => {
      toast.error('Failed to add models: ' + error.message);
    },
  });
};

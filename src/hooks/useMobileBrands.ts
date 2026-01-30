import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MobileBrand {
  id: string;
  name: string;
  logo: string | null;
  created_at: string;
}

export interface MobileModel {
  id: string;
  brand_id: string;
  name: string;
  image: string | null;
  created_at: string;
}

export interface MobileModelWithBrand extends MobileModel {
  brand: { id: string; name: string };
}

export interface MobileModelWithDetails extends MobileModel {
  brand: { id: string; name: string };
  metal_available: boolean;
  snap_available: boolean;
}

export const useMobileBrands = () => {
  return useQuery({
    queryKey: ['mobile-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobile_brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as MobileBrand[];
    },
  });
};

export const useMobileModels = (brandId?: string) => {
  return useQuery({
    queryKey: ['mobile-models', brandId],
    queryFn: async () => {
      let query = supabase
        .from('mobile_models')
        .select('*')
        .order('name');
      
      if (brandId) {
        query = query.eq('brand_id', brandId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MobileModel[];
    },
  });
};

export const useAllMobileModels = () => {
  return useQuery({
    queryKey: ['mobile-models-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mobile_models')
        .select(`
          *,
          brand:mobile_brands(id, name)
        `)
        .order('name');
      
      if (error) throw error;
      return data as MobileModelWithBrand[];
    },
  });
};

export const useMobileModelsWithCaseAvailability = (brandId?: string) => {
  return useQuery({
    queryKey: ['mobile-models-with-availability', brandId],
    queryFn: async () => {
      // First get all models with brands
      let modelsQuery = supabase
        .from('mobile_models')
        .select(`
          *,
          brand:mobile_brands(id, name)
        `)
        .order('name');
      
      if (brandId) {
        modelsQuery = modelsQuery.eq('brand_id', brandId);
      }
      
      const { data: models, error: modelsError } = await modelsQuery;
      if (modelsError) throw modelsError;

      // Then get all compatible groups
      const { data: compatibleGroups, error: groupsError } = await supabase
        .from('compatible_groups')
        .select('model_id, case_type, is_visible');
      
      if (groupsError) throw groupsError;

      // Map models with case availability
      const modelsWithAvailability: MobileModelWithDetails[] = (models || []).map((model: any) => {
        const metalGroup = compatibleGroups?.find(
          g => g.model_id === model.id && g.case_type === 'metal' && g.is_visible
        );
        const snapGroup = compatibleGroups?.find(
          g => g.model_id === model.id && g.case_type === 'snap' && g.is_visible
        );

        return {
          ...model,
          metal_available: !!metalGroup,
          snap_available: !!snapGroup,
        };
      });

      return modelsWithAvailability;
    },
  });
};

export const useAddBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; logo?: string }) => {
      const { data: result, error } = await supabase
        .from('mobile_brands')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-brands'] });
      toast.success('Brand added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add brand: ' + error.message);
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MobileBrand> }) => {
      const { error } = await supabase
        .from('mobile_brands')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-brands'] });
      toast.success('Brand updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update brand: ' + error.message);
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mobile_brands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-brands'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models'] });
      toast.success('Brand deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete brand: ' + error.message);
    },
  });
};

export const useAddModel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; brand_id: string; image?: string }) => {
      const { data: result, error } = await supabase
        .from('mobile_models')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-models'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models-all'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models-with-availability'] });
      toast.success('Model added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add model: ' + error.message);
    },
  });
};

export const useUpdateModel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MobileModel> }) => {
      const { error } = await supabase
        .from('mobile_models')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-models'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models-all'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models-with-availability'] });
      toast.success('Model updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update model: ' + error.message);
    },
  });
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mobile_models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-models'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models-all'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models-with-availability'] });
      queryClient.invalidateQueries({ queryKey: ['compatible-groups'] });
      toast.success('Model deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete model: ' + error.message);
    },
  });
};

export const useBulkAddModels = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (models: { name: string; brand_id: string; image?: string }[]) => {
      const { data: result, error } = await supabase
        .from('mobile_models')
        .insert(models)
        .select();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-models'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models-all'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-models-with-availability'] });
      toast.success(`${data?.length || 0} models imported successfully`);
    },
    onError: (error) => {
      toast.error('Failed to import models: ' + error.message);
    },
  });
};

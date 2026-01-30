import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMobileBrands, useMobileModels } from '@/hooks/useMobileBrands';
import { useCompatibleGroups } from '@/hooks/useCompatibleGroups';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type CaseType = Database['public']['Enums']['case_type'];

interface BrandModelSelectorProps {
  onSelect: (brandId: string, modelId: string) => void;
  selectedBrandId?: string;
  selectedModelId?: string;
  caseType?: CaseType;
}

const BrandModelSelector = ({ 
  onSelect, 
  selectedBrandId, 
  selectedModelId,
  caseType = 'snap',
}: BrandModelSelectorProps) => {
  const { data: brands, isLoading: brandsLoading } = useMobileBrands();
  const { data: allModels, isLoading: modelsLoading } = useMobileModels();
  const { data: compatibleGroups, isLoading: groupsLoading } = useCompatibleGroups(caseType);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [brandId, setBrandId] = useState(selectedBrandId || '');
  const [modelId, setModelId] = useState(selectedModelId || '');

  // Create a map of visible models for quick lookup
  const visibleModelsMap = useMemo(() => {
    if (!compatibleGroups) return new Map<string, boolean>();
    const map = new Map<string, boolean>();
    compatibleGroups.forEach(group => {
      map.set(group.model_id, group.is_visible);
    });
    return map;
  }, [compatibleGroups]);

  // Filter models by brand and search
  const filteredModels = useMemo(() => {
    if (!brandId || !allModels) return [];
    return allModels
      .filter(m => m.brand_id === brandId)
      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(model => ({
        ...model,
        // Check if model is in compatible group and visible
        // If not in compatible group at all, consider it available
        isAvailable: !visibleModelsMap.has(model.id) || visibleModelsMap.get(model.id) === true,
      }));
  }, [brandId, allModels, searchQuery, visibleModelsMap]);

  const handleBrandChange = (value: string) => {
    setBrandId(value);
    setModelId('');
    setSearchQuery('');
  };

  const handleModelChange = (value: string) => {
    const model = filteredModels.find(m => m.id === value);
    if (model && !model.isAvailable) {
      return; // Don't allow selecting unavailable models
    }
    setModelId(value);
    onSelect(brandId, value);
  };

  const isLoading = brandsLoading || modelsLoading || groupsLoading;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const selectedBrand = brands?.find(b => b.id === brandId);
  const selectedModel = allModels?.find(m => m.id === modelId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 shadow-card border border-border"
    >
      <h3 className="text-lg font-semibold mb-4">Select Your Phone</h3>
      
      <div className="space-y-4">
        {/* Brand Selector */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Mobile Brand
          </label>
          <Select value={brandId} onValueChange={handleBrandChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {brands?.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Search & Selector */}
        {brandId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Mobile Model
            </label>
            
            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Model Select */}
            <Select value={modelId} onValueChange={handleModelChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {filteredModels.length > 0 ? (
                  filteredModels.map((model) => (
                    <SelectItem 
                      key={model.id} 
                      value={model.id}
                      disabled={!model.isAvailable}
                      className={cn(
                        !model.isAvailable && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                        {!model.isAvailable && (
                          <span className="text-xs text-muted-foreground">(Not available for {caseType} case)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No models found
                  </div>
                )}
              </SelectContent>
            </Select>

            {/* Warning for unavailable case type */}
            {modelId && filteredModels.find(m => m.id === modelId && !m.isAvailable) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">
                  This model is not available for {caseType} case type. Please select a different model or case type.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Selected Summary */}
        {brandId && modelId && selectedModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20"
          >
            <p className="text-sm text-primary font-medium">
              Selected: {selectedBrand?.name} - {selectedModel.name}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BrandModelSelector;

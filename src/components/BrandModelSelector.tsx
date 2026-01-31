import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, ChevronDown } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        isAvailable: !visibleModelsMap.has(model.id) || visibleModelsMap.get(model.id) === true,
      }));
  }, [brandId, allModels, searchQuery, visibleModelsMap]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isModelDropdownOpen) return;
    
    const availableModels = filteredModels.filter(m => m.isAvailable);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < availableModels.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < availableModels.length) {
          handleModelSelect(availableModels[highlightedIndex].id);
        }
        break;
      case 'Escape':
        setIsModelDropdownOpen(false);
        break;
    }
  };

  const handleBrandChange = (value: string) => {
    setBrandId(value);
    setModelId('');
    setSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleModelSelect = (id: string) => {
    const model = filteredModels.find(m => m.id === id);
    if (model && !model.isAvailable) return;
    
    setModelId(id);
    setIsModelDropdownOpen(false);
    setSearchQuery('');
    onSelect(brandId, id);
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

        {/* Model Search with Dropdown Suggestions */}
        {brandId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            ref={dropdownRef}
          >
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Mobile Model
            </label>
            
            {/* Search Input with Dropdown */}
            <div className="relative">
              <div 
                className={cn(
                  "flex items-center border rounded-lg bg-background transition-colors",
                  isModelDropdownOpen && "border-primary ring-1 ring-primary"
                )}
              >
                <Search className="ml-3 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={selectedModel ? selectedModel.name : "Search model..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsModelDropdownOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => setIsModelDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <ChevronDown 
                  className={cn(
                    "mr-3 w-4 h-4 text-muted-foreground transition-transform",
                    isModelDropdownOpen && "rotate-180"
                  )}
                />
              </div>

              {/* Dropdown Suggestions */}
              <AnimatePresence>
                {isModelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden"
                  >
                    <ScrollArea className="max-h-64">
                      {filteredModels.length > 0 ? (
                        <div className="p-1">
                          {filteredModels.map((model, index) => (
                            <motion.div
                              key={model.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.02 }}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
                                !model.isAvailable && "opacity-50 cursor-not-allowed",
                                highlightedIndex === index && model.isAvailable && "bg-accent",
                                model.isAvailable && "hover:bg-accent"
                              )}
                              onClick={() => model.isAvailable && handleModelSelect(model.id)}
                              onMouseEnter={() => model.isAvailable && setHighlightedIndex(index)}
                            >
                              {model.image ? (
                                <img 
                                  src={model.image} 
                                  alt={model.name}
                                  className="w-10 h-10 object-contain rounded border bg-background"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center text-muted-foreground text-lg">
                                  📱
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "font-medium truncate",
                                  !model.isAvailable && "text-muted-foreground"
                                )}>
                                  {model.name}
                                </p>
                                {!model.isAvailable && (
                                  <p className="text-xs text-muted-foreground">
                                    Not available for {caseType} case
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No models found
                        </div>
                      )}
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
            <div className="flex items-center gap-3">
              {selectedModel.image ? (
                <img 
                  src={selectedModel.image} 
                  alt={selectedModel.name}
                  className="w-12 h-12 object-contain rounded border bg-background"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-muted-foreground text-xl">
                  📱
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="font-medium text-primary">
                  {selectedBrand?.name} - {selectedModel.name}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BrandModelSelector;

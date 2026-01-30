import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, EyeOff, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useCompatibleGroups,
  useAddToCompatibleGroup,
  useUpdateCompatibleGroup,
  useRemoveFromCompatibleGroup,
  useBulkAddToCompatibleGroup,
} from '@/hooks/useCompatibleGroups';
import { useAllMobileModels } from '@/hooks/useMobileBrands';
import { Database } from '@/integrations/supabase/types';
import { Skeleton } from '@/components/ui/skeleton';

type CaseType = Database['public']['Enums']['case_type'];

const CompatibleGroupManager = () => {
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType>('metal');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const { data: compatibleGroups, isLoading: groupsLoading } = useCompatibleGroups(selectedCaseType);
  const { data: allModels, isLoading: modelsLoading } = useAllMobileModels();
  
  const updateGroup = useUpdateCompatibleGroup();
  const removeFromGroup = useRemoveFromCompatibleGroup();
  const bulkAdd = useBulkAddToCompatibleGroup();

  // Filter out already added models
  const availableModels = useMemo(() => {
    if (!allModels || !compatibleGroups) return [];
    const addedModelIds = compatibleGroups.map(g => g.model_id);
    return allModels.filter(m => !addedModelIds.includes(m.id));
  }, [allModels, compatibleGroups]);

  // Search filter
  const filteredAvailableModels = useMemo(() => {
    if (!searchQuery) return availableModels;
    const query = searchQuery.toLowerCase();
    return availableModels.filter(
      m => m.name.toLowerCase().includes(query) || m.brand.name.toLowerCase().includes(query)
    );
  }, [availableModels, searchQuery]);

  // Group by brand
  const modelsByBrand = useMemo(() => {
    const grouped: Record<string, typeof filteredAvailableModels> = {};
    filteredAvailableModels.forEach(model => {
      const brandName = model.brand.name;
      if (!grouped[brandName]) grouped[brandName] = [];
      grouped[brandName].push(model);
    });
    return grouped;
  }, [filteredAvailableModels]);

  const handleAddModels = async () => {
    if (selectedModels.length === 0) return;
    
    await bulkAdd.mutateAsync(
      selectedModels.map(model_id => ({ model_id, case_type: selectedCaseType }))
    );
    
    setSelectedModels([]);
    setIsAddDialogOpen(false);
  };

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const selectAllFromBrand = (brandModels: typeof filteredAvailableModels) => {
    const modelIds = brandModels.map(m => m.id);
    const allSelected = modelIds.every(id => selectedModels.includes(id));
    
    if (allSelected) {
      setSelectedModels(prev => prev.filter(id => !modelIds.includes(id)));
    } else {
      setSelectedModels(prev => [...new Set([...prev, ...modelIds])]);
    }
  };

  if (groupsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedCaseType} onValueChange={(v) => setSelectedCaseType(v as CaseType)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="metal" className="gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600" />
              Metal Case
            </TabsTrigger>
            <TabsTrigger value="snap" className="gap-2">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              Snap Case
            </TabsTrigger>
          </TabsList>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Models
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>
                  Add Models to {selectedCaseType === 'metal' ? 'Metal' : 'Snap'} Case Group
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search models or brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  {Object.keys(modelsByBrand).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {availableModels.length === 0 
                        ? 'All models have been added to this group'
                        : 'No models found matching your search'
                      }
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(modelsByBrand).map(([brandName, brandModels]) => (
                        <div key={brandName} className="space-y-2">
                          <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                            <Checkbox
                              checked={brandModels.every(m => selectedModels.includes(m.id))}
                              onCheckedChange={() => selectAllFromBrand(brandModels)}
                            />
                            <span className="font-semibold">{brandName}</span>
                            <Badge variant="secondary">{brandModels.length}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pl-6">
                            {brandModels.map(model => (
                              <motion.div
                                key={model.id}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                  flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors
                                  ${selectedModels.includes(model.id) 
                                    ? 'border-primary bg-primary/10' 
                                    : 'border-border hover:bg-secondary/50'
                                  }
                                `}
                                onClick={() => toggleModelSelection(model.id)}
                              >
                                <Checkbox checked={selectedModels.includes(model.id)} />
                                <span className="text-sm">{model.name}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {selectedModels.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      {selectedModels.length} model(s) selected
                    </span>
                    <Button 
                      onClick={handleAddModels} 
                      disabled={bulkAdd.isPending}
                      className="gradient-primary"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Add Selected
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value={selectedCaseType} className="mt-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-center">Visible</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compatibleGroups?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No models added to this compatible group yet
                    </TableCell>
                  </TableRow>
                ) : (
                  compatibleGroups?.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">
                        {group.model?.brand?.name}
                      </TableCell>
                      <TableCell>{group.model?.name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={group.is_visible}
                            onCheckedChange={(checked) => 
                              updateGroup.mutate({ id: group.id, is_visible: checked })
                            }
                          />
                          {group.is_visible ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeFromGroup.mutate(group.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompatibleGroupManager;

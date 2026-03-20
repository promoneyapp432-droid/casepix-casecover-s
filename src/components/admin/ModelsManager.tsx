import { useState, useMemo } from 'react';
import { Plus, FileSpreadsheet, Loader2, Smartphone, ChevronDown, ChevronRight, Pencil, Trash2, Eye, EyeOff, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  useMobileBrands, useMobileModels, useAddBrand, useAddModel, useUpdateModel, useDeleteModel, useAllMobileModels, MobileModel,
} from '@/hooks/useMobileBrands';
import {
  useCaseTemplates, useAddCaseTemplate, useUpdateCaseTemplate, useDeleteCaseTemplate, CaseTemplate,
} from '@/hooks/useDesigns';
import {
  useCompatibleGroups, useUpdateCompatibleGroup, useRemoveFromCompatibleGroup, useBulkAddToCompatibleGroup,
} from '@/hooks/useCompatibleGroups';
import { Database } from '@/integrations/supabase/types';
import ImageUploader from '@/components/admin/ImageUploader';
import ExcelImportDialog from '@/components/admin/ExcelImportDialog';
import { useAutoProductCreation } from '@/hooks/useAutoProductCreation';
import { useQueryClient } from '@tanstack/react-query';

type CaseType = Database['public']['Enums']['case_type'];

const ModelsManager = () => {
  const { data: brands, isLoading: brandsLoading } = useMobileBrands();
  const { data: allModels, isLoading: modelsLoading } = useMobileModels();
  const { data: allModelsWithBrand } = useAllMobileModels();
  const { data: templates, isLoading: templatesLoading } = useCaseTemplates();
  const { data: metalGroups } = useCompatibleGroups('metal');
  const { data: snapGroups } = useCompatibleGroups('snap');

  const addBrandMutation = useAddBrand();
  const addModelMutation = useAddModel();
  const updateModelMutation = useUpdateModel();
  const deleteModelMutation = useDeleteModel();
  const addTemplate = useAddCaseTemplate();
  const updateTemplate = useUpdateCaseTemplate();
  const deleteTemplate = useDeleteCaseTemplate();
  const updateGroup = useUpdateCompatibleGroup();
  const removeFromGroup = useRemoveFromCompatibleGroup();
  const bulkAddCompatible = useBulkAddToCompatibleGroup();
  const { createProductsForTemplate } = useAutoProductCreation();
  const queryClient = useQueryClient();

  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCompatibleDialogOpen, setIsCompatibleDialogOpen] = useState(false);
  const [compatibleModelId, setCompatibleModelId] = useState<string>('');
  const [compatibleCaseType, setCompatibleCaseType] = useState<CaseType>('metal');
  const [editingModel, setEditingModel] = useState<MobileModel | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CaseTemplate | null>(null);
  const [brandName, setBrandName] = useState('');
  const [modelFormData, setModelFormData] = useState({ name: '', brand_id: '', image: '' });
  const [autoCreating, setAutoCreating] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: '', case_type: 'metal' as CaseType, template_image: '',
    mask_x: 20, mask_y: 15, mask_width: 60, mask_height: 70, model_id: '',
  });

  // Bulk compatible add state
  const [compatibleSearch, setCompatibleSearch] = useState('');
  const [selectedCompatibleModels, setSelectedCompatibleModels] = useState<string[]>([]);

  const brandModels = selectedBrandId === 'all'
    ? allModels
    : allModels?.filter(m => m.brand_id === selectedBrandId);

  const getTemplatesForModel = (modelId: string) =>
    templates?.filter(t => (t as any).model_id === modelId) || [];

  const getCompatibleGroups = (modelId: string) => {
    const metal = metalGroups?.filter(g => g.model_id === modelId) || [];
    const snap = snapGroups?.filter(g => g.model_id === modelId) || [];
    return { metal, snap };
  };

  const toggleExpanded = (modelId: string) => {
    setExpandedModels(prev => {
      const next = new Set(prev);
      next.has(modelId) ? next.delete(modelId) : next.add(modelId);
      return next;
    });
  };

  // Brand handlers
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBrandMutation.mutateAsync({ name: brandName });
      toast.success('Brand created');
      setIsBrandDialogOpen(false);
      setBrandName('');
    } catch (err: any) { toast.error(err.message); }
  };

  // Model handlers
  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        await updateModelMutation.mutateAsync({ id: editingModel.id, data: modelFormData });
        toast.success('Model updated');
      } else {
        await addModelMutation.mutateAsync(modelFormData);
        toast.success('Model added');
      }
      setIsModelDialogOpen(false);
      setEditingModel(null);
      setModelFormData({ name: '', brand_id: '', image: '' });
    } catch (err: any) { toast.error(err.message); }
  };

  const openEditModel = (model: MobileModel) => {
    setEditingModel(model);
    setModelFormData({ name: model.name, brand_id: model.brand_id, image: model.image || '' });
    setIsModelDialogOpen(true);
  };

  const handleDeleteModel = async (id: string) => {
    if (confirm('Delete this model and all its templates?')) {
      await deleteModelMutation.mutateAsync(id);
    }
  };

  // Template handlers
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFormData.template_image) { toast.error('Upload a template image'); return; }
    try {
      const payload = {
        name: templateFormData.name,
        case_type: templateFormData.case_type,
        template_image: templateFormData.template_image,
        mask_x: templateFormData.mask_x, mask_y: templateFormData.mask_y,
        mask_width: templateFormData.mask_width, mask_height: templateFormData.mask_height,
        model_id: templateFormData.model_id || null,
      };
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, data: payload });
        toast.success('Template updated');
      } else {
        await addTemplate.mutateAsync(payload as any);
        toast.success('Template created');
        setAutoCreating(true);
        const { data: newTemplates } = await (await import('@/integrations/supabase/client')).supabase
          .from('case_templates').select('*').order('created_at', { ascending: false }).limit(1);
        if (newTemplates?.[0]) {
          const count = await createProductsForTemplate(newTemplates[0] as CaseTemplate);
          if (count > 0) toast.success(`Auto-created ${count} products`);
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
        setAutoCreating(false);
      }
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
    } catch (err: any) { toast.error(err.message); setAutoCreating(false); }
  };

  const openNewTemplate = (modelId: string) => {
    setEditingTemplate(null);
    setTemplateFormData({
      name: '', case_type: 'metal', template_image: '',
      mask_x: 20, mask_y: 15, mask_width: 60, mask_height: 70, model_id: modelId,
    });
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplate = (t: CaseTemplate) => {
    setEditingTemplate(t);
    setTemplateFormData({
      name: t.name, case_type: t.case_type, template_image: t.template_image,
      mask_x: t.mask_x, mask_y: t.mask_y, mask_width: t.mask_width, mask_height: t.mask_height,
      model_id: (t as any).model_id || '',
    });
    setIsTemplateDialogOpen(true);
  };

  // Compatible handlers
  const openCompatibleDialog = (modelId: string) => {
    setCompatibleModelId(modelId);
    setIsCompatibleDialogOpen(true);
  };

  const handleAddCompatible = async () => {
    if (!compatibleModelId) return;
    await bulkAddCompatible.mutateAsync([{ model_id: compatibleModelId, case_type: compatibleCaseType }]);
    setIsCompatibleDialogOpen(false);
  };

  const isLoading = brandsLoading || modelsLoading || templatesLoading;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">Models & Templates</h2>
          <p className="text-sm text-muted-foreground">
            Manage brands, models, templates, and compatible devices in one place.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsBrandDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Brand
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setEditingModel(null);
            setModelFormData({ name: '', brand_id: selectedBrandId !== 'all' ? selectedBrandId : '', image: '' });
            setIsModelDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-1" /> Model
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Import
          </Button>
        </div>
      </div>

      {/* Brand Tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedBrandId === 'all' ? 'default' : 'outline'}
            size="sm" onClick={() => setSelectedBrandId('all')} className="shrink-0"
          >
            All Brands
          </Button>
          {brands?.map(brand => (
            <Button
              key={brand.id}
              variant={selectedBrandId === brand.id ? 'default' : 'outline'}
              size="sm" onClick={() => setSelectedBrandId(brand.id)} className="shrink-0"
            >
              {brand.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {autoCreating && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm">Auto-creating products...</span>
        </div>
      )}

      {/* Models List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {brandModels?.map(model => {
            const modelTemplates = getTemplatesForModel(model.id);
            const { metal, snap } = getCompatibleGroups(model.id);
            const brand = brands?.find(b => b.id === model.brand_id);
            const isExpanded = expandedModels.has(model.id);

            return (
              <Collapsible key={model.id} open={isExpanded} onOpenChange={() => toggleExpanded(model.id)}>
                <div className="rounded-xl border bg-card overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {model.image ? (
                          <img src={model.image} alt={model.name} className="w-10 h-10 object-contain rounded border" />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{brand?.name} › {model.name}</p>
                          <div className="flex gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px]">{modelTemplates.length} template{modelTemplates.length !== 1 ? 's' : ''}</Badge>
                            {metal.length > 0 && <Badge variant="secondary" className="text-[10px]">Metal ✓</Badge>}
                            {snap.length > 0 && <Badge variant="secondary" className="text-[10px]">Snap ✓</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModel(model)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteModel(model.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t px-4 py-4 space-y-4">
                      {/* Templates Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">Templates</h4>
                          <Button size="sm" variant="outline" onClick={() => openNewTemplate(model.id)}>
                            <Plus className="w-3 h-3 mr-1" /> Template
                          </Button>
                        </div>
                        {modelTemplates.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {modelTemplates.map(t => (
                              <div key={t.id} className="border rounded-lg overflow-hidden bg-background">
                                <div className="aspect-[3/4] relative bg-muted">
                                  <img src={t.template_image} alt={t.name} className="w-full h-full object-contain" />
                                  <div
                                    className="absolute border-2 border-dashed border-primary/50 bg-primary/10 rounded"
                                    style={{ left: `${t.mask_x}%`, top: `${t.mask_y}%`, width: `${t.mask_width}%`, height: `${t.mask_height}%` }}
                                  />
                                </div>
                                <div className="p-2 flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-medium truncate">{t.name}</p>
                                    <Badge variant="secondary" className="text-[10px]">{t.case_type}</Badge>
                                  </div>
                                  <div className="flex gap-0.5">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditTemplate(t)}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                                      if (confirm('Delete this template?')) deleteTemplate.mutateAsync(t.id);
                                    }}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No templates yet.</p>
                        )}
                      </div>

                      {/* Compatible Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">Compatible Case Types</h4>
                          <Button size="sm" variant="outline" onClick={() => openCompatibleDialog(model.id)}>
                            <Plus className="w-3 h-3 mr-1" /> Add Compatible
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {[...metal, ...snap].length > 0 ? (
                            [...metal, ...snap].map(group => (
                              <div key={group.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                                <div className="flex items-center gap-2">
                                  <Badge variant={group.case_type === 'metal' ? 'default' : 'secondary'}>{group.case_type}</Badge>
                                  <Switch
                                    checked={group.is_visible}
                                    onCheckedChange={(checked) => updateGroup.mutate({ id: group.id, is_visible: checked })}
                                  />
                                  {group.is_visible ? <Eye className="w-3.5 h-3.5 text-green-500" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromGroup.mutate(group.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Not added to any compatible group.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
          {(!brandModels || brandModels.length === 0) && (
            <div className="text-center py-12 text-muted-foreground border rounded-xl">
              <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No models found. Add a brand and models first.</p>
            </div>
          )}
        </div>
      )}

      {/* Brand Dialog */}
      <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Brand</DialogTitle></DialogHeader>
          <form onSubmit={handleAddBrand} className="space-y-4">
            <div>
              <Label>Brand Name</Label>
              <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g., Samsung" required />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsBrandDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={addBrandMutation.isPending}>
                {addBrandMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Model Dialog */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingModel ? 'Edit Model' : 'Add New Model'}</DialogTitle></DialogHeader>
          <form onSubmit={handleModelSubmit} className="space-y-4">
            <div>
              <Label>Brand</Label>
              <Select value={modelFormData.brand_id} onValueChange={v => setModelFormData({ ...modelFormData, brand_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model Name</Label>
              <Input value={modelFormData.name} onChange={e => setModelFormData({ ...modelFormData, name: e.target.value })} placeholder="e.g., Galaxy S24 Ultra" required />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={modelFormData.image} onChange={e => setModelFormData({ ...modelFormData, image: e.target.value })} placeholder="https://..." />
              {modelFormData.image && <img src={modelFormData.image} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded border" />}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsModelDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={addModelMutation.isPending || updateModelMutation.isPending || !modelFormData.brand_id}>
                {(addModelMutation.isPending || updateModelMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingModel ? 'Update' : 'Add Model'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTemplate ? 'Edit Template' : 'New Case Template'}</DialogTitle></DialogHeader>
          <form onSubmit={handleTemplateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={templateFormData.name} onChange={e => setTemplateFormData({ ...templateFormData, name: e.target.value })} placeholder="e.g., Metal Case V1" required />
              </div>
              <div>
                <Label>Case Type</Label>
                <Select value={templateFormData.case_type} onValueChange={(v: CaseType) => setTemplateFormData({ ...templateFormData, case_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="snap">Snap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ImageUploader
              value={templateFormData.template_image}
              onChange={url => setTemplateFormData({ ...templateFormData, template_image: url || '' })}
              folder="templates"
              label="Case Mockup Image (PNG with transparent area)"
            />
            <div>
              <Label className="text-xs text-muted-foreground">Mask Area (% position & size)</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {(['mask_x', 'mask_y', 'mask_width', 'mask_height'] as const).map(field => (
                  <div key={field}>
                    <Label className="text-[10px]">{field.replace('mask_', '').replace('x', 'X %').replace('y', 'Y %').replace('width', 'Width %').replace('height', 'Height %')}</Label>
                    <Input type="number" min={0} max={100} value={templateFormData[field]}
                      onChange={e => setTemplateFormData({ ...templateFormData, [field]: +e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
            {templateFormData.template_image && (
              <div className="relative w-40 h-56 mx-auto bg-muted rounded-lg overflow-hidden border">
                <img src={templateFormData.template_image} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute border-2 border-dashed border-primary bg-primary/20 rounded"
                  style={{ left: `${templateFormData.mask_x}%`, top: `${templateFormData.mask_y}%`, width: `${templateFormData.mask_width}%`, height: `${templateFormData.mask_height}%` }} />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={addTemplate.isPending || updateTemplate.isPending}>
                {(addTemplate.isPending || updateTemplate.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTemplate ? 'Update' : 'Create & Auto-Generate Products'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compatible Dialog */}
      <Dialog open={isCompatibleDialogOpen} onOpenChange={setIsCompatibleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add to Compatible Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Case Type</Label>
              <Select value={compatibleCaseType} onValueChange={(v: CaseType) => setCompatibleCaseType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="metal">Metal Case</SelectItem>
                  <SelectItem value="snap">Snap Case</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCompatibleDialogOpen(false)}>Cancel</Button>
              <Button className="gradient-primary" onClick={handleAddCompatible} disabled={bulkAddCompatible.isPending}>
                {bulkAddCompatible.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExcelImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        brands={brands || []}
        preselectedBrandId={selectedBrandId !== 'all' ? selectedBrandId : undefined}
      />
    </div>
  );
};

export default ModelsManager;

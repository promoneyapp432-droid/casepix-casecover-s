import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, ChevronRight, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCaseTemplates, useAddCaseTemplate, useUpdateCaseTemplate, useDeleteCaseTemplate, CaseTemplate } from '@/hooks/useDesigns';
import { useMobileBrands, useMobileModels, useAddBrand, useAddModel } from '@/hooks/useMobileBrands';
import ImageUploader from '@/components/admin/ImageUploader';
import { useAutoProductCreation } from '@/hooks/useAutoProductCreation';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CaseTemplatesManager = () => {
  const { data: templates, isLoading } = useCaseTemplates();
  const { data: brands } = useMobileBrands();
  const { data: allModels } = useMobileModels();
  const addTemplate = useAddCaseTemplate();
  const updateTemplate = useUpdateCaseTemplate();
  const deleteTemplate = useDeleteCaseTemplate();
  const addBrandMutation = useAddBrand();
  const addModelMutation = useAddModel();
  const { createProductsForTemplate } = useAutoProductCreation();
  const queryClient = useQueryClient();

  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CaseTemplate | null>(null);
  const [autoCreating, setAutoCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    case_type: 'metal' as 'metal' | 'snap',
    template_image: '',
    mask_x: 20,
    mask_y: 15,
    mask_width: 60,
    mask_height: 70,
    model_id: '',
  });
  const [brandName, setBrandName] = useState('');
  const [modelFormData, setModelFormData] = useState({ name: '', brand_id: '' });

  // Get models for selected brand
  const brandModels = selectedBrandId === 'all'
    ? allModels
    : allModels?.filter(m => m.brand_id === selectedBrandId);

  // Get templates for current view (filtered by model's brand)
  const filteredTemplates = templates?.filter(t => {
    if (selectedBrandId === 'all') return true;
    const model = allModels?.find(m => m.id === (t as any).model_id);
    return model?.brand_id === selectedBrandId;
  }) || [];

  // Group templates by model
  const getTemplatesForModel = (modelId: string) =>
    templates?.filter(t => (t as any).model_id === modelId) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_image) {
      toast.error('Please upload a template image');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        case_type: formData.case_type,
        template_image: formData.template_image,
        mask_x: formData.mask_x,
        mask_y: formData.mask_y,
        mask_width: formData.mask_width,
        mask_height: formData.mask_height,
        model_id: formData.model_id || null,
      };

      if (editing) {
        await updateTemplate.mutateAsync({ id: editing.id, data: payload });
        toast.success('Template updated');
      } else {
        await addTemplate.mutateAsync(payload as any);
        toast.success('Template created');

        // Auto-create products for all existing designs
        setAutoCreating(true);
        const { data: newTemplates } = await (await import('@/integrations/supabase/client')).supabase
          .from('case_templates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        if (newTemplates?.[0]) {
          const count = await createProductsForTemplate(newTemplates[0] as CaseTemplate);
          if (count > 0) toast.success(`Auto-created ${count} products for this template`);
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
        setAutoCreating(false);
      }
      setIsDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message);
      setAutoCreating(false);
    }
  };

  const handleEdit = (t: CaseTemplate) => {
    setEditing(t);
    setFormData({
      name: t.name,
      case_type: t.case_type,
      template_image: t.template_image,
      mask_x: t.mask_x,
      mask_y: t.mask_y,
      mask_width: t.mask_width,
      mask_height: t.mask_height,
      model_id: (t as any).model_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this template?')) {
      try {
        await deleteTemplate.mutateAsync(id);
        toast.success('Template deleted');
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const openNew = (modelId?: string) => {
    setEditing(null);
    setFormData({
      name: '',
      case_type: 'metal',
      template_image: '',
      mask_x: 20,
      mask_y: 15,
      mask_width: 60,
      mask_height: 70,
      model_id: modelId || '',
    });
    setIsDialogOpen(true);
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBrandMutation.mutateAsync({ name: brandName });
      toast.success('Brand created');
      setIsBrandDialogOpen(false);
      setBrandName('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addModelMutation.mutateAsync(modelFormData);
      toast.success('Model added');
      setIsModelDialogOpen(false);
      setModelFormData({ name: '', brand_id: '' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const isPending = addTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">Templates by Brand & Model</h3>
          <p className="text-xs text-muted-foreground">
            Manage brands → models → case templates. Adding a template auto-creates products.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBrandDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Brand
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setModelFormData({ name: '', brand_id: selectedBrandId !== 'all' ? selectedBrandId : '' }); setIsModelDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Model
          </Button>
        </div>
      </div>

      {/* Brand Tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedBrandId === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedBrandId('all')}
            className="shrink-0"
          >
            All Brands
          </Button>
          {brands?.map(brand => (
            <Button
              key={brand.id}
              variant={selectedBrandId === brand.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedBrandId(brand.id)}
              className="shrink-0"
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
          <span className="text-sm">Auto-creating products for all designs...</span>
        </div>
      )}

      {/* Models with Templates */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-4">
          {brandModels?.map(model => {
            const modelTemplates = getTemplatesForModel(model.id);
            const brand = brands?.find(b => b.id === model.brand_id);
            return (
              <div key={model.id} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{brand?.name} <ChevronRight className="w-3 h-3 inline" /> {model.name}</span>
                    <Badge variant="outline" className="text-xs">{modelTemplates.length} template{modelTemplates.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openNew(model.id)}>
                    <Plus className="w-3 h-3 mr-1" /> Template
                  </Button>
                </div>
                {modelTemplates.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                    {modelTemplates.map((t) => (
                      <div key={t.id} className="border rounded-lg overflow-hidden bg-background">
                        <div className="aspect-[3/4] relative bg-muted">
                          <img src={t.template_image} alt={t.name} className="w-full h-full object-contain" />
                          <div
                            className="absolute border-2 border-dashed border-primary/50 bg-primary/10 rounded"
                            style={{
                              left: `${t.mask_x}%`,
                              top: `${t.mask_y}%`,
                              width: `${t.mask_width}%`,
                              height: `${t.mask_height}%`,
                            }}
                          />
                        </div>
                        <div className="p-2 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium truncate">{t.name}</p>
                            <Badge variant="secondary" className="text-[10px]">{t.case_type}</Badge>
                          </div>
                          <div className="flex gap-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(t)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No templates yet. Add a case template for this model.
                  </div>
                )}
              </div>
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

      {/* Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'New Case Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Metal Case V1"
                  required
                />
              </div>
              <div>
                <Label>Case Type</Label>
                <Select
                  value={formData.case_type}
                  onValueChange={(v: 'metal' | 'snap') => setFormData({ ...formData, case_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="snap">Snap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Mobile Model</Label>
              <Select
                value={formData.model_id}
                onValueChange={(v) => setFormData({ ...formData, model_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  {brands?.map(brand => (
                    <div key={brand.id}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{brand.name}</div>
                      {allModels?.filter(m => m.brand_id === brand.id).map(model => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ImageUploader
              value={formData.template_image}
              onChange={(url) => setFormData({ ...formData, template_image: url || '' })}
              folder="templates"
              label="Case Mockup Image (PNG with transparent area)"
            />

            <div>
              <Label className="text-xs text-muted-foreground">Mask Area (% position & size)</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                <div>
                  <Label className="text-[10px]">X %</Label>
                  <Input type="number" min={0} max={100} value={formData.mask_x}
                    onChange={(e) => setFormData({ ...formData, mask_x: +e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px]">Y %</Label>
                  <Input type="number" min={0} max={100} value={formData.mask_y}
                    onChange={(e) => setFormData({ ...formData, mask_y: +e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px]">Width %</Label>
                  <Input type="number" min={0} max={100} value={formData.mask_width}
                    onChange={(e) => setFormData({ ...formData, mask_width: +e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px]">Height %</Label>
                  <Input type="number" min={0} max={100} value={formData.mask_height}
                    onChange={(e) => setFormData({ ...formData, mask_height: +e.target.value })} />
                </div>
              </div>
            </div>

            {formData.template_image && (
              <div className="relative w-40 h-56 mx-auto bg-muted rounded-lg overflow-hidden border">
                <img src={formData.template_image} alt="Preview" className="w-full h-full object-contain" />
                <div
                  className="absolute border-2 border-dashed border-primary bg-primary/20 rounded"
                  style={{
                    left: `${formData.mask_x}%`,
                    top: `${formData.mask_y}%`,
                    width: `${formData.mask_width}%`,
                    height: `${formData.mask_height}%`,
                  }}
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Update' : 'Create & Auto-Generate Products'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Brand Dialog */}
      <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Brand</DialogTitle></DialogHeader>
          <form onSubmit={handleAddBrand} className="space-y-4">
            <div>
              <Label>Brand Name</Label>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g., Samsung" required />
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
          <DialogHeader><DialogTitle>New Model</DialogTitle></DialogHeader>
          <form onSubmit={handleAddModel} className="space-y-4">
            <div>
              <Label>Brand</Label>
              <Select value={modelFormData.brand_id} onValueChange={(v) => setModelFormData({ ...modelFormData, brand_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model Name</Label>
              <Input value={modelFormData.name} onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })} placeholder="e.g., Galaxy S24 Ultra" required />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsModelDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={addModelMutation.isPending || !modelFormData.brand_id}>
                {addModelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Model
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseTemplatesManager;

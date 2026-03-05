import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCaseTemplates, useAddCaseTemplate, useUpdateCaseTemplate, useDeleteCaseTemplate, CaseTemplate } from '@/hooks/useDesigns';
import ImageUploader from '@/components/admin/ImageUploader';

const CaseTemplatesManager = () => {
  const { data: templates, isLoading } = useCaseTemplates();
  const addTemplate = useAddCaseTemplate();
  const updateTemplate = useUpdateCaseTemplate();
  const deleteTemplate = useDeleteCaseTemplate();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CaseTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    case_type: 'metal' as 'metal' | 'snap',
    template_image: '',
    mask_x: 20,
    mask_y: 15,
    mask_width: 60,
    mask_height: 70,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.template_image) {
      toast.error('Please upload a template image');
      return;
    }
    try {
      if (editing) {
        await updateTemplate.mutateAsync({ id: editing.id, data: formData });
        toast.success('Template updated');
      } else {
        await addTemplate.mutateAsync(formData);
        toast.success('Template created');
      }
      setIsDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message);
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

  const openNew = () => {
    setEditing(null);
    setFormData({ name: '', case_type: 'metal', template_image: '', mask_x: 20, mask_y: 15, mask_width: 60, mask_height: 70 });
    setIsDialogOpen(true);
  };

  const isPending = addTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Case Templates (Mask)</h3>
          <p className="text-xs text-muted-foreground">
            Upload phone case mockup images with transparent areas for design placement
          </p>
        </div>
        <Button size="sm" className="gradient-primary" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Add Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !templates?.length ? (
        <div className="text-center py-8 text-muted-foreground border rounded-xl">
          No case templates yet. Add a phone case mockup to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="border rounded-xl overflow-hidden bg-card group">
              <div className="aspect-[3/4] relative bg-muted">
                <img src={t.template_image} alt={t.name} className="w-full h-full object-contain" />
                {/* Mask area overlay */}
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
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <span className="text-xs text-muted-foreground capitalize">{t.case_type}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
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

            <ImageUploader
              value={formData.template_image}
              onChange={(url) => setFormData({ ...formData, template_image: url || '' })}
              folder="templates"
              label="Case Mockup Image (PNG with transparent area)"
            />

            <div>
              <Label className="text-xs text-muted-foreground">Mask Area (% position & size where design goes)</Label>
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

            {/* Live preview of mask area */}
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
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseTemplatesManager;

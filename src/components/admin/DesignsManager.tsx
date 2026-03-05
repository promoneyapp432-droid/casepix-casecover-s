import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Loader2, Upload, X, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react';
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
import { useDesigns, useAddDesign, useUpdateDesign, useDeleteDesign, useAddDesignImage, useDeleteDesignImage, Design } from '@/hooks/useDesigns';
import { useCategories } from '@/hooks/useCategories';
import { useImageUpload } from '@/hooks/useImageUpload';

const DesignsManager = () => {
  const { data: designs, isLoading } = useDesigns();
  const { data: categories } = useCategories();
  const addDesign = useAddDesign();
  const updateDesign = useUpdateDesign();
  const deleteDesign = useDeleteDesign();
  const addDesignImage = useAddDesignImage();
  const deleteDesignImage = useDeleteDesignImage();
  const { uploadImage, isUploading } = useImageUpload();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [formData, setFormData] = useState({ name: '', category_id: '' });
  const [expandedDesigns, setExpandedDesigns] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filteredDesigns = designs?.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group by category
  const groupedDesigns = filteredDesigns.reduce((acc, design) => {
    const catName = design.category?.name || 'Uncategorized';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(design);
    return acc;
  }, {} as Record<string, Design[]>);

  const toggleExpand = (id: string) => {
    setExpandedDesigns(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDesign) {
        await updateDesign.mutateAsync({
          id: editingDesign.id,
          data: { name: formData.name, category_id: formData.category_id || null },
        });
        toast.success('Design updated');
      } else {
        await addDesign.mutateAsync({
          name: formData.name,
          category_id: formData.category_id || null,
        });
        toast.success('Design created');
      }
      setIsDialogOpen(false);
      setEditingDesign(null);
      setFormData({ name: '', category_id: '' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (design: Design) => {
    setEditingDesign(design);
    setFormData({ name: design.name, category_id: design.category_id || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this design and all its images?')) {
      try {
        await deleteDesign.mutateAsync(id);
        toast.success('Design deleted');
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleAddImage = async (designId: string, file: File) => {
    const url = await uploadImage(file, 'designs');
    if (url) {
      const currentImages = designs?.find(d => d.id === designId)?.design_images || [];
      await addDesignImage.mutateAsync({
        design_id: designId,
        image_url: url,
        sort_order: currentImages.length,
      });
      toast.success('Image added');
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    try {
      await deleteDesignImage.mutateAsync(imageId);
      toast.success('Image removed');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const isPending = addDesign.isPending || updateDesign.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search designs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gradient-primary" onClick={() => {
          setEditingDesign(null);
          setFormData({ name: '', category_id: '' });
          setIsDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Design
        </Button>
      </div>

      {/* Designs grouped by category */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading designs...</div>
      ) : Object.keys(groupedDesigns).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No designs yet. Create your first design!</p>
        </div>
      ) : (
        Object.entries(groupedDesigns).map(([catName, catDesigns]) => (
          <div key={catName} className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b">
              <h3 className="font-semibold text-sm">{catName} ({catDesigns.length})</h3>
            </div>
            <div className="divide-y">
              {catDesigns.map((design) => {
                const isExpanded = expandedDesigns.has(design.id);
                const images = design.design_images || [];
                return (
                  <div key={design.id}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(design.id)}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      
                      {/* Preview thumbnails */}
                      <div className="flex -space-x-2">
                        {images.slice(0, 3).map((img) => (
                          <img
                            key={img.id}
                            src={img.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border-2 border-background"
                          />
                        ))}
                        {images.length === 0 && (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{design.name}</p>
                        <p className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''}</p>
                      </div>

                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(design)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(design.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded images grid */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1">
                            <div className="flex flex-wrap gap-3">
                              {images.sort((a, b) => a.sort_order - b.sort_order).map((img) => (
                                <div key={img.id} className="relative group w-24 h-24">
                                  <img
                                    src={img.image_url}
                                    alt=""
                                    className="w-full h-full object-cover rounded-lg border"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveImage(img.id)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              
                              {/* Add image button */}
                              <div
                                onClick={() => fileInputRefs.current[design.id]?.click()}
                                className="w-24 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                              >
                                {isUploading ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                                  </>
                                )}
                              </div>
                              <input
                                ref={(el) => { fileInputRefs.current[design.id] = el; }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleAddImage(design.id, file);
                                  e.target.value = '';
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Design Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDesign ? 'Edit Design' : 'New Design'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Naruto Sage Mode"
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(v) => setFormData({ ...formData, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingDesign ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignsManager;

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Loader2, Upload, X, Image as ImageIcon, ChevronDown, ChevronRight, LayoutGrid, List, FolderPlus } from 'lucide-react';
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
import { useDesigns, useAddDesign, useUpdateDesign, useDeleteDesign, useAddDesignImage, useDeleteDesignImage, Design } from '@/hooks/useDesigns';
import { useCategories } from '@/hooks/useCategories';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAutoProductCreation } from '@/hooks/useAutoProductCreation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parent_id?: string | null;
}

const DesignsManager = () => {
  const { data: designs, isLoading } = useDesigns();
  const { data: categories } = useCategories();
  const addDesign = useAddDesign();
  const updateDesign = useUpdateDesign();
  const deleteDesign = useDeleteDesign();
  const addDesignImage = useAddDesignImage();
  const deleteDesignImage = useDeleteDesignImage();
  const { uploadImage, isUploading } = useImageUpload();
  const { createProductsForDesign, deleteProductsForDesign } = useAutoProductCreation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [formData, setFormData] = useState({ name: '', category_id: '' });
  const [catFormData, setCatFormData] = useState({ name: '', slug: '', parent_id: '' });
  const [expandedDesigns, setExpandedDesigns] = useState<Set<string>>(new Set());
  const [autoCreating, setAutoCreating] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const newDesignFileRef = useRef<HTMLInputElement | null>(null);

  // Category helpers
  const parentCategories = (categories as Category[] | undefined)?.filter(c => !(c as any).parent_id) || [];
  const getSubcategories = (parentId: string) =>
    (categories as Category[] | undefined)?.filter(c => (c as any).parent_id === parentId) || [];

  // Filter designs
  const filteredDesigns = designs?.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryId === 'all' || d.category_id === selectedCategoryId;
    return matchesSearch && matchesCategory;
  }) || [];

  const toggleExpand = (id: string) => {
    setExpandedDesigns(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Add category mutation
  const addCategory = useMutation({
    mutationFn: async (data: { name: string; slug: string; parent_id?: string | null }) => {
      const { error } = await supabase.from('categories').insert({
        name: data.name,
        slug: data.slug,
        parent_id: data.parent_id || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
      setIsCategoryDialogOpen(false);
      setCatFormData({ name: '', slug: '', parent_id: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Direct image upload → auto-create design
  const handleDirectImageUpload = async (files: FileList) => {
    if (selectedCategoryId === 'all') {
      toast.error('Please select a category first');
      return;
    }

    for (const file of Array.from(files)) {
      const designName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      try {
        // Create design
        const design = await addDesign.mutateAsync({
          name: designName,
          category_id: selectedCategoryId,
        });

        // Upload image
        const url = await uploadImage(file, 'designs');
        if (url) {
          await addDesignImage.mutateAsync({
            design_id: design.id,
            image_url: url,
            sort_order: 0,
          });

          // Auto-create products
          setAutoCreating(design.id);
          const updatedDesign = {
            ...design,
            design_images: [{ id: 'temp', design_id: design.id, image_url: url, sort_order: 0, created_at: '' }],
          };
          const count = await createProductsForDesign(updatedDesign);
          if (count > 0) toast.success(`Auto-created ${count} products for "${designName}"`);
          setAutoCreating(null);
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      } catch (err: any) {
        toast.error(`Failed to create design "${designName}": ${err.message}`);
      }
    }
  };

  const handleEdit = (design: Design) => {
    setEditingDesign(design);
    setFormData({ name: design.name, category_id: design.category_id || '' });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDesign) return;
    try {
      await updateDesign.mutateAsync({
        id: editingDesign.id,
        data: { name: formData.name, category_id: formData.category_id || null },
      });
      toast.success('Design updated');
      setIsEditDialogOpen(false);
      setEditingDesign(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this design and all its images?')) {
      try {
        setAutoCreating(id);
        await deleteProductsForDesign(id);
        await deleteDesign.mutateAsync(id);
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success('Design deleted');
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setAutoCreating(null);
      }
    }
  };

  const handleAddImage = async (designId: string, file: File) => {
    const url = await uploadImage(file, 'designs');
    if (url) {
      const design = designs?.find(d => d.id === designId);
      const currentImages = design?.design_images || [];
      await addDesignImage.mutateAsync({
        design_id: designId,
        image_url: url,
        sort_order: currentImages.length,
      });
      toast.success('Image added');

      if (design && currentImages.length === 0) {
        setAutoCreating(designId);
        const updatedDesign = { ...design, design_images: [...currentImages, { id: 'temp', design_id: designId, image_url: url, sort_order: currentImages.length, created_at: '' }] };
        const count = await createProductsForDesign(updatedDesign);
        if (count > 0) toast.success(`Auto-created ${count} products`);
        setAutoCreating(null);
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
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

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const selectedCategoryName = selectedCategoryId !== 'all'
    ? (categories as Category[] | undefined)?.find(c => c.id === selectedCategoryId)?.name
    : null;

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategoryId === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategoryId('all')}
            className="shrink-0"
          >
            All
          </Button>
          {parentCategories.map(cat => (
            <div key={cat.id} className="flex gap-1 shrink-0">
              <Button
                variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.image && <img src={cat.image} alt="" className="w-4 h-4 rounded object-cover mr-1" />}
                {cat.name}
              </Button>
              {getSubcategories(cat.id).map(sub => (
                <Button
                  key={sub.id}
                  variant={selectedCategoryId === sub.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategoryId(sub.id)}
                  className="text-xs"
                >
                  {sub.name}
                </Button>
              ))}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCategoryDialogOpen(true)}
            className="shrink-0"
          >
            <FolderPlus className="w-4 h-4 mr-1" />
            Add Category
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Header Row */}
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
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            className="gradient-primary"
            onClick={() => newDesignFileRef.current?.click()}
            disabled={selectedCategoryId === 'all'}
            title={selectedCategoryId === 'all' ? 'Select a category first' : `Upload design to ${selectedCategoryName}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            {selectedCategoryId === 'all' ? 'Select Category First' : `Upload to ${selectedCategoryName}`}
          </Button>
          <input
            ref={newDesignFileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleDirectImageUpload(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading designs...</div>
      ) : filteredDesigns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No designs yet. {selectedCategoryId === 'all' ? 'Select a category and upload your first design!' : 'Upload your first design!'}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View - hover overlay */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredDesigns.map((design) => {
            const images = design.design_images || [];
            const firstImage = images[0]?.image_url;
            return (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-xl overflow-hidden bg-muted group cursor-pointer"
                style={{ aspectRatio: '1/2' }}
              >
                {firstImage ? (
                  <img src={firstImage} alt={design.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center"
                    onClick={() => fileInputRefs.current[design.id]?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">Upload Image</span>
                      </>
                    )}
                  </div>
                )}

                {autoCreating === design.id && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      <p className="text-xs mt-2">Creating products...</p>
                    </div>
                  </div>
                )}

                {images.length > 1 && (
                  <Badge className="absolute top-2 right-2 text-xs z-10">{images.length} imgs</Badge>
                )}

                {/* Hover overlay with name, category, edit, delete */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 z-10">
                  <p className="text-white text-sm font-semibold truncate">{design.name}</p>
                  <p className="text-white/70 text-xs truncate">{design.category?.name || 'No category'}</p>
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); handleEdit(design); }}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => { e.stopPropagation(); handleDelete(design.id); }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
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
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          {filteredDesigns.map((design) => {
            const isExpanded = expandedDesigns.has(design.id);
            const images = design.design_images || [];
            return (
              <div key={design.id}>
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(design.id)}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <div className="flex -space-x-2">
                    {images.slice(0, 3).map((img) => (
                      <img key={img.id} src={img.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-background" />
                    ))}
                    {images.length === 0 && (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{design.name}</p>
                    <p className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''} • {design.category?.name || 'No category'}</p>
                  </div>
                  {autoCreating === design.id && (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Creating...
                    </Badge>
                  )}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(design)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(design.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
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
                            <div key={img.id} className="relative group" style={{ width: '80px', height: '160px' }}>
                              <img src={img.image_url} alt="" className="w-full h-full object-cover rounded-lg border" />
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
                          <div
                            onClick={() => fileInputRefs.current[design.id]?.click()}
                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                            style={{ width: '80px', height: '160px' }}
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
      )}

      {/* Edit Design Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Design</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
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
                  {parentCategories.map((cat) => (
                    <div key={cat.id}>
                      <SelectItem value={cat.id}>{cat.name}</SelectItem>
                      {getSubcategories(cat.id).map(sub => (
                        <SelectItem key={sub.id} value={sub.id} className="pl-8">
                          ↳ {sub.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={updateDesign.isPending}>
                {updateDesign.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addCategory.mutate({ name: catFormData.name, slug: catFormData.slug || generateSlug(catFormData.name), parent_id: catFormData.parent_id || null }); }} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={catFormData.name}
                onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value, slug: generateSlug(e.target.value) })}
                placeholder="e.g., Anime"
                required
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={catFormData.slug}
                onChange={(e) => setCatFormData({ ...catFormData, slug: e.target.value })}
                placeholder="auto-generated"
              />
            </div>
            <div>
              <Label>Parent Category (optional - for subcategory)</Label>
              <Select
                value={catFormData.parent_id}
                onValueChange={(v) => setCatFormData({ ...catFormData, parent_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gradient-primary" disabled={addCategory.isPending}>
                {addCategory.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignsManager;

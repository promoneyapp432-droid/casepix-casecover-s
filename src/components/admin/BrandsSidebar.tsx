import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  MobileBrand,
  useAddBrand,
  useUpdateBrand,
  useDeleteBrand,
} from '@/hooks/useMobileBrands';

interface BrandsSidebarProps {
  brands: MobileBrand[];
  selectedBrandId: string | null;
  onSelectBrand: (brandId: string | null) => void;
  modelCounts: Record<string, number>;
  isLoading?: boolean;
}

const BrandsSidebar = ({
  brands,
  selectedBrandId,
  onSelectBrand,
  modelCounts,
  isLoading,
}: BrandsSidebarProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<MobileBrand | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const addBrandMutation = useAddBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      await updateBrandMutation.mutateAsync({ id: editingBrand.id, data: formData });
    } else {
      await addBrandMutation.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    setEditingBrand(null);
    setFormData({ name: '' });
  };

  const handleEdit = (brand: MobileBrand, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBrand(brand);
    setFormData({ name: brand.name });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('This will also delete all models under this brand. Continue?')) {
      await deleteBrandMutation.mutateAsync(id);
      if (selectedBrandId === id) {
        onSelectBrand(null);
      }
    }
  };

  const openNewDialog = () => {
    setEditingBrand(null);
    setFormData({ name: '' });
    setIsDialogOpen(true);
  };

  const totalModels = Object.values(modelCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="w-64 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Brands</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" onClick={openNewDialog}>
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    placeholder="e.g., Samsung, Apple, Oppo"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="gradient-primary"
                    disabled={addBrandMutation.isPending || updateBrandMutation.isPending}
                  >
                    {(addBrandMutation.isPending || updateBrandMutation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingBrand ? 'Update' : 'Add Brand'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">
          {brands.length} brands • {totalModels} models
        </p>
      </div>

      {/* All Models Option */}
      <div className="p-2 border-b">
        <button
          onClick={() => onSelectBrand(null)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
            selectedBrandId === null
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary'
          )}
        >
          <Smartphone className="w-5 h-5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">All Models</p>
          </div>
          <Badge variant={selectedBrandId === null ? 'secondary' : 'outline'}>
            {totalModels}
          </Badge>
        </button>
      </div>

      {/* Brands List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No brands yet.
              <br />
              Click + to add one.
            </div>
          ) : (
            brands.map((brand) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="group"
              >
                <button
                  onClick={() => onSelectBrand(brand.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                    selectedBrandId === brand.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{brand.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={selectedBrandId === brand.id ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {modelCounts[brand.id] || 0}
                    </Badge>
                    <div className={cn(
                      'flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                      selectedBrandId === brand.id && 'opacity-100'
                    )}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleEdit(brand, e)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(brand.id, e)}
                        disabled={deleteBrandMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BrandsSidebar;

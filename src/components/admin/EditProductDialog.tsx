import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Loader2, Package, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ImageUploader from './ImageUploader';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductWithVariants {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category_id: string | null;
  image: string | null;
  is_new: boolean | null;
  is_top_design: boolean | null;
  product_variants: {
    id: string;
    case_type: 'metal' | 'snap';
    price: number;
    image: string | null;
  }[];
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

const EditProductDialog = ({ open, onOpenChange, productId }: EditProductDialogProps) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    isNew: false,
    isTopDesign: false,
    metalImage: '',
    snapImage: '',
    metalVariantId: '',
    snapVariantId: '',
  });

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product-edit', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          category_id,
          image,
          is_new,
          is_top_design,
          product_variants(id, case_type, price, image)
        `)
        .eq('id', productId)
        .maybeSingle();
      if (error) throw error;
      return data as ProductWithVariants | null;
    },
    enabled: !!productId && open,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      const metalVariant = product.product_variants?.find(v => v.case_type === 'metal');
      const snapVariant = product.product_variants?.find(v => v.case_type === 'snap');
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        categoryId: product.category_id || '',
        isNew: product.is_new || false,
        isTopDesign: product.is_top_design || false,
        metalImage: metalVariant?.image || '',
        snapImage: snapVariant?.image || '',
        metalVariantId: metalVariant?.id || '',
        snapVariantId: snapVariant?.id || '',
      });
    }
  }, [product]);

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error('No product ID');

      // Update the base product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description || null,
          category_id: formData.categoryId || null,
          is_new: formData.isNew,
          is_top_design: formData.isTopDesign,
          image: formData.metalImage || formData.snapImage,
        })
        .eq('id', productId);

      if (productError) throw productError;

      // Update or create metal variant
      if (formData.metalImage) {
        if (formData.metalVariantId) {
          await supabase
            .from('product_variants')
            .update({ image: formData.metalImage })
            .eq('id', formData.metalVariantId);
        } else {
          await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              case_type: 'metal',
              title: `${formData.name} - Metal Case`,
              price: 799,
              image: formData.metalImage,
              stock: 100,
            });
        }
      } else if (formData.metalVariantId) {
        await supabase
          .from('product_variants')
          .delete()
          .eq('id', formData.metalVariantId);
      }

      // Update or create snap variant
      if (formData.snapImage) {
        if (formData.snapVariantId) {
          await supabase
            .from('product_variants')
            .update({ image: formData.snapImage })
            .eq('id', formData.snapVariantId);
        } else {
          await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              case_type: 'snap',
              title: `${formData.name} - Snap Case`,
              price: 499,
              image: formData.snapImage,
              stock: 100,
            });
        }
      } else if (formData.snapVariantId) {
        await supabase
          .from('product_variants')
          .delete()
          .eq('id', formData.snapVariantId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Product updated successfully!');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    updateProduct.mutate();
  };

  const isLoading = productLoading;
  const canSubmit = formData.name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Product
          </DialogTitle>
          <DialogDescription>
            Update product details, images, and settings.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Naruto Anime Design"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            {/* Toggles */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="isNew"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked }))}
                />
                <Label htmlFor="isNew">Mark as New</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isTopDesign"
                  checked={formData.isTopDesign}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isTopDesign: checked }))}
                />
                <Label htmlFor="isTopDesign">Top Design</Label>
              </div>
            </div>

            {/* Image Uploads */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-muted-foreground/60 to-muted-foreground" />
                  <Label>Metal Case Image</Label>
                </div>
                <ImageUploader
                  value={formData.metalImage || undefined}
                  onChange={(url) => setFormData(prev => ({ ...prev, metalImage: url || '' }))}
                  folder="products/metal"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary/60 to-primary" />
                  <Label>Snap Case Image</Label>
                </div>
                <ImageUploader
                  value={formData.snapImage || undefined}
                  onChange={(url) => setFormData(prev => ({ ...prev, snapImage: url || '' }))}
                  folder="products/snap"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="gradient-primary"
                disabled={!canSubmit || updateProduct.isPending}
              >
                {updateProduct.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;

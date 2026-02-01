import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader2, ImagePlus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface QuickProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickProductDialog = ({ open, onOpenChange }: QuickProductDialogProps) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    metalImage: '',
    snapImage: '',
    basePrice: '499',
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

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async () => {
      // Create the base product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          category_id: formData.categoryId || null,
          base_price: parseFloat(formData.basePrice) || 499,
          image: formData.metalImage || formData.snapImage, // Use first available as main
          is_new: true,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create variants for both case types
      const variants = [];
      
      if (formData.metalImage) {
        variants.push({
          product_id: product.id,
          case_type: 'metal' as const,
          title: `${formData.name} - Metal Case`,
          price: parseFloat(formData.basePrice) + 300,
          image: formData.metalImage,
          stock: 100,
        });
      }

      if (formData.snapImage) {
        variants.push({
          product_id: product.id,
          case_type: 'snap' as const,
          title: `${formData.name} - Snap Case`,
          price: parseFloat(formData.basePrice),
          image: formData.snapImage,
          stock: 100,
        });
      }

      if (variants.length > 0) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variants);

        if (variantError) throw variantError;
      }

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      metalImage: '',
      snapImage: '',
      basePrice: '499',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (!formData.metalImage && !formData.snapImage) {
      toast.error('Please upload at least one case image');
      return;
    }
    createProduct.mutate();
  };

  const canSubmit = formData.name.trim() && (formData.metalImage || formData.snapImage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add New Product
          </DialogTitle>
          <DialogDescription>
            Simply upload Metal Case and Snap Case images to create a product. 
            Other details like description and features come from A+ Content settings.
          </DialogDescription>
        </DialogHeader>

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

          <div>
            <Label htmlFor="basePrice">Base Price (₹)</Label>
            <Input
              id="basePrice"
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
              placeholder="499"
              className="max-w-[150px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Metal case will be priced at ₹{(parseFloat(formData.basePrice) || 499) + 300}
            </p>
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

          {/* How it works */}
          <div className="p-4 bg-secondary/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Upload the 1st image for Metal Case and/or Snap Case</li>
              <li>• Additional images (2-6) come from A+ Content settings</li>
              <li>• Product description & features are auto-filled from A+ Content</li>
              <li>• You can edit individual products later if needed</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-primary"
              disabled={!canSubmit || createProduct.isPending}
            >
              {createProduct.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickProductDialog;

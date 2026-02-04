import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Pencil, Trash2, Eye, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import EditProductDialog from './EditProductDialog';

interface Product {
  id: string;
  name: string;
  base_price: number;
  image: string | null;
  is_new: boolean | null;
  is_top_design: boolean | null;
  created_at: string;
  category: {
    id: string;
    name: string;
  } | null;
  product_variants: {
    id: string;
    case_type: 'metal' | 'snap';
    price: number;
    image: string | null;
  }[];
}

const ProductsManager = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editProductId, setEditProductId] = useState<string | null>(null);

  // Fetch products with variants
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          base_price,
          image,
          is_new,
          is_top_design,
          created_at,
          category:categories(id, name),
          product_variants(id, case_type, price, image)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      // Delete variants first
      await supabase.from('product_variants').delete().eq('product_id', id);
      // Then delete product
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProduct.mutate(id);
    }
  };

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No products yet</h3>
          <p className="text-sm text-muted-foreground">
            Click "Add Product" to create your first phone case design
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline">{product.category.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {product.product_variants.some(v => v.case_type === 'metal') && (
                        <Badge variant="secondary" className="text-xs">Metal</Badge>
                      )}
                      {product.product_variants.some(v => v.case_type === 'snap') && (
                        <Badge variant="secondary" className="text-xs">Snap</Badge>
                      )}
                      {product.product_variants.length === 0 && (
                        <span className="text-muted-foreground text-sm">No variants</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>₹{product.base_price}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {product.is_new && <Badge className="bg-primary/10 text-primary text-xs">New</Badge>}
                      {product.is_top_design && <Badge className="bg-accent/10 text-accent-foreground text-xs">Top</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link to={`/product/${product.id}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditProductId(product.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleteProduct.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Product Dialog */}
      <EditProductDialog
        open={!!editProductId}
        onOpenChange={(open) => !open && setEditProductId(null)}
        productId={editProductId}
      />
    </div>
  );
};

export default ProductsManager;

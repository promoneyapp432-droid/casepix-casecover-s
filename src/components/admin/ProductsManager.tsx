import { useState } from 'react';
import { Search, Pencil, Trash2, Eye, Loader2, Package, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import EditProductDialog from './EditProductDialog';
import { useCategories } from '@/hooks/useCategories';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  base_price: number;
  image: string | null;
  is_new: boolean | null;
  is_top_design: boolean | null;
  created_at: string;
  category: { id: string; name: string } | null;
  product_variants: { id: string; case_type: 'metal' | 'snap'; price: number; image: string | null }[];
}

const ProductsManager = () => {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editProductId, setEditProductId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`id, name, base_price, image, is_new, is_top_design, created_at, category:categories(id, name), product_variants(id, case_type, price, image)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('product_variants').delete().eq('product_id', id);
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: (error) => toast.error('Failed to delete: ' + error.message),
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) deleteProduct.mutate(id);
  };

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryId === 'all' || p.category?.id === selectedCategoryId;
    return matchesSearch && matchesCategory;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            All ({products?.length || 0})
          </Button>
          {categories?.map(cat => {
            const count = products?.filter(p => p.category?.id === cat.id).length || 0;
            return (
              <Button
                key={cat.id}
                variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryId(cat.id)}
                className="shrink-0"
              >
                {cat.name} ({count})
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No products yet</h3>
          <p className="text-sm text-muted-foreground">
            Products are auto-created when you add designs and templates
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-xl overflow-hidden bg-card group"
            >
              <div className="aspect-square relative bg-muted">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {product.is_new && <Badge className="text-[10px] bg-primary/90">New</Badge>}
                  {product.is_top_design && <Badge className="text-[10px] bg-accent/90">Top</Badge>}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-xs text-muted-foreground">{product.category?.name || '—'}</span>
                    <p className="text-sm font-semibold">₹{product.base_price}</p>
                  </div>
                  <div className="flex gap-0.5">
                    <Link to={`/product/${product.id}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3 h-3" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditProductId(product.id)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(product.id, product.name)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1 mt-1">
                  {product.product_variants.map(v => (
                    <Badge key={v.id} variant="secondary" className="text-[10px]">{v.case_type}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    {product.category ? <Badge variant="outline">{product.category.name}</Badge> : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {product.product_variants.map(v => (
                        <Badge key={v.id} variant="secondary" className="text-xs">{v.case_type}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>₹{product.base_price}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link to={`/product/${product.id}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditProductId(product.id)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(product.id, product.name)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditProductDialog
        open={!!editProductId}
        onOpenChange={(open) => !open && setEditProductId(null)}
        productId={editProductId}
      />
    </div>
  );
};

export default ProductsManager;

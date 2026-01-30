import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Product, ProductVariant, CaseType } from '@/types';

interface VariantFormData {
  title: string;
  description: string;
  price: string;
  image: string;
  stock: string;
}

const AdminProducts = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    image: '/placeholder.svg',
    categoryId: '',
    isNew: false,
    isTopDesign: false,
  });

  const [variants, setVariants] = useState<Record<CaseType, VariantFormData>>({
    snap: { title: '', description: '', price: '', image: '', stock: '0' },
    metal: { title: '', description: '', price: '', image: '', stock: '0' },
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpanded = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productVariants: ProductVariant[] = [];
    const caseTypes: CaseType[] = ['snap', 'metal'];
    
    caseTypes.forEach((caseType) => {
      const variantData = variants[caseType];
      if (variantData.title && variantData.price) {
        productVariants.push({
          id: `${editingProduct?.id || Date.now()}-${caseType}`,
          productId: editingProduct?.id || Date.now().toString(),
          caseType,
          title: variantData.title,
          description: variantData.description,
          price: parseFloat(variantData.price),
          image: variantData.image || formData.image,
          stock: parseInt(variantData.stock) || 0,
        });
      }
    });

    const productData: Omit<Product, 'id'> = {
      name: formData.name,
      description: formData.description,
      basePrice: parseFloat(formData.basePrice),
      image: formData.image,
      categoryId: formData.categoryId,
      isNew: formData.isNew,
      isTopDesign: formData.isTopDesign,
      createdAt: new Date().toISOString().split('T')[0],
      variants: productVariants.length > 0 ? productVariants : undefined,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      toast.success('Product updated successfully');
    } else {
      addProduct({
        id: Date.now().toString(),
        ...productData,
      });
      toast.success('Product added successfully');
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      basePrice: product.basePrice.toString(),
      image: product.image,
      categoryId: product.categoryId,
      isNew: product.isNew || false,
      isTopDesign: product.isTopDesign || false,
    });

    // Populate variant forms
    const newVariants: Record<CaseType, VariantFormData> = {
      snap: { title: '', description: '', price: '', image: '', stock: '0' },
      metal: { title: '', description: '', price: '', image: '', stock: '0' },
    };

    product.variants?.forEach((variant) => {
      newVariants[variant.caseType] = {
        title: variant.title,
        description: variant.description,
        price: variant.price.toString(),
        image: variant.image,
        stock: variant.stock.toString(),
      };
    });

    setVariants(newVariants);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      toast.success('Product deleted successfully');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      basePrice: '',
      image: '/placeholder.svg',
      categoryId: '',
      isNew: false,
      isTopDesign: false,
    });
    setVariants({
      snap: { title: '', description: '', price: '', image: '', stock: '0' },
      metal: { title: '', description: '', price: '', image: '', stock: '0' },
    });
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || 'Unknown';
  };

  const updateVariant = (caseType: CaseType, field: keyof VariantFormData, value: string) => {
    setVariants(prev => ({
      ...prev,
      [caseType]: { ...prev[caseType], [field]: value }
    }));
  };

  // Auto-fill variant title when product name changes
  const handleNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, name }));
    if (!editingProduct) {
      setVariants(prev => ({
        snap: { ...prev.snap, title: prev.snap.title || `${name} - Snap Case` },
        metal: { ...prev.metal, title: prev.metal.title || `${name} - Metal Case` },
      }));
    }
  };

  return (
    <AdminLayout title="Manage Products">
      <div className="space-y-6">
        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4 justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="snap">Snap Case</TabsTrigger>
                    <TabsTrigger value="metal">Metal Case</TabsTrigger>
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="basePrice">Base Price (₹)</Label>
                        <Input
                          id="basePrice"
                          type="number"
                          value={formData.basePrice}
                          onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.categoryId}
                          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="image">Default Image URL</Label>
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isNew"
                          checked={formData.isNew}
                          onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked as boolean })}
                        />
                        <Label htmlFor="isNew">New Arrival</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isTopDesign"
                          checked={formData.isTopDesign}
                          onCheckedChange={(checked) => setFormData({ ...formData, isTopDesign: checked as boolean })}
                        />
                        <Label htmlFor="isTopDesign">Top Design</Label>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Snap Case Variant Tab */}
                  <TabsContent value="snap" className="space-y-4 mt-4">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-semibold mb-4">Snap Case Variant</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={variants.snap.title}
                            onChange={(e) => updateVariant('snap', 'title', e.target.value)}
                            placeholder={`${formData.name || 'Product'} - Snap Case`}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={variants.snap.description}
                            onChange={(e) => updateVariant('snap', 'description', e.target.value)}
                            placeholder="Lightweight snap-on protection with vibrant print"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Price (₹)</Label>
                            <Input
                              type="number"
                              value={variants.snap.price}
                              onChange={(e) => updateVariant('snap', 'price', e.target.value)}
                              placeholder={formData.basePrice || '499'}
                            />
                          </div>
                          <div>
                            <Label>Stock</Label>
                            <Input
                              type="number"
                              value={variants.snap.stock}
                              onChange={(e) => updateVariant('snap', 'stock', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Image URL (optional)</Label>
                          <Input
                            value={variants.snap.image}
                            onChange={(e) => updateVariant('snap', 'image', e.target.value)}
                            placeholder="Leave empty to use default image"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Metal Case Variant Tab */}
                  <TabsContent value="metal" className="space-y-4 mt-4">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <h4 className="font-semibold mb-4">Metal Case Variant</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={variants.metal.title}
                            onChange={(e) => updateVariant('metal', 'title', e.target.value)}
                            placeholder={`${formData.name || 'Product'} - Metal Case`}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={variants.metal.description}
                            onChange={(e) => updateVariant('metal', 'description', e.target.value)}
                            placeholder="Premium aluminum case with laser-etched design"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Price (₹)</Label>
                            <Input
                              type="number"
                              value={variants.metal.price}
                              onChange={(e) => updateVariant('metal', 'price', e.target.value)}
                              placeholder={(parseInt(formData.basePrice || '499') + 300).toString()}
                            />
                          </div>
                          <div>
                            <Label>Stock</Label>
                            <Input
                              type="number"
                              value={variants.metal.stock}
                              onChange={(e) => updateVariant('metal', 'stock', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Image URL (optional)</Label>
                          <Input
                            value={variants.metal.image}
                            onChange={(e) => updateVariant('metal', 'image', e.target.value)}
                            placeholder="Leave empty to use default image"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    {editingProduct ? 'Update' : 'Add'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-card overflow-x-auto"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <>
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.variants && product.variants.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleExpanded(product.id)}
                        >
                          {expandedProducts.has(product.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {getCategoryName(product.categoryId)}
                    </TableCell>
                    <TableCell>₹{product.basePrice}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {product.variants?.length || 0} variants
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {product.isNew && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent">New</span>
                        )}
                        {product.isTopDesign && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">Top</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Expanded Variants */}
                  {expandedProducts.has(product.id) && product.variants?.map((variant) => (
                    <TableRow key={variant.id} className="bg-muted/30">
                      <TableCell></TableCell>
                      <TableCell>
                        <img
                          src={variant.image || product.image}
                          alt={variant.title}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      </TableCell>
                      <TableCell colSpan={2} className="text-sm">
                        <div>
                          <span className="font-medium">{variant.title}</span>
                          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-secondary">
                            {variant.caseType === 'snap' ? 'Snap Case' : 'Metal Case'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">{variant.description}</p>
                      </TableCell>
                      <TableCell>₹{variant.price}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        Stock: {variant.stock}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
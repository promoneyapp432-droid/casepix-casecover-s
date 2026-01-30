import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, Loader2, 
  Upload, FileSpreadsheet, Check, X, Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CompatibleGroupManager from '@/components/admin/CompatibleGroupManager';
import APlusContentEditor from '@/components/admin/APlusContentEditor';
import ModelsTableView from '@/components/admin/ModelsTableView';
import ExcelImportDialog from '@/components/admin/ExcelImportDialog';
import {
  useMobileBrands,
  useMobileModels,
  useAddBrand,
  useUpdateBrand,
  useDeleteBrand,
  useAddModel,
  useUpdateModel,
  useDeleteModel,
  MobileBrand,
  MobileModel,
} from '@/hooks/useMobileBrands';
import { useAuthContext } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminBrands = () => {
  const { user, isAdmin, loading: authLoading } = useAuthContext();
  const { data: brands, isLoading: brandsLoading } = useMobileBrands();
  const { data: models, isLoading: modelsLoading } = useMobileModels();
  
  const addBrandMutation = useAddBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand();
  const addModelMutation = useAddModel();
  const updateModelMutation = useUpdateModel();
  const deleteModelMutation = useDeleteModel();
  
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<MobileBrand | null>(null);
  const [editingModel, setEditingModel] = useState<MobileModel | null>(null);
  const [brandFormData, setBrandFormData] = useState({ name: '' });
  const [modelFormData, setModelFormData] = useState({ name: '', brand_id: '', image: '' });
  const [expandedBrands, setExpandedBrands] = useState<string[]>([]);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');

  const toggleBrand = (brandId: string) => {
    setExpandedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      await updateBrandMutation.mutateAsync({ id: editingBrand.id, data: brandFormData });
    } else {
      await addBrandMutation.mutateAsync(brandFormData);
    }
    setIsBrandDialogOpen(false);
    setEditingBrand(null);
    setBrandFormData({ name: '' });
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModel) {
      await updateModelMutation.mutateAsync({ id: editingModel.id, data: modelFormData });
    } else {
      await addModelMutation.mutateAsync(modelFormData);
    }
    setIsModelDialogOpen(false);
    setEditingModel(null);
    setModelFormData({ name: '', brand_id: '', image: '' });
  };

  const handleEditBrand = (brand: MobileBrand) => {
    setEditingBrand(brand);
    setBrandFormData({ name: brand.name });
    setIsBrandDialogOpen(true);
  };

  const handleEditModel = (model: MobileModel) => {
    setEditingModel(model);
    setModelFormData({ name: model.name, brand_id: model.brand_id, image: model.image || '' });
    setIsModelDialogOpen(true);
  };

  const handleDeleteBrand = async (id: string) => {
    if (confirm('This will also delete all models under this brand. Continue?')) {
      await deleteBrandMutation.mutateAsync(id);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      await deleteModelMutation.mutateAsync(id);
    }
  };

  const openNewBrandDialog = () => {
    setEditingBrand(null);
    setBrandFormData({ name: '' });
    setIsBrandDialogOpen(true);
  };

  const openNewModelDialog = (brandId?: string) => {
    setEditingModel(null);
    setModelFormData({ name: '', brand_id: brandId || '', image: '' });
    setIsModelDialogOpen(true);
  };

  const isLoading = brandsLoading || modelsLoading;

  // Show auth warning if not logged in as admin
  if (!authLoading && (!user || !isAdmin)) {
    return (
      <AdminLayout title="Manage Brands & Models">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            You must be logged in as an admin to manage brands and models. 
            Please <a href="/login" className="underline font-semibold">sign in</a> with admin credentials.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manage Brands & Models">
      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="models">Models Table</TabsTrigger>
          <TabsTrigger value="brands">Brands & Models</TabsTrigger>
          <TabsTrigger value="compatible">Compatible Groups</TabsTrigger>
          <TabsTrigger value="aplus">A+ Content</TabsTrigger>
        </TabsList>

        {/* Models Table Tab */}
        <TabsContent value="models" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-4 items-center justify-between"
          >
            <div className="flex gap-4 items-center">
              <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
              <Button className="gradient-primary" onClick={() => openNewModelDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </div>
          </motion.div>

          <ModelsTableView 
            brandId={selectedBrandFilter === 'all' ? undefined : selectedBrandFilter}
            brandName={selectedBrandFilter !== 'all' ? brands?.find(b => b.id === selectedBrandFilter)?.name : undefined}
            onEditModel={(model) => handleEditModel({ ...model, brand_id: model.brand.id })}
            onDeleteModel={handleDeleteModel}
          />
        </TabsContent>

        {/* Brands & Models Tab */}
        <TabsContent value="brands" className="space-y-6">
          {/* Header Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary" onClick={openNewBrandDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBrandSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={brandFormData.name}
                      onChange={(e) => setBrandFormData({ name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsBrandDialogOpen(false)}>
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
                      {editingBrand ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => openNewModelDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Model
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingModel ? 'Edit Model' : 'Add New Model'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleModelSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="modelBrand">Brand</Label>
                    <Select
                      value={modelFormData.brand_id}
                      onValueChange={(value) => setModelFormData({ ...modelFormData, brand_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands?.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="modelName">Model Name</Label>
                    <Input
                      id="modelName"
                      value={modelFormData.name}
                      onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="modelImage">Image URL</Label>
                    <Input
                      id="modelImage"
                      value={modelFormData.image}
                      onChange={(e) => setModelFormData({ ...modelFormData, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsModelDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="gradient-primary"
                      disabled={addModelMutation.isPending || updateModelMutation.isPending}
                    >
                      {(addModelMutation.isPending || updateModelMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingModel ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Brands List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : brands?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No brands added yet. Click "Add Brand" to get started.
              </div>
            ) : (
              brands?.map((brand) => {
                const brandModels = models?.filter(m => m.brand_id === brand.id) || [];
                const isExpanded = expandedBrands.includes(brand.id);

                return (
                  <Collapsible
                    key={brand.id}
                    open={isExpanded}
                    onOpenChange={() => toggleBrand(brand.id)}
                  >
                    <div className="rounded-xl border bg-card overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className="font-semibold">{brand.name}</span>
                            <span className="text-sm text-muted-foreground">
                              ({brandModels.length} models)
                            </span>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openNewModelDialog(brand.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Model
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditBrand(brand)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteBrand(brand.id)}
                              disabled={deleteBrandMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t">
                          {brandModels.length > 0 ? (
                            <div className="divide-y">
                              {brandModels.map((model) => (
                                <div
                                  key={model.id}
                                  className="flex items-center justify-between px-4 py-3 pl-12 hover:bg-secondary/30"
                                >
                                  <div className="flex items-center gap-3">
                                    {model.image ? (
                                      <img 
                                        src={model.image} 
                                        alt={model.name}
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span>{model.name}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditModel(model)}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteModel(model.id)}
                                      disabled={deleteModelMutation.isPending}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 pl-12 text-muted-foreground text-sm">
                              No models added yet
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })
            )}
          </motion.div>
        </TabsContent>

        {/* Compatible Groups Tab */}
        <TabsContent value="compatible">
          <CompatibleGroupManager />
        </TabsContent>

        {/* A+ Content Tab */}
        <TabsContent value="aplus">
          <APlusContentEditor />
        </TabsContent>
      </Tabs>

      {/* Excel Import Dialog */}
      <ExcelImportDialog 
        open={isImportDialogOpen} 
        onOpenChange={setIsImportDialogOpen}
        brands={brands || []}
      />
    </AdminLayout>
  );
};

export default AdminBrands;

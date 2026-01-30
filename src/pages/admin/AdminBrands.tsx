import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileSpreadsheet, Loader2, Image as ImageIcon } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import BrandsSidebar from '@/components/admin/BrandsSidebar';
import CompatibleGroupManager from '@/components/admin/CompatibleGroupManager';
import APlusContentEditor from '@/components/admin/APlusContentEditor';
import ModelsTableView from '@/components/admin/ModelsTableView';
import ExcelImportDialog from '@/components/admin/ExcelImportDialog';
import {
  useMobileBrands,
  useMobileModels,
  useAddModel,
  useUpdateModel,
  useDeleteModel,
  MobileModel,
} from '@/hooks/useMobileBrands';
import { useAuthContext } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminBrands = () => {
  const { user, isAdmin, loading: authLoading } = useAuthContext();
  const { data: brands, isLoading: brandsLoading } = useMobileBrands();
  const { data: models, isLoading: modelsLoading } = useMobileModels();
  
  const addModelMutation = useAddModel();
  const updateModelMutation = useUpdateModel();
  const deleteModelMutation = useDeleteModel();
  
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<MobileModel | null>(null);
  const [modelFormData, setModelFormData] = useState({ name: '', brand_id: '', image: '' });

  // Calculate model counts per brand
  const modelCounts = useMemo(() => {
    if (!models) return {};
    return models.reduce((acc, model) => {
      acc[model.brand_id] = (acc[model.brand_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [models]);

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

  const handleEditModel = (model: MobileModel & { brand: { id: string; name: string } }) => {
    setEditingModel(model);
    setModelFormData({ name: model.name, brand_id: model.brand.id, image: model.image || '' });
    setIsModelDialogOpen(true);
  };

  const handleDeleteModel = async (id: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      await deleteModelMutation.mutateAsync(id);
    }
  };

  const openNewModelDialog = () => {
    setEditingModel(null);
    setModelFormData({ 
      name: '', 
      brand_id: selectedBrandId || '', 
      image: '' 
    });
    setIsModelDialogOpen(true);
  };

  const isLoading = brandsLoading || modelsLoading;
  const selectedBrand = brands?.find(b => b.id === selectedBrandId);

  // Show auth warning if not logged in as admin
  if (!authLoading && (!user || !isAdmin)) {
    return (
      <AdminLayout title="All Models">
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
    <AdminLayout title="All Models">
      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="models">All Models</TabsTrigger>
          <TabsTrigger value="compatible">Compatible Groups</TabsTrigger>
          <TabsTrigger value="aplus">A+ Content</TabsTrigger>
        </TabsList>

        {/* All Models Tab with Sidebar */}
        <TabsContent value="models" className="space-y-0">
          <div className="flex h-[calc(100vh-280px)] min-h-[500px] rounded-xl border bg-background overflow-hidden">
            {/* Brands Sidebar */}
            <BrandsSidebar
              brands={brands || []}
              selectedBrandId={selectedBrandId}
              onSelectBrand={setSelectedBrandId}
              modelCounts={modelCounts}
              isLoading={brandsLoading}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between bg-card">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedBrand ? `${selectedBrand.name} Models` : 'All Models'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedBrandId 
                      ? `${modelCounts[selectedBrandId] || 0} models`
                      : `${models?.length || 0} total models`
                    }
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Import Excel
                  </Button>
                  <Button className="gradient-primary" onClick={openNewModelDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Model
                  </Button>
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <ModelsTableView 
                    brandId={selectedBrandId || undefined}
                    brandName={selectedBrand?.name}
                    onEditModel={(model) => handleEditModel(model)}
                    onDeleteModel={handleDeleteModel}
                  />
                )}
              </div>
            </div>
          </div>
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

      {/* Add/Edit Model Dialog */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
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
                placeholder="e.g., Galaxy S24 Ultra"
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
              {modelFormData.image && (
                <div className="mt-2">
                  <img 
                    src={modelFormData.image} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsModelDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="gradient-primary"
                disabled={addModelMutation.isPending || updateModelMutation.isPending || !modelFormData.brand_id}
              >
                {(addModelMutation.isPending || updateModelMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingModel ? 'Update' : 'Add Model'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        brands={brands || []}
        preselectedBrandId={selectedBrandId || undefined}
      />
    </AdminLayout>
  );
};

export default AdminBrands;

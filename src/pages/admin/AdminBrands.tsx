import { Palette, Smartphone, Package, FileText } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DesignsManager from '@/components/admin/DesignsManager';
import ModelsManager from '@/components/admin/ModelsManager';
import ProductsManager from '@/components/admin/ProductsManager';
import APlusContentEditor from '@/components/admin/APlusContentEditor';
import { useAuthContext } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminBrands = () => {
  const { user, isAdmin, loading: authLoading } = useAuthContext();

  if (!authLoading && (!user || !isAdmin)) {
    return (
      <AdminLayout title="Phone Case">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            You must be logged in as an admin to manage phone cases.
            Please <a href="/login" className="underline font-semibold">sign in</a> with admin credentials.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Phone Case">
      <Tabs defaultValue="designs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="designs" className="gap-2">
            <Palette className="w-4 h-4" />
            Designs
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="aplus" className="gap-2">
            <FileText className="w-4 h-4" />
            A+ Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="designs" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Manage Designs</h2>
            <p className="text-sm text-muted-foreground">
              Create categories, upload artwork images. Products auto-generate when templates exist.
            </p>
          </div>
          <DesignsManager />
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <ModelsManager />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">
              Auto-generated from designs × templates. Edit or manage existing products.
            </p>
          </div>
          <ProductsManager />
        </TabsContent>

        <TabsContent value="aplus">
          <APlusContentEditor />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminBrands;

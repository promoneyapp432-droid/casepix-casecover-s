import { motion } from 'framer-motion';
import { Package, Tags, ShoppingBag, Users, TrendingUp, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStore } from '@/context/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const { products, categories, orders, users, brands, models } = useStore();

  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'bg-primary/10 text-primary' },
    { label: 'Categories', value: categories.length, icon: Tags, color: 'bg-accent/10 text-accent' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'bg-green-500/10 text-green-500' },
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-purple-500/10 text-purple-500' },
    { label: 'Mobile Brands', value: brands.length, icon: TrendingUp, color: 'bg-orange-500/10 text-orange-500' },
    { label: 'Mobile Models', value: models.length, icon: TrendingUp, color: 'bg-cyan-500/10 text-cyan-500' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="gradient-primary text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Revenue</p>
                  <p className="text-4xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Orders Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold text-yellow-500">{pendingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Processing</span>
                    <span className="font-semibold text-blue-500">{processingOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivered</span>
                    <span className="font-semibold text-green-500">
                      {orders.filter(o => o.status === 'delivered').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.createdAt}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

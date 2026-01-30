import { motion } from 'framer-motion';
import { Package, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Order } from '@/types';

const AdminOrders = () => {
  const { orders, products, users, brands, models, updateOrderStatus } = useStore();

  const handleStatusChange = (orderId: string, status: Order['status']) => {
    updateOrderStatus(orderId, status);
    toast.success('Order status updated');
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown';
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

  const getModelName = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return 'Unknown';
    const brand = brands.find(b => b.id === model.brandId);
    return `${brand?.name || ''} ${model.name}`;
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminLayout title="Manage Orders">
      <div className="space-y-6">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
            <div key={status} className="rounded-xl border bg-card p-4">
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getStatusColor(status)}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
              <p className="text-2xl font-bold">{orders.filter(o => o.status === status).length}</p>
            </div>
          ))}
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-card overflow-x-auto"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{getUserName(order.userId)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          {getProductName(item.productId)} x{item.quantity}
                          <span className="text-muted-foreground ml-1">
                            ({getModelName(item.modelId)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>₹{order.totalAmount}</TableCell>
                  <TableCell className="text-muted-foreground">{order.createdAt}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;

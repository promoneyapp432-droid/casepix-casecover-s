import { motion } from 'framer-motion';
import { User, Mail, Shield } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStore } from '@/context/StoreContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AdminUsers = () => {
  const { users, orders } = useStore();

  const getUserOrderCount = (userId: string) => {
    return orders.filter(o => o.userId === userId).length;
  };

  const getUserTotalSpent = (userId: string) => {
    return orders
      .filter(o => o.userId === userId)
      .reduce((acc, o) => acc + o.totalAmount, 0);
  };

  return (
    <AdminLayout title="Manage Users">
      <div className="space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          <div className="rounded-xl border bg-card p-4">
            <p className="text-muted-foreground text-sm">Total Users</p>
            <p className="text-3xl font-bold mt-1">{users.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-muted-foreground text-sm">Admins</p>
            <p className="text-3xl font-bold mt-1">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-muted-foreground text-sm">Regular Users</p>
            <p className="text-3xl font-bold mt-1">
              {users.filter(u => u.role === 'user').length}
            </p>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-card"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className={user.role === 'admin' ? 'gradient-primary border-0' : ''}
                    >
                      {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{getUserOrderCount(user.id)}</TableCell>
                  <TableCell className="font-medium">
                    ₹{getUserTotalSpent(user.id).toLocaleString()}
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

export default AdminUsers;

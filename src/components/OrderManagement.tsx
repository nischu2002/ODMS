
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Eye, Edit, Trash2, Truck, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  assigned_staff_id?: string;
  assigned_rider_id?: string;
  order_items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

export const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });

  const { restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!restaurant?.id
  });

  // Fetch staff and riders for assignment
  const { data: staff = [] } = useQuery({
    queryKey: ['staff-riders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('restaurant_id', restaurant.id)
        .in('role', ['restaurant_staff', 'rider'])
        .eq('is_active', true);

      if (error) throw error;
      return data as Staff[];
    },
    enabled: !!restaurant?.id
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      if (!restaurant?.id) throw new Error('No restaurant selected');

      const totalAmount = orderData.items.reduce((sum: number, item: any) => 
        sum + (item.price * item.quantity), 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_address: orderData.customer_address,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map((item: any) => ({
        order_id: order.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Log analytics event
      await supabase.from('analytics_events').insert({
        restaurant_id: restaurant.id,
        event_type: 'order_created',
        event_data: { order_id: order.id, total_amount: totalAmount }
      });

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Order created successfully" });
      setShowCreateForm(false);
      setNewOrder({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        items: [{ name: '', quantity: 1, price: 0 }]
      });
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({ title: "Error creating order", variant: "destructive" });
    }
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, assignedStaffId, assignedRiderId }: any) => {
      const updateData: any = { status };
      if (assignedStaffId) updateData.assigned_staff_id = assignedStaffId;
      if (assignedRiderId) updateData.assigned_rider_id = assignedRiderId;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Log status change
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        new_status: status,
        changed_by: (await supabase.auth.getUser()).data.user?.id
      });

      // Log analytics event if order is completed
      if (status === 'delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          await supabase.from('analytics_events').insert({
            restaurant_id: restaurant?.id,
            event_type: 'order_completed',
            event_data: { order_id: orderId, total_amount: order.total_amount }
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Order updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast({ title: "Error updating order", variant: "destructive" });
    }
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Order deleted successfully" });
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
      toast({ title: "Error deleting order", variant: "destructive" });
    }
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_phone.includes(searchTerm) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = newOrder.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'picked_up': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Order
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders by customer name, phone, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Create Order Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
            <CardDescription>Add a new order to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              createOrderMutation.mutate(newOrder);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={newOrder.customer_name}
                    onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">Phone *</Label>
                  <Input
                    id="customer_phone"
                    value={newOrder.customer_phone}
                    onChange={(e) => setNewOrder({...newOrder, customer_phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer_address">Address *</Label>
                  <Input
                    id="customer_address"
                    value={newOrder.customer_address}
                    onChange={(e) => setNewOrder({...newOrder, customer_address: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Order Items</Label>
                {newOrder.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mt-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                    />
                    <Button type="button" variant="outline" onClick={addOrderItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>Manage and track all orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{order.order_items?.length || 0} items</TableCell>
                  <TableCell>${order.total_amount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        value={order.status}
                        onValueChange={(status) => updateOrderMutation.mutate({ orderId: order.id, status })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteOrderMutation.mutate(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No orders found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

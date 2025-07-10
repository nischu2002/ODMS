import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Eye, Edit, Trash2, Truck, Clock, DollarSign, CheckCircle, Minus, X } from 'lucide-react';
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
  kitchen_assigned_at?: string;
  rider_assigned_at?: string;
  order_items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
  photo_url?: string;
  image_url?: string;
  description?: string;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
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
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: ''
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

  // Fetch menu items for order creation
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items-for-orders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurant?.id && showCreateForm
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

  // Add item to order
  const addItemToOrder = (menuItem: MenuItem) => {
    const existingIndex = selectedItems.findIndex(item => item.menuItem.id === menuItem.id);
    
    if (existingIndex >= 0) {
      const updatedItems = [...selectedItems];
      updatedItems[existingIndex].quantity += 1;
      setSelectedItems(updatedItems);
    } else {
      setSelectedItems([...selectedItems, { menuItem, quantity: 1 }]);
    }
  };

  // Update item quantity
  const updateItemQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromOrder(menuItemId);
      return;
    }
    
    setSelectedItems(items => 
      items.map(item => 
        item.menuItem.id === menuItemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove item from order
  const removeItemFromOrder = (menuItemId: string) => {
    setSelectedItems(items => items.filter(item => item.menuItem.id !== menuItemId));
  };

  // Calculate total amount
  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  // Get menu items by category
  const getMenuItemsByCategory = () => {
    const categories: { [key: string]: MenuItem[] } = {};
    menuItems.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    });
    return categories;
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!restaurant?.id) throw new Error('No restaurant selected');
      if (selectedItems.length === 0) throw new Error('Please select at least one item');
      if (!customerData.name || !customerData.phone || !customerData.address) {
        throw new Error('Please fill in all customer details');
      }

      const totalAmount = calculateTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_name: customerData.name,
          customer_phone: customerData.phone,
          customer_address: customerData.address,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = selectedItems.map((item) => ({
        order_id: order.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price
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
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error creating order:', error);
      toast({ title: "Error creating order", description: error.message, variant: "destructive" });
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

  // Assign to kitchen mutation
  const assignToKitchenMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'preparing',
          kitchen_assigned_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Order assigned to kitchen" });
    },
    onError: (error) => {
      console.error('Error assigning to kitchen:', error);
      toast({ title: "Error assigning to kitchen", variant: "destructive" });
    }
  });

  // Assign rider mutation
  const assignRiderMutation = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_rider_id: riderId,
          rider_assigned_at: new Date().toISOString(),
          status: 'assigned'
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Rider assigned successfully" });
    },
    onError: (error) => {
      console.error('Error assigning rider:', error);
      toast({ title: "Error assigning rider", variant: "destructive" });
    }
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Payment status updated" });
    },
    onError: (error) => {
      console.error('Error updating payment status:', error);
      toast({ title: "Error updating payment status", variant: "destructive" });
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

  const resetForm = () => {
    setSelectedItems([]);
    setCustomerData({ name: '', phone: '', address: '' });
    setShowCreateForm(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_phone.includes(searchTerm) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const riders = staff.filter(s => s.role === 'rider');

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Menu Items Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Menu Items</CardTitle>
              <CardDescription>Click on items to add them to the order</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {Object.entries(getMenuItemsByCategory()).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h4 className="font-semibold text-lg mb-3">{category}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => addItemToOrder(item)}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {(item.photo_url || item.image_url) && (
                          <img 
                            src={item.photo_url || item.image_url} 
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                        <div className="font-semibold">Nrs. {item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && (
                <p className="text-center text-gray-500 py-8">No available menu items</p>
              )}
            </CardContent>
          </Card>

          {/* Order Summary and Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review selected items and add customer details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                createOrderMutation.mutate();
              }} className="space-y-4">
                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Customer Details</h4>
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone *</Label>
                    <Input
                      id="customer_phone"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_address">Address *</Label>
                    <Input
                      id="customer_address"
                      value={customerData.address}
                      onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Selected Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Selected Items ({selectedItems.length})</h4>
                  {selectedItems.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div key={item.menuItem.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium">{item.menuItem.name}</div>
                            <div className="text-sm text-gray-500">Nrs. {item.menuItem.price} each</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.menuItem.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.menuItem.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItemFromOrder(item.menuItem.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No items selected</p>
                  )}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>Nrs. {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createOrderMutation.isPending || selectedItems.length === 0}
                    className="flex-1"
                  >
                    {createOrderMutation.isPending ? 'Creating...' : 'Place Order'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
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
                  <TableCell>Nrs. {order.total_amount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.payment_status}
                      onValueChange={(status) => updatePaymentStatusMutation.mutate({ 
                        orderId: order.id, 
                        paymentStatus: status 
                      })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {!order.kitchen_assigned_at && order.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => assignToKitchenMutation.mutate(order.id)}
                          title="Assign to Kitchen"
                        >
                          Kitchen
                        </Button>
                      )}
                      
                      {!order.assigned_rider_id && riders.length > 0 && (
                        <Select
                          onValueChange={(riderId) => assignRiderMutation.mutate({ 
                            orderId: order.id, 
                            riderId 
                          })}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Rider" />
                          </SelectTrigger>
                          <SelectContent>
                            {riders.map(rider => (
                              <SelectItem key={rider.id} value={rider.id}>
                                {rider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Select
                        value={order.status}
                        onValueChange={(status) => updateOrderMutation.mutate({ orderId: order.id, status })}
                      >
                        <SelectTrigger className="w-24">
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

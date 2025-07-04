
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { ChefHat, Clock, DollarSign, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';
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
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  order_items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export const StaffDashboard = () => {
  const { restaurant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders for the restaurant
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['staff-orders', restaurant?.id],
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
    enabled: !!restaurant?.id,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          assigned_staff_id: user?.id 
        })
        .eq('id', orderId);

      if (error) throw error;

      // Log status change
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        new_status: newStatus,
        changed_by: user?.id
      });

      // Log analytics event
      if (newStatus === 'delivered') {
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
      queryClient.invalidateQueries({ queryKey: ['staff-orders', restaurant?.id] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
      toast({ title: "Error updating order status", variant: "destructive" });
    }
  });

  // Calculate metrics
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedToday = orders.filter(o => 
    o.status === 'delivered' && 
    new Date(o.created_at).toDateString() === new Date().toDateString()
  );

  const todayRevenue = completedToday.reduce((sum, order) => sum + Number(order.total_amount), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, newStatus });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome back! Manage orders and kitchen operations.
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Kitchen</CardTitle>
            <ChefHat className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preparingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Delivery</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyOrders.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting pickup</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{completedToday.length} orders completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Orders</CardTitle>
          <CardDescription>Orders that need immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <div>
                      <h3 className="font-medium">{order.customer_name}</h3>
                      <p className="text-sm text-gray-600">{order.customer_phone}</p>
                      <p className="text-sm text-gray-600">{order.order_items?.length || 0} items - ${order.total_amount}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60))} min ago
                  </Badge>
                  <Button 
                    size="sm" 
                    onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                    disabled={updateOrderMutation.isPending}
                  >
                    Confirm Order
                  </Button>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No pending orders</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Orders */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Manage and track all restaurant orders</CardDescription>
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
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 10).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.order_items?.length || 0} items</div>
                      <div className="text-sm text-gray-500">
                        {order.order_items?.slice(0, 2).map(item => item.name).join(', ')}
                        {(order.order_items?.length || 0) > 2 && '...'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${order.total_amount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(status) => handleStatusUpdate(order.id, status)}
                      disabled={updateOrderMutation.isPending}
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
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {orders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

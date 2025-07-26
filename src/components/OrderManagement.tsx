import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trash2, Eye, User, Bike } from 'lucide-react';
import { OrderDeletionDialog } from './OrderDeletionDialog';
import { useNotifications } from '../hooks/useNotifications';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  assignedStaffId?: string;
  assignedRiderId?: string;
  riderId?: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
}

export const OrderManagement = () => {
  const { user, restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{
    id: string;
    customerName: string;
    totalAmount: number;
  } | null>(null);
  
  const { createDeletionRequest, createRiderAssignmentNotification } = useNotifications();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          assigned_staff:users!orders_assigned_staff_id_fkey(name, email),
          assigned_rider:users!orders_assigned_rider_id_fkey(name, email)
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id,
    refetchInterval: 5000
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'restaurant_staff')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id
  });

  const { data: riders = [] } = useQuery({
    queryKey: ['riders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'rider')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Order updated successfully" });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({ title: "Error updating order", variant: "destructive" });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Order deleted successfully" });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({ title: "Error deleting order", variant: "destructive" });
    }
  });

  const assignRiderMutation = useMutation({
    mutationFn: async ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      const updates = {
        assigned_rider_id: riderId,
        rider_assigned_at: new Date().toISOString(),
        status: 'assigned'
      };

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select('*, assigned_rider:users!orders_assigned_rider_id_fkey(name)')
        .single();

      if (error) throw error;

      // Create notification for the rider
      const order = orders.find(o => o.id === orderId);
      if (order && data.assigned_rider) {
        const message = `New delivery assignment: Order from ${order.customer_name} (Nrs. ${order.total_amount})`;
        await createRiderAssignmentNotification.mutateAsync({
          orderId,
          riderId,
          message
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Rider assigned successfully" });
    },
    onError: (error) => {
      console.error('Assignment error:', error);
      toast({ title: "Error assigning rider", variant: "destructive" });
    }
  });

  const handleDeleteClick = (order: any) => {
    // Admin can delete directly, staff must request deletion
    if (user?.role === 'admin') {
      if (window.confirm(`Are you sure you want to delete the order for ${order.customer_name}?`)) {
        deleteOrderMutation.mutate(order.id);
      }
    } else {
      // Staff member - show deletion request dialog
      setOrderToDelete({
        id: order.id,
        customerName: order.customer_name,
        totalAmount: order.total_amount
      });
      setShowDeletionDialog(true);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({
      orderId,
      updates: { status: newStatus }
    });
  };

  const handleStaffAssignment = (orderId: string, staffId: string) => {
    const updates = {
      assigned_staff_id: staffId === 'unassign' ? null : staffId,
      kitchen_assigned_at: staffId === 'unassign' ? null : new Date().toISOString()
    };

    updateOrderMutation.mutate({ orderId, updates });
  };

  const handleRiderAssignment = (orderId: string, riderId: string) => {
    if (riderId === 'unassign') {
      updateOrderMutation.mutate({
        orderId,
        updates: {
          assigned_rider_id: null,
          rider_assigned_at: null
        }
      });
    } else {
      assignRiderMutation.mutate({ orderId, riderId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'assigned': return 'bg-indigo-100 text-indigo-800';
      case 'picked_up': return 'bg-cyan-100 text-cyan-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading orders...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>Manage and track all restaurant orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{order.customer_name}</h3>
                      <p className="text-sm text-gray-600">{order.customer_phone}</p>
                      <p className="text-sm text-gray-600">{order.customer_address}</p>
                      <p className="text-lg font-bold text-green-600">Nrs. {order.total_amount}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrderId(
                            selectedOrderId === order.id ? null : order.id
                          )}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(order)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger>
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
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Kitchen Staff
                      </label>
                      <Select 
                        value={order.assigned_staff_id || ''} 
                        onValueChange={(value) => handleStaffAssignment(order.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Assign staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassign">Unassign</SelectItem>
                          {staff.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {order.assigned_staff && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned: {order.assigned_staff.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Bike className="h-4 w-4" />
                        Delivery Rider
                      </label>
                      <Select 
                        value={order.assigned_rider_id || ''} 
                        onValueChange={(value) => handleRiderAssignment(order.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Assign rider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassign">Unassign</SelectItem>
                          {riders.map(rider => (
                            <SelectItem key={rider.id} value={rider.id}>
                              {rider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {order.assigned_rider && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned: {order.assigned_rider.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedOrderId === order.id && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Order Items:</h4>
                      <div className="space-y-2">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span>{item.name} x {item.quantity}</span>
                            <span className="font-medium">Nrs. {item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Created: {new Date(order.created_at).toLocaleString()}</p>
                        {order.kitchen_assigned_at && (
                          <p>Kitchen Assigned: {new Date(order.kitchen_assigned_at).toLocaleString()}</p>
                        )}
                        {order.rider_assigned_at && (
                          <p>Rider Assigned: {new Date(order.rider_assigned_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {orderToDelete && (
        <OrderDeletionDialog
          isOpen={showDeletionDialog}
          onClose={() => {
            setShowDeletionDialog(false);
            setOrderToDelete(null);
          }}
          orderId={orderToDelete.id}
          orderDetails={{
            customerName: orderToDelete.customerName,
            totalAmount: orderToDelete.totalAmount
          }}
        />
      )}
    </>
  );
};

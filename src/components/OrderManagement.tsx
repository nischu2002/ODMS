
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock, CheckCircle, Truck, User, Phone, MapPin } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  assigned_staff_id?: string;
  assigned_rider_id?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
  order_items?: OrderItem[];
}

interface Staff {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
}

interface Rider {
  id: string;
  name: string;
  is_active: boolean;
}

export const OrderManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });
  const { restaurant, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders for the restaurant
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            name,
            quantity,
            price
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!restaurant?.id
  });

  // Fetch staff for the restaurant
  const { data: staff = [] } = useQuery({
    queryKey: ['staff', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, is_active')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'restaurant_staff')
        .eq('is_active', true);

      if (error) throw error;
      return data as Staff[];
    },
    enabled: !!restaurant?.id
  });

  // Fetch riders for the restaurant
  const { data: riders = [] } = useQuery({
    queryKey: ['riders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, is_active')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'rider')
        .eq('is_active', true);

      if (error) throw error;
      return data as Rider[];
    },
    enabled: !!restaurant?.id
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      if (!restaurant?.id) throw new Error('Restaurant not found');

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          customer_address: orderData.customerAddress,
          total_amount: orderData.totalAmount,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map((item: OrderItem) => ({
        order_id: order.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Order created successfully" });
      setFormData({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        items: [{ name: '', quantity: 1, price: 0 }]
      });
      setShowAddForm(false);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({ title: "Error creating order", variant: "destructive" });
    }
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, assignedRiderId, assignedStaffId }: { 
      orderId: string; 
      status: Order['status']; 
      assignedRiderId?: string;
      assignedStaffId?: string;
    }) => {
      const updateData: any = { status };
      if (assignedRiderId) updateData.assigned_rider_id = assignedRiderId;
      if (assignedStaffId) updateData.assigned_staff_id = assignedStaffId;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast({ title: "Error updating order", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    createOrderMutation.mutate({
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      totalAmount,
      items: formData.items
    });
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status'], assignedRiderId?: string, assignedStaffId?: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus, assignedRiderId, assignedStaffId });
  };

  const assignToKitchen = (orderId: string) => {
    updateOrderStatus(orderId, 'preparing');
  };

  const markAsReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready');
  };

  const assignToRider = (orderId: string, riderId: string) => {
    updateOrderStatus(orderId, 'assigned', riderId);
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = formData.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, items: updatedItems });
  };

  const removeOrderItem = (index: number) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: updatedItems });
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'picked_up': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-200 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableRiders = riders.filter(r => r.is_active);
  const kitchenStaff = staff.filter(s => s.is_active);

  if (ordersLoading) {
    return <div className="flex items-center justify-center p-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerAddress">Delivery Address</Label>
                  <Input
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Order Items</Label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeOrderItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOrderItem}>
                  Add Item
                </Button>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Orders ({orders.length})</CardTitle>
          <CardDescription>Manage current orders and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Order #{order.id.slice(-6)}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {order.customer_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {order.customer_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {order.customer_address}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${order.total_amount.toFixed(2)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Order Items:</h4>
                    <ul className="space-y-1 text-sm">
                      {order.order_items?.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Actions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => assignToKitchen(order.id)}
                          className="flex items-center gap-1"
                          disabled={updateOrderMutation.isPending}
                        >
                          <Clock className="h-4 w-4" />
                          Assign to Kitchen
                        </Button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => markAsReady(order.id)}
                          className="flex items-center gap-1"
                          disabled={updateOrderMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Ready
                        </Button>
                      )}
                      
                      {(order.status === 'ready' || order.status === 'confirmed') && availableRiders.length > 0 && (
                        <div className="flex gap-2">
                          <select
                            onChange={(e) => assignToRider(order.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                            defaultValue=""
                            disabled={updateOrderMutation.isPending}
                          >
                            <option value="">Assign Rider</option>
                            {availableRiders.map((rider) => (
                              <option key={rider.id} value={rider.id}>
                                {rider.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {order.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                          className="flex items-center gap-1"
                          disabled={updateOrderMutation.isPending}
                        >
                          <Truck className="h-4 w-4" />
                          Mark Picked Up
                        </Button>
                      )}
                      
                      {order.status === 'picked_up' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="flex items-center gap-1"
                          disabled={updateOrderMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                    
                    {order.assigned_rider_id && (
                      <p className="text-sm text-gray-600">
                        Assigned to: {riders.find(r => r.id === order.assigned_rider_id)?.name || 'Unknown Rider'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

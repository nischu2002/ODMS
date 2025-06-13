
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, ChefHat, Truck, Clock, DollarSign } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { Order, OrderItem } from '../types';

export const StaffDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [{ id: 'temp-1', name: '', quantity: 1, price: 0 }] as OrderItem[]
  });
  const { restaurant, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (restaurant) {
      loadOrders();
    }
  }, [restaurant]);

  const loadOrders = async () => {
    if (!restaurant) return;
    
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: Order[] = ordersData?.map(order => ({
        id: order.id,
        restaurantId: order.restaurant_id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerAddress: order.customer_address,
        totalAmount: order.total_amount,
        status: order.status as Order['status'],
        paymentStatus: order.payment_status as Order['paymentStatus'],
        assignedStaffId: order.assigned_staff_id || undefined,
        assignedRiderId: order.assigned_rider_id || undefined,
        createdAt: order.created_at,
        estimatedDeliveryTime: order.estimated_delivery_time || undefined,
        items: (order.order_items as any[])?.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })) || []
      })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({ 
        title: "Error loading orders", 
        description: "Failed to load orders",
        variant: "destructive" 
      });
    }
  };

  const createOrder = async () => {
    if (!restaurant || !user) return;

    try {
      const totalAmount = newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          customer_address: newOrder.customerAddress,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = newOrder.items.map(item => ({
        order_id: orderData.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Reset form
      setNewOrder({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        items: [{ id: 'temp-1', name: '', quantity: 1, price: 0 }]
      });
      setShowNewOrder(false);
      
      // Reload orders
      await loadOrders();
      
      toast({ title: "Order created successfully" });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({ 
        title: "Error creating order", 
        description: "Failed to create order",
        variant: "destructive" 
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      toast({ title: `Order ${newStatus}` });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({ 
        title: "Error updating order", 
        description: "Failed to update order status",
        variant: "destructive" 
      });
    }
  };

  const assignToKitchen = (orderId: string) => {
    updateOrderStatus(orderId, 'confirmed');
  };

  const assignRider = async (orderId: string, riderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          assigned_rider_id: riderId,
          status: 'assigned'
        })
        .eq('id', orderId);

      if (error) throw error;

      await loadOrders();
      toast({ title: "Rider assigned successfully" });
    } catch (error) {
      console.error('Error assigning rider:', error);
      toast({ 
        title: "Error assigning rider", 
        description: "Failed to assign rider",
        variant: "destructive" 
      });
    }
  };

  const addOrderItem = () => {
    const newItemId = `temp-${Date.now()}`;
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { id: newItemId, name: '', quantity: 1, price: 0 }]
    });
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = newOrder.items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <Button onClick={() => setShowNewOrder(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Need kitchen assignment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Kitchen</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{preparingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Being prepared</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyOrders.length}</div>
            <p className="text-xs text-muted-foreground">Need rider assignment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* New Order Form */}
      {showNewOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={newOrder.customerPhone}
                    onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input
                    id="customerAddress"
                    value={newOrder.customerAddress}
                    onChange={(e) => setNewOrder({...newOrder, customerAddress: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Order Items</Label>
                {newOrder.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-4 gap-2 mt-2">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateOrderItem(index, 'name', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                    <Button type="button" variant="outline" onClick={addOrderItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createOrder}>Create Order</Button>
                <Button variant="outline" onClick={() => setShowNewOrder(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Manage order status and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.slice(0, 10).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{order.id}</h3>
                  <p className="text-sm text-gray-600">{order.customerName} - {order.customerPhone}</p>
                  <p className="text-sm text-gray-600">{order.items.length} items - ${order.totalAmount}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                    order.status === 'ready' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {order.status === 'pending' && (
                    <Button size="sm" onClick={() => assignToKitchen(order.id)}>
                      Send to Kitchen
                    </Button>
                  )}
                  {order.status === 'confirmed' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button size="sm" onClick={() => updateOrderStatus(order.id, 'assigned')}>
                      Assign Rider
                    </Button>
                  )}
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

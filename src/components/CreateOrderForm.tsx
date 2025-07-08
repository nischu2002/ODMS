import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from './ui/badge';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  is_available: boolean;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

export const CreateOrderForm = () => {
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch menu items
  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu-items', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('category');

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!restaurant?.id
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  // Filter items by category
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      customer_name: string;
      customer_phone: string;
      customer_address: string;
      total_amount: number;
      items: OrderItem[];
    }) => {
      if (!restaurant?.id) throw new Error('No restaurant selected');

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_address: orderData.customer_address,
          total_amount: orderData.total_amount,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderData.items.map(item => ({
        order_id: order.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Log order creation
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        new_status: 'pending',
        notes: 'Order created by staff'
      });

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Order created successfully" });
      
      // Reset form
      setCustomer({ name: '', phone: '', address: '' });
      setOrderItems([]);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({ title: "Error creating order", variant: "destructive" });
    }
  });

  const addToOrder = (item: MenuItem) => {
    const existingItem = orderItems.find(orderItem => orderItem.menu_item_id === item.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(orderItem =>
        orderItem.menu_item_id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setOrderItems([...orderItems, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (menu_item_id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item.menu_item_id !== menu_item_id));
    } else {
      setOrderItems(orderItems.map(item =>
        item.menu_item_id === menu_item_id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer.name || !customer.phone || !customer.address) {
      toast({ title: "Please fill in all customer details", variant: "destructive" });
      return;
    }
    
    if (orderItems.length === 0) {
      toast({ title: "Please add items to the order", variant: "destructive" });
      return;
    }

    createOrderMutation.mutate({
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_address: customer.address,
      total_amount: getTotalAmount(),
      items: orderItems
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create New Order</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Enter customer details for the order</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Phone Number *</Label>
                <Input
                  id="customer_phone"
                  value={customer.phone}
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_address">Delivery Address *</Label>
                <Textarea
                  id="customer_address"
                  value={customer.address}
                  onChange={(e) => setCustomer({...customer, address: e.target.value})}
                  required
                  rows={3}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review and confirm order details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderItems.length > 0 ? (
                <>
                  {orderItems.map((item) => (
                    <div key={item.menu_item_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">${item.price.toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="mx-2 font-medium">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total: ${getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={createOrderMutation.isPending}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {createOrderMutation.isPending ? 'Creating Order...' : 'Create Order'}
                  </Button>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">No items added to order</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>Select items to add to the order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2">
              <Label htmlFor="category">Category:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{item.name}</h3>
                        <Badge variant="secondary">{item.category}</Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">${item.price.toFixed(2)}</span>
                        <Button 
                          size="sm" 
                          onClick={() => addToOrder(item)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
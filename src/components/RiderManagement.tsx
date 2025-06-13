
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Truck, MapPin } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { DeliveryRider } from '../types';

export const RiderManagement = () => {
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRider, setEditingRider] = useState<DeliveryRider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const { restaurant } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (restaurant) {
      loadRiders();
    }
  }, [restaurant]);

  const loadRiders = async () => {
    if (!restaurant) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'rider');

      if (error) throw error;

      const formattedRiders: DeliveryRider[] = data?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        restaurantId: user.restaurant_id!,
        isActive: user.is_active,
        isOnline: false, // This would come from a separate status tracking
        totalDeliveries: 0, // This would be calculated from orders
        rating: 5.0
      })) || [];

      setRiders(formattedRiders);
    } catch (error) {
      console.error('Error loading riders:', error);
      toast({ 
        title: "Error loading riders", 
        description: "Failed to load delivery riders",
        variant: "destructive" 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant) return;

    // Validate passwords match for new riders
    if (!editingRider && formData.password !== formData.confirmPassword) {
      toast({ 
        title: "Password mismatch", 
        description: "Passwords do not match",
        variant: "destructive" 
      });
      return;
    }

    if (!editingRider && formData.password.length < 6) {
      toast({ 
        title: "Password too short", 
        description: "Password must be at least 6 characters",
        variant: "destructive" 
      });
      return;
    }

    try {
      if (editingRider) {
        // Update existing rider
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null
          })
          .eq('id', editingRider.id);

        if (error) throw error;

        toast({ title: "Rider updated successfully" });
        setEditingRider(null);
      } else {
        // Create new rider
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/rider-dashboard`
          }
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('Failed to create user account');
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            restaurant_id: restaurant.id,
            email: formData.email,
            name: formData.name,
            role: 'rider',
            phone: formData.phone || null
          });

        if (profileError) throw profileError;

        toast({ title: "Rider added successfully" });
      }
      
      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      setShowAddForm(false);
      await loadRiders();
    } catch (error: any) {
      console.error('Error managing rider:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to manage rider",
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (rider: DeliveryRider) => {
    setEditingRider(rider);
    setFormData({
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      password: '',
      confirmPassword: ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (riderId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', riderId);

      if (error) throw error;
      
      await loadRiders();
      toast({ title: "Rider deactivated" });
    } catch (error) {
      console.error('Error deleting rider:', error);
      toast({ 
        title: "Error", 
        description: "Failed to deactivate rider",
        variant: "destructive" 
      });
    }
  };

  const toggleStatus = async (riderId: string) => {
    try {
      const rider = riders.find(r => r.id === riderId);
      if (!rider) return;

      const { error } = await supabase
        .from('users')
        .update({ is_active: !rider.isActive })
        .eq('id', riderId);

      if (error) throw error;
      
      await loadRiders();
      toast({ title: "Rider status updated" });
    } catch (error) {
      console.error('Error updating rider status:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update rider status",
        variant: "destructive" 
      });
    }
  };

  const toggleOnlineStatus = (riderId: string) => {
    const updatedRiders = riders.map(r => 
      r.id === riderId ? { ...r, isOnline: !r.isOnline } : r
    );
    setRiders(updatedRiders);
    toast({ title: "Rider online status updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Delivery Riders</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Rider
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRider ? 'Edit Rider' : 'Add New Rider'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={!!editingRider}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                {!editingRider && (
                  <>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingRider ? 'Update' : 'Add'} Rider
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRider(null);
                    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
                  }}
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
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Active Riders ({riders.filter(r => r.isActive).length})
          </CardTitle>
          <CardDescription>Manage your delivery riders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riders.map((rider) => (
              <div key={rider.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{rider.name}</h3>
                  <p className="text-sm text-gray-600">{rider.email}</p>
                  <p className="text-sm text-gray-600">{rider.phone}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rider.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rider.isOnline ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rider.isOnline ? 'Online' : 'Offline'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      {rider.totalDeliveries} deliveries
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleOnlineStatus(rider.id)}
                    disabled={!rider.isActive}
                  >
                    <MapPin className="h-4 w-4" />
                    {rider.isOnline ? 'Set Offline' : 'Set Online'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStatus(rider.id)}
                  >
                    {rider.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(rider)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(rider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {riders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No riders added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

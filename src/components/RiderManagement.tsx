
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Truck, User, Mail, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
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

interface Rider {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const RiderManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'bike'
  });
  const { restaurant, createRiderAccount } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch riders for the restaurant
  const { data: riders = [], isLoading } = useQuery({
    queryKey: ['restaurant-riders', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'rider')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Rider[];
    },
    enabled: !!restaurant?.id
  });

  // Create rider mutation
  const createRiderMutation = useMutation({
    mutationFn: async (riderData: any) => {
      const result = await createRiderAccount(riderData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create rider account');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-riders', restaurant?.id] });
      toast({ title: "Rider added successfully", description: "Login credentials have been created." });
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error creating rider:', error);
      toast({ title: "Error adding rider", description: error.message, variant: "destructive" });
    }
  });

  // Update rider mutation
  const updateRiderMutation = useMutation({
    mutationFn: async ({ id, ...riderData }: any) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: riderData.name,
          email: riderData.email,
          phone: riderData.phone
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-riders', restaurant?.id] });
      toast({ title: "Rider updated successfully" });
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating rider:', error);
      toast({ title: "Error updating rider", variant: "destructive" });
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-riders', restaurant?.id] });
      toast({ title: "Rider status updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating rider status:', error);
      toast({ title: "Error updating rider status", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', vehicleType: 'bike' });
    setShowAddForm(false);
    setEditingRider(null);
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRider) {
      updateRiderMutation.mutate({ ...editingRider, ...formData });
    } else {
      // Validate password for new rider
      if (!formData.password || formData.password.length < 6) {
        toast({
          title: "Password Required",
          description: "Password must be at least 6 characters long.",
          variant: "destructive"
        });
        return;
      }
      createRiderMutation.mutate(formData);
    }
  };

  const handleEdit = (rider: Rider) => {
    setEditingRider(rider);
    setFormData({
      name: rider.name,
      email: rider.email,
      phone: rider.phone || '',
      password: '', // Don't prefill password
      vehicleType: 'bike'
    });
    setShowAddForm(true);
  };

  const handleToggleActive = (rider: Rider) => {
    toggleActiveMutation.mutate({ id: rider.id, is_active: rider.is_active });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading riders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Delivery Riders Management</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Rider
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRider ? 'Edit Rider' : 'Add New Rider'}</CardTitle>
            <CardDescription>
              {editingRider ? 'Update rider information' : 'Create a new rider account with login credentials'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  <select
                    id="vehicleType"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="bike">Bike</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                    <option value="scooter">Scooter</option>
                  </select>
                </div>
              </div>

              {!editingRider && (
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {!editingRider && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Note:</strong> The rider will receive login credentials and can use them to access the delivery system.
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createRiderMutation.isPending || updateRiderMutation.isPending}
                >
                  {createRiderMutation.isPending || updateRiderMutation.isPending 
                    ? 'Saving...' 
                    : editingRider ? 'Update Rider' : 'Create Rider Account'
                  }
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Delivery Riders ({riders.length})</CardTitle>
          <CardDescription>Manage your delivery riders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riders.map((rider) => (
                <TableRow key={rider.id}>
                  <TableCell className="font-medium">{rider.name}</TableCell>
                  <TableCell>{rider.email}</TableCell>
                  <TableCell>{rider.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rider.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rider.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rider)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={rider.is_active ? "destructive" : "default"}
                        onClick={() => handleToggleActive(rider)}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {rider.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {riders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No riders yet. Add your first rider to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Truck, MapPin, UserCheck, UserX, Trash2 } from 'lucide-react';
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

interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const RiderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRider, setNewRider] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const { restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch riders
  const { data: riders = [], isLoading } = useQuery({
    queryKey: ['riders', restaurant?.id],
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

  // Create rider mutation - Fixed authentication issue
  const createRiderMutation = useMutation({
    mutationFn: async (riderData: typeof newRider) => {
      if (!restaurant?.id) throw new Error('No restaurant selected');

      // First, create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: riderData.email,
        password: riderData.password,
        options: {
          data: {
            name: riderData.name,
            role: 'rider'
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Then insert the user data into our users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: riderData.name,
          email: riderData.email,
          phone: riderData.phone,
          role: 'rider',
          restaurant_id: restaurant.id,
          is_active: true
        });

      if (userError) {
        console.error('User table error:', userError);
        // If user table insert fails, we should clean up the auth user
        // Note: In production, you might want to handle this differently
        throw new Error(`Failed to create user profile: ${userError.message}`);
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders', restaurant?.id] });
      toast({ title: "Rider created successfully" });
      setShowCreateForm(false);
      setNewRider({
        name: '',
        email: '',
        phone: '',
        password: ''
      });
      // Don't redirect - stay on admin page
    },
    onError: (error: any) => {
      console.error('Error creating rider:', error);
      toast({ 
        title: "Error creating rider", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  // Update rider mutation
  const updateRiderMutation = useMutation({
    mutationFn: async ({ riderId, updates }: { riderId: string; updates: Partial<Rider> }) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', riderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders', restaurant?.id] });
      toast({ title: "Rider updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating rider:', error);
      toast({ title: "Error updating rider", variant: "destructive" });
    }
  });

  // Delete rider mutation
  const deleteRiderMutation = useMutation({
    mutationFn: async (riderId: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', riderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders', restaurant?.id] });
      toast({ title: "Rider deleted successfully" });
    },
    onError: (error) => {
      console.error('Error deleting rider:', error);
      toast({ title: "Error deleting rider", variant: "destructive" });
    }
  });

  const filteredRiders = riders.filter(rider => 
    rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRiderStatus = (riderId: string, currentStatus: boolean) => {
    updateRiderMutation.mutate({
      riderId,
      updates: { is_active: !currentStatus }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading riders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Rider Management</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Rider
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search riders by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Rider Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Rider</CardTitle>
            <CardDescription>Create a new delivery rider account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newRider.name || !newRider.email || !newRider.phone || !newRider.password) {
                toast({ title: "Please fill in all fields", variant: "destructive" });
                return;
              }
              createRiderMutation.mutate(newRider);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newRider.name}
                    onChange={(e) => setNewRider({...newRider, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newRider.email}
                    onChange={(e) => setNewRider({...newRider, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={newRider.phone}
                    onChange={(e) => setNewRider({...newRider, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newRider.password}
                    onChange={(e) => setNewRider({...newRider, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={createRiderMutation.isPending}>
                  {createRiderMutation.isPending ? 'Creating...' : 'Create Rider'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Riders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Riders ({filteredRiders.length})</CardTitle>
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
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiders.map((rider) => (
                <TableRow key={rider.id}>
                  <TableCell className="font-medium">{rider.name}</TableCell>
                  <TableCell>{rider.email}</TableCell>
                  <TableCell>{rider.phone}</TableCell>
                  <TableCell>
                    <Badge className={rider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {rider.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(rider.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRiderStatus(rider.id, rider.is_active)}
                      >
                        {rider.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this rider?')) {
                            deleteRiderMutation.mutate(rider.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRiders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No riders found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

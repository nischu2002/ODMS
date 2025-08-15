import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Check, X, Edit, Trash2, RotateCcw } from 'lucide-react';

interface RestaurantRequest {
  id: string;
  restaurant_name: string;
  business_type: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  domain: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface Restaurant {
  id: string;
  name: string;
  domain: string;
  address: string;
  phone: string;
  email: string;
  admin_id: string;
  business_type?: string;
  is_active: boolean;
}

export const RestaurantRequestsManager = () => {
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch restaurant requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['restaurant-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RestaurantRequest[];
    }
  });

  // Fetch existing restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Restaurant[];
    }
  });

  // Approve restaurant mutation
  const approveRestaurantMutation = useMutation({
    mutationFn: async (request: RestaurantRequest) => {
      const { data, error } = await supabase.functions.invoke('approve-restaurant', {
        body: {
          requestId: request.id,
          requestData: request
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-requests'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast({ 
        title: "Restaurant approved successfully",
        description: `Login credentials - Email: ${data.restaurant?.email}, Password: ${data.defaultPassword}`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error approving restaurant", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Reject restaurant mutation
  const rejectRestaurantMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('restaurant_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-requests'] });
      toast({ title: "Restaurant request rejected" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error rejecting request", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update restaurant mutation
  const updateRestaurantMutation = useMutation({
    mutationFn: async (updates: Partial<Restaurant> & { id: string }) => {
      const { data, error } = await supabase.functions.invoke('approve-restaurant', {
        body: {
          action: 'update_restaurant',
          restaurantId: updates.id,
          updates
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast({ title: "Restaurant updated successfully" });
      setEditingRestaurant(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating restaurant", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete restaurant mutation
  const deleteRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      const { data, error } = await supabase.functions.invoke('approve-restaurant', {
        body: {
          action: 'delete_restaurant',
          restaurantId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast({ title: "Restaurant deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting restaurant", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ adminId, newPassword }: { adminId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('approve-restaurant', {
        body: {
          action: 'reset_password',
          updates: {
            admin_id: adminId,
            new_password: newPassword
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Password reset successfully" });
      setShowPasswordDialog(false);
      setNewPassword('');
      setSelectedAdminId('');
    },
    onError: (error: any) => {
      toast({ 
        title: "Error resetting password", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleApprove = (request: RestaurantRequest) => {
    approveRestaurantMutation.mutate(request);
  };

  const handleReject = (requestId: string) => {
    rejectRestaurantMutation.mutate(requestId);
  };

  const handleUpdateRestaurant = (updates: Partial<Restaurant>) => {
    if (editingRestaurant) {
      updateRestaurantMutation.mutate({ ...updates, id: editingRestaurant.id });
    }
  };

  const handleDeleteRestaurant = (restaurantId: string) => {
    if (confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      deleteRestaurantMutation.mutate(restaurantId);
    }
  };

  const handleResetPassword = () => {
    if (selectedAdminId && newPassword) {
      resetPasswordMutation.mutate({ adminId: selectedAdminId, newPassword });
    }
  };

  if (requestsLoading || restaurantsLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Restaurant Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Requests ({requests.length})</CardTitle>
          <CardDescription>Manage pending restaurant registration requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.restaurant_name}</TableCell>
                  <TableCell>{request.owner_name}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{request.domain}</TableCell>
                  <TableCell>
                    <Badge className={
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={approveRestaurantMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                          disabled={rejectRestaurantMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {requests.length === 0 && (
            <p className="text-center text-gray-500 py-8">No restaurant requests found</p>
          )}
        </CardContent>
      </Card>

      {/* Existing Restaurants Management */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Restaurants ({restaurants.length})</CardTitle>
          <CardDescription>Manage existing restaurants and their settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell className="font-medium">{restaurant.name}</TableCell>
                  <TableCell>{restaurant.domain}</TableCell>
                  <TableCell>{restaurant.email}</TableCell>
                  <TableCell>{restaurant.phone}</TableCell>
                  <TableCell>
                    <Badge className={restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {restaurant.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRestaurant(restaurant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAdminId(restaurant.admin_id);
                          setShowPasswordDialog(true);
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {restaurants.length === 0 && (
            <p className="text-center text-gray-500 py-8">No restaurants found</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Restaurant Dialog */}
      {editingRestaurant && (
        <Dialog open={true} onOpenChange={() => setEditingRestaurant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Restaurant</DialogTitle>
              <DialogDescription>Update restaurant information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  value={editingRestaurant.name}
                  onChange={(e) => setEditingRestaurant({...editingRestaurant, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={editingRestaurant.domain}
                  onChange={(e) => setEditingRestaurant({...editingRestaurant, domain: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editingRestaurant.email}
                  onChange={(e) => setEditingRestaurant({...editingRestaurant, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingRestaurant.phone}
                  onChange={(e) => setEditingRestaurant({...editingRestaurant, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editingRestaurant.address}
                  onChange={(e) => setEditingRestaurant({...editingRestaurant, address: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleUpdateRestaurant(editingRestaurant)}>
                  Update Restaurant
                </Button>
                <Button variant="outline" onClick={() => setEditingRestaurant(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Admin Password</DialogTitle>
            <DialogDescription>Enter a new password for the restaurant admin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleResetPassword} disabled={!newPassword}>
                Reset Password
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

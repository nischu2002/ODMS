
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Edit, Trash2, Key } from 'lucide-react';

interface RestaurantRequest {
  id: string;
  restaurant_name: string;
  business_type: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  domain: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  notes?: string;
}

interface Restaurant {
  id: string;
  name: string;
  domain: string;
  email: string;
  phone: string;
  address: string;
  business_type: string;
  admin_id: string;
  is_active: boolean;
  created_at: string;
}

const RestaurantRequestsManager = () => {
  const [requests, setRequests] = useState<RestaurantRequest[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RestaurantRequest | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('restaurant_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch approved restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantsError) throw restaurantsError;

      setRequests(requestsData || []);
      setRestaurants(restaurantsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: RestaurantRequest) => {
    try {
      const response = await fetch(`https://dpbpaonsyfodtteebszv.supabase.co/functions/v1/approve-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwYnBhb25zeWZvZHR0ZWVic3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjEwNTEsImV4cCI6MjA2NTM5NzA1MX0.4h1ephRvY981xVUQfQx8GFz_G50KN68XFf8EnM_VgUo'}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          requestData: request
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Restaurant approved successfully! Login credentials: Email: ${result.loginCredentials.email}, Password: ${result.loginCredentials.password}, Domain: ${result.loginCredentials.domain}`);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to approve restaurant');
      }
    } catch (error) {
      console.error('Error approving restaurant:', error);
      toast.error('Failed to approve restaurant');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Restaurant request rejected');
      fetchData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleUpdateRestaurant = async () => {
    if (!selectedRestaurant) return;

    try {
      const response = await fetch(`https://dpbpaonsyfodtteebszv.supabase.co/functions/v1/approve-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwYnBhb25zeWZvZHR0ZWVic3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjEwNTEsImV4cCI6MjA2NTM5NzA1MX0.4h1ephRvY981xVUQfQx8GFz_G50KN68XFf8EnM_VgUo'}`,
        },
        body: JSON.stringify({
          action: 'update_restaurant',
          restaurantId: selectedRestaurant.id,
          updates: editData
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Restaurant updated successfully');
        setEditMode(false);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to update restaurant');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('Failed to update restaurant');
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!confirm('Are you sure? This will delete the restaurant and ALL related data (users, orders, etc.)')) {
      return;
    }

    try {
      const response = await fetch(`https://dpbpaonsyfodtteebszv.supabase.co/functions/v1/approve-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwYnBhb25zeWZvZHR0ZWVic3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjEwNTEsImV4cCI6MjA2NTM5NzA1MX0.4h1ephRvY981xVUQfQx8GFz_G50KN68XFf8EnM_VgUo'}`,
        },
        body: JSON.stringify({
          action: 'delete_restaurant',
          restaurantId: restaurantId
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Restaurant and all related data deleted successfully');
        fetchData();
      } else {
        toast.error(result.error || 'Failed to delete restaurant');
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Failed to delete restaurant');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedRestaurant || !newPassword) return;

    try {
      const response = await fetch(`https://dpbpaonsyfodtteebszv.supabase.co/functions/v1/approve-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwYnBhb25zeWZvZHR0ZWVic3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjEwNTEsImV4cCI6MjA2NTM5NzA1MX0.4h1ephRvY981xVUQfQx8GFz_G50KN68XFf8EnM_VgUo'}`,
        },
        body: JSON.stringify({
          action: 'reset_password',
          updates: {
            admin_id: selectedRestaurant.admin_id,
            new_password: newPassword
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Password reset successfully');
        setShowPasswordDialog(false);
        setNewPassword('');
      } else {
        toast.error(result.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Restaurant Management</h1>
      
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Restaurant Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.filter(r => r.status === 'pending').map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{request.restaurant_name}</h3>
                  <p className="text-sm text-gray-600">{request.owner_name} - {request.email}</p>
                  <p className="text-sm text-gray-500">{request.business_type} - {request.domain}</p>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Restaurant Request Details</DialogTitle>
                      </DialogHeader>
                      {selectedRequest && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Restaurant Name</Label>
                              <p className="font-medium">{selectedRequest.restaurant_name}</p>
                            </div>
                            <div>
                              <Label>Business Type</Label>
                              <p className="font-medium">{selectedRequest.business_type}</p>
                            </div>
                            <div>
                              <Label>Owner Name</Label>
                              <p className="font-medium">{selectedRequest.owner_name}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="font-medium">{selectedRequest.email}</p>
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <p className="font-medium">{selectedRequest.phone}</p>
                            </div>
                            <div>
                              <Label>Domain</Label>
                              <p className="font-medium">{selectedRequest.domain}</p>
                            </div>
                          </div>
                          <div>
                            <Label>Address</Label>
                            <p className="font-medium">{selectedRequest.address}</p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(request)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleReject(request.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            
            {requests.filter(r => r.status === 'pending').length === 0 && (
              <p className="text-gray-500 text-center py-8">No pending requests</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approved Restaurants */}
      <Card>
        <CardHeader>
          <CardTitle>Approved Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{restaurant.name}</h3>
                  <p className="text-sm text-gray-600">{restaurant.email} - {restaurant.phone}</p>
                  <p className="text-sm text-gray-500">{restaurant.business_type} - {restaurant.domain}</p>
                  <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                    {restaurant.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedRestaurant(restaurant);
                          setEditData(restaurant);
                          setEditMode(false);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Manage Restaurant</DialogTitle>
                      </DialogHeader>
                      {selectedRestaurant && (
                        <div className="space-y-4">
                          {!editMode ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Restaurant Name</Label>
                                  <p className="font-medium">{selectedRestaurant.name}</p>
                                </div>
                                <div>
                                  <Label>Business Type</Label>
                                  <p className="font-medium">{selectedRestaurant.business_type}</p>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <p className="font-medium">{selectedRestaurant.email}</p>
                                </div>
                                <div>
                                  <Label>Phone</Label>
                                  <p className="font-medium">{selectedRestaurant.phone}</p>
                                </div>
                                <div>
                                  <Label>Domain</Label>
                                  <p className="font-medium">{selectedRestaurant.domain}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Badge variant={selectedRestaurant.is_active ? "default" : "secondary"}>
                                    {selectedRestaurant.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <Label>Address</Label>
                                <p className="font-medium">{selectedRestaurant.address}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => setEditMode(true)}>
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit Details
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => setShowPasswordDialog(true)}
                                >
                                  <Key className="w-4 h-4 mr-1" />
                                  Reset Password
                                </Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleDeleteRestaurant(selectedRestaurant.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Restaurant Name</Label>
                                  <Input
                                    value={editData.name || ''}
                                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Business Type</Label>
                                  <Select 
                                    value={editData.business_type || ''} 
                                    onValueChange={(value) => setEditData({...editData, business_type: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Restaurant">Restaurant</SelectItem>
                                      <SelectItem value="Fast Food">Fast Food</SelectItem>
                                      <SelectItem value="Cafe">Cafe</SelectItem>
                                      <SelectItem value="Bakery">Bakery</SelectItem>
                                      <SelectItem value="Food Truck">Food Truck</SelectItem>
                                      <SelectItem value="Bar">Bar</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <Input
                                    value={editData.email || ''}
                                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Phone</Label>
                                  <Input
                                    value={editData.phone || ''}
                                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Domain</Label>
                                  <Input
                                    value={editData.domain || ''}
                                    onChange={(e) => setEditData({...editData, domain: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Select 
                                    value={editData.is_active ? 'active' : 'inactive'} 
                                    onValueChange={(value) => setEditData({...editData, is_active: value === 'active'})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <Label>Address</Label>
                                <Textarea
                                  value={editData.address || ''}
                                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleUpdateRestaurant}>
                                  Save Changes
                                </Button>
                                <Button variant="outline" onClick={() => setEditMode(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
            
            {restaurants.length === 0 && (
              <p className="text-gray-500 text-center py-8">No approved restaurants</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Admin Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
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

export default RestaurantRequestsManager;


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Edit, Trash2, Building, Eye, Mail, Phone, MapPin, Calendar, User, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface RestaurantRequest {
  id: string;
  restaurant_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  business_type: string;
  domain: string;
  password: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface RestaurantRequestsManagerProps {
  onClose: () => void;
}

const RestaurantRequestsManager = ({ onClose }: RestaurantRequestsManagerProps) => {
  const [selectedRequest, setSelectedRequest] = useState<RestaurantRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<RestaurantRequest>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch restaurant requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['restaurant-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      })) as RestaurantRequest[];
    }
  });

  // Approve restaurant mutation
  const approveMutation = useMutation({
    mutationFn: async (request: RestaurantRequest) => {
      const { data, error } = await supabase.functions.invoke('approve-restaurant', {
        body: {
          requestId: request.id,
          requestData: {
            restaurant_name: request.restaurant_name,
            owner_name: request.owner_name,
            email: request.email,
            phone: request.phone,
            address: request.address,
            domain: request.domain,
            business_type: request.business_type,
            password: request.password
          }
        }
      });

      if (error) {
        console.error('Error calling approve-restaurant function:', error);
        throw new Error(error.message || 'Failed to approve restaurant');
      }

      return data;
    },
    onSuccess: (data, request) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-requests'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast({ 
        title: "Restaurant approved successfully",
        description: `Admin login: ${request.email} / Password: ${request.password}`
      });
    },
    onError: (error) => {
      console.error('Error approving restaurant:', error);
      toast({ title: "Error approving restaurant", variant: "destructive" });
    }
  });

  // Reject restaurant mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-requests'] });
      toast({ title: "Restaurant request rejected" });
    },
    onError: (error) => {
      console.error('Error rejecting restaurant:', error);
      toast({ title: "Error rejecting restaurant", variant: "destructive" });
    }
  });

  // Delete request mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-requests'] });
      toast({ title: "Restaurant request deleted" });
    },
    onError: (error) => {
      console.error('Error deleting restaurant request:', error);
      toast({ title: "Error deleting restaurant request", variant: "destructive" });
    }
  });

  // Update request mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<RestaurantRequest> & { id: string }) => {
      const { error } = await supabase
        .from('restaurant_requests')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-requests'] });
      toast({ title: "Restaurant request updated successfully" });
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setEditFormData({});
    },
    onError: (error) => {
      console.error('Error updating restaurant request:', error);
      toast({ title: "Error updating restaurant request", variant: "destructive" });
    }
  });

  const handleView = (request: RestaurantRequest) => {
    setSelectedRequest(request);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleEdit = (request: RestaurantRequest) => {
    setSelectedRequest(request);
    setEditFormData(request);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this restaurant request?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleApprove = (request: RestaurantRequest) => {
    if (window.confirm(`Are you sure you want to approve ${request.restaurant_name}?`)) {
      approveMutation.mutate(request);
    }
  };

  const handleReject = (id: string) => {
    if (window.confirm('Are you sure you want to reject this restaurant request?')) {
      rejectMutation.mutate(id);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest) {
      updateMutation.mutate({ id: selectedRequest.id, ...editFormData });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Requests</h1>
        </div>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Applications ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{request.restaurant_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{request.owner_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{request.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{request.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{request.address}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Building className="h-4 w-4" />
                          <span>{request.business_type}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mb-4">
                          <div className="flex items-center space-x-2 text-gray-600 mb-1">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">Notes:</span>
                          </div>
                          <p className="text-gray-700 text-sm pl-6">{request.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(request)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(request)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(request.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={rejectMutation.isPending}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No restaurant requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? 'Restaurant Request Details' : 'Edit Restaurant Request'}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? 'View restaurant application details' : 'Update restaurant request information'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {isViewMode ? (
                // View Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Restaurant Name</Label>
                      <p className="text-gray-900">{selectedRequest.restaurant_name}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Owner Name</Label>
                      <p className="text-gray-900">{selectedRequest.owner_name}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Email</Label>
                      <p className="text-gray-900">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Phone</Label>
                      <p className="text-gray-900">{selectedRequest.phone}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Business Type</Label>
                      <p className="text-gray-900">{selectedRequest.business_type}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Domain</Label>
                      <p className="text-gray-900">{selectedRequest.domain}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="font-medium">Address</Label>
                    <p className="text-gray-900">{selectedRequest.address}</p>
                  </div>
                  {selectedRequest.notes && (
                    <div>
                      <Label className="font-medium">Notes</Label>
                      <p className="text-gray-900">{selectedRequest.notes}</p>
                    </div>
                  )}
                  <div>
                    <Label className="font-medium">Status</Label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="restaurant_name">Restaurant Name *</Label>
                      <Input
                        id="restaurant_name"
                        value={editFormData.restaurant_name || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, restaurant_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="owner_name">Owner Name *</Label>
                      <Input
                        id="owner_name"
                        value={editFormData.owner_name || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={editFormData.phone || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="business_type">Business Type *</Label>
                      <Input
                        id="business_type"
                        value={editFormData.business_type || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, business_type: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="domain">Domain *</Label>
                      <Input
                        id="domain"
                        value={editFormData.domain || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, domain: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={editFormData.address || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={editFormData.password || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={editFormData.status || 'pending'}
                      onValueChange={(value: 'pending' | 'approved' | 'rejected') => 
                        setEditFormData(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Update Request
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantRequestsManager;

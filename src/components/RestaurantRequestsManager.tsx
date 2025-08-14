import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
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
  Check, 
  X, 
  Clock, 
  Store, 
  Mail, 
  Phone,
  MapPin,
  User,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

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

export const RestaurantRequestsManager = () => {
  const [selectedRequest, setSelectedRequest] = useState<RestaurantRequest | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch restaurant requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['restaurant-requests'],
    queryFn: async (): Promise<RestaurantRequest[]> => {
      try {
        const { data, error } = await supabase
          .from('restaurant_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        return (data || []) as RestaurantRequest[];
      } catch (error) {
        console.error('Error fetching restaurant requests:', error);
        return [] as RestaurantRequest[];
      }
    }
  });

  // Approve/Reject request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const { data: requestData, error: fetchError } = await supabase
        .from('restaurant_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (status === 'approved') {
        // Create the restaurant and admin user via edge function
        const { data, error } = await supabase.functions.invoke('approve-restaurant', {
          body: { requestId: id, requestData }
        });

        if (error) throw error;
        return data;
      } else {
        // Just update the status for rejection
        const { error } = await supabase
          .from('restaurant_requests')
          .update({ status, notes, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-requests'] });
      toast({ 
        title: `Request ${variables.status === 'approved' ? 'approved' : 'rejected'} successfully`,
        description: variables.status === 'approved' ? 'Restaurant has been created and admin account set up.' : undefined
      });
    },
    onError: (error) => {
      console.error('Error updating request:', error);
      toast({ title: "Error updating request", variant: "destructive" });
    }
  });

  const handleApprove = (id: string) => {
    updateRequestMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateRequestMutation.mutate({ id, status: 'rejected' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-3 w-3" />;
      case 'rejected': return <X className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Restaurant Requests</h2>
        <div className="text-sm text-gray-600">
          {pendingRequests.length} pending requests
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.restaurant_name}</div>
                        <div className="text-sm text-gray-500">{request.business_type}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.owner_name}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {request.email}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {request.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {request.domain}.odms.com
                      </code>
                    </TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Restaurant Request Details</DialogTitle>
                              <DialogDescription>
                                Review the restaurant application details
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Restaurant Name</label>
                                  <p>{request.restaurant_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Business Type</label>
                                  <p>{request.business_type}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Owner Name</label>
                                  <p>{request.owner_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <p>{request.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Phone</label>
                                  <p>{request.phone}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Domain</label>
                                  <p>{request.domain}.odms.com</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Address</label>
                                <p>{request.address}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(request.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.restaurant_name}</div>
                      <div className="text-sm text-gray-500">{request.business_type}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{request.owner_name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from './ui/badge';

interface Notification {
  id: string;
  order_id: string;
  staff_id: string;
  notification_type: string;
  status: string;
  message: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
}

export const NotificationCenter = () => {
  const { restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          users:staff_id (
            name,
            email
          )
        `)
        .eq('admin_id', restaurant.admin_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!restaurant?.id,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Approve deletion request
  const approveDeletionMutation = useMutation({
    mutationFn: async ({ notificationId, orderId }: { notificationId: string; orderId: string }) => {
      // Delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Update notification status
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({ status: 'approved' })
        .eq('id', notificationId);

      if (notificationError) throw notificationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', restaurant?.id] });
      queryClient.invalidateQueries({ queryKey: ['orders', restaurant?.id] });
      toast({ title: "Order deletion approved and completed" });
    },
    onError: (error) => {
      console.error('Error approving deletion:', error);
      toast({ title: "Error approving deletion", variant: "destructive" });
    }
  });

  // Reject deletion request
  const rejectDeletionMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'rejected' })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', restaurant?.id] });
      toast({ title: "Deletion request rejected" });
    },
    onError: (error) => {
      console.error('Error rejecting deletion:', error);
      toast({ title: "Error rejecting deletion", variant: "destructive" });
    }
  });

  // Dismiss notification
  const dismissNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', restaurant?.id] });
      toast({ title: "Notification dismissed" });
    },
    onError: (error) => {
      console.error('Error dismissing notification:', error);
      toast({ title: "Error dismissing notification", variant: "destructive" });
    }
  });

  const pendingNotifications = notifications.filter(n => n.status === 'pending');

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading notifications...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Admin Notifications
          {pendingNotifications.length > 0 && (
            <Badge variant="destructive">{pendingNotifications.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Staff requests and system notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border rounded-lg ${
                  notification.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={
                        notification.status === 'pending' ? 'default' :
                        notification.status === 'approved' ? 'secondary' :
                        'destructive'
                      }>
                        {notification.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2">{notification.message}</p>
                    
                    {notification.users && (
                      <p className="text-xs text-gray-500">
                        From: {notification.users.name} ({notification.users.email})
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {notification.status === 'pending' && notification.notification_type === 'order_deletion_request' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveDeletionMutation.mutate({
                            notificationId: notification.id,
                            orderId: notification.order_id
                          })}
                          disabled={approveDeletionMutation.isPending}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectDeletionMutation.mutate(notification.id)}
                          disabled={rejectDeletionMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissNotificationMutation.mutate(notification.id)}
                      disabled={dismissNotificationMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No notifications</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

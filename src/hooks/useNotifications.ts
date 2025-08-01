import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from './use-toast';
import { useEffect, useRef } from 'react';
import { Notification } from '../types';

export const useNotifications = () => {
  const { user, restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', restaurant?.id, user?.id],
    queryFn: async () => {
      if (!restaurant?.id || !user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          order_id,
          staff_id,
          admin_id,
          rider_id,
          notification_type,
          status,
          message,
          created_at,
          updated_at,
          orders(customer_name, total_amount)
        `)
        .or(`admin_id.eq.${user.id},staff_id.eq.${user.id},rider_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      if (!data) return [];

      // Get user details for each notification separately
      const notificationsWithUsers = await Promise.all(
        data.map(async (notification) => {
          let userData = null;
          
          // Determine which user to fetch based on the notification type
          let userId = null;
          if (notification.staff_id) userId = notification.staff_id;
          else if (notification.rider_id) userId = notification.rider_id;
          else if (notification.admin_id) userId = notification.admin_id;

          if (userId) {
            const { data: userResponse, error: userError } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', userId)
              .single();
            
            if (!userError && userResponse) {
              userData = userResponse;
            }
          }

          return {
            ...notification,
            users: userData
          } as Notification;
        })
      );

      return notificationsWithUsers;
    },
    enabled: !!restaurant?.id && !!user?.id,
    refetchInterval: 10000 // Increased to 10 seconds to reduce load
  });

  // Set up real-time subscription with proper cleanup
  useEffect(() => {
    if (!restaurant?.id || !user?.id) return;

    // Clean up existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create new channel with unique name
    const channelName = `notifications-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Notification change:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newNotification = payload.new as any;
            if (newNotification.rider_id === user.id && newNotification.notification_type === 'order_assignment') {
              toast({
                title: "New Order Assignment",
                description: newNotification.message,
                duration: 5000
              });
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [restaurant?.id, user?.id, queryClient, toast]);

  // Create order deletion request
  const createDeletionRequest = useMutation({
    mutationFn: async ({ orderId, message }: { orderId: string; message: string }) => {
      if (!user?.id || !restaurant?.id) throw new Error('User not authenticated');

      // Get admin_id for the restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('admin_id')
        .eq('id', restaurant.id)
        .single();

      if (restaurantError) throw restaurantError;

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          order_id: orderId,
          staff_id: user.id,
          admin_id: restaurantData.admin_id,
          notification_type: 'order_deletion_request',
          message: message,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: "Deletion request sent to admin" });
    },
    onError: (error) => {
      console.error('Error creating deletion request:', error);
      toast({ title: "Error sending deletion request", variant: "destructive" });
    }
  });

  // Approve deletion request
  const approveDeletionRequest = useMutation({
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
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (notificationError) throw notificationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Order deletion approved" });
    },
    onError: (error) => {
      console.error('Error approving deletion:', error);
      toast({ title: "Error approving deletion", variant: "destructive" });
    }
  });

  // Reject deletion request
  const rejectDeletionRequest = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: "Deletion request rejected" });
    },
    onError: (error) => {
      console.error('Error rejecting deletion:', error);
      toast({ title: "Error rejecting deletion", variant: "destructive" });
    }
  });

  // Create rider assignment notification
  const createRiderAssignmentNotification = useMutation({
    mutationFn: async ({ orderId, riderId, message }: { orderId: string; riderId: string; message: string }) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          order_id: orderId,
          rider_id: riderId,
          admin_id: user?.id,
          notification_type: 'order_assignment',
          message: message,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Approve rider assignment
  const approveRiderAssignment = useMutation({
    mutationFn: async ({ notificationId, orderId }: { notificationId: string; orderId: string }) => {
      // Update order status to confirmed
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Update notification status
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (notificationError) throw notificationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Assignment accepted" });
    },
    onError: (error) => {
      console.error('Error accepting assignment:', error);
      toast({ title: "Error accepting assignment", variant: "destructive" });
    }
  });

  // Reject rider assignment
  const rejectRiderAssignment = useMutation({
    mutationFn: async ({ notificationId, orderId }: { notificationId: string; orderId: string }) => {
      // Remove rider assignment from order
      const { error: orderError } = await supabase
        .from('orders')
        .update({ assigned_rider_id: null, rider_assigned_at: null })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Update notification status
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (notificationError) throw notificationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Assignment rejected" });
    },
    onError: (error) => {
      console.error('Error rejecting assignment:', error);
      toast({ title: "Error rejecting assignment", variant: "destructive" });
    }
  });

  // Dismiss notification
  const dismissNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'dismissed', updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const pendingNotifications = notifications.filter(n => n.status === 'pending');

  return {
    notifications,
    pendingNotifications,
    isLoading,
    createDeletionRequest,
    approveDeletionRequest,
    rejectDeletionRequest,
    createRiderAssignmentNotification,
    approveRiderAssignment,
    rejectRiderAssignment,
    dismissNotification
  };
};

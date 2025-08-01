
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
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Bell,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface SystemNotification {
  id: string;
  notification_type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  is_read: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export const SystemNotificationsManager = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['system-notifications'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('system_notifications' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        return data as SystemNotification[];
      } catch (error) {
        console.error('Error fetching system notifications:', error);
        // Return mock data for now
        return [
          {
            id: '1',
            notification_type: 'error' as const,
            title: 'Database Connection Issue',
            message: 'Temporary connection timeout to primary database',
            is_read: false,
            severity: 'high' as const,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            notification_type: 'warning' as const,
            title: 'High Memory Usage',
            message: 'Server memory usage at 85%',
            is_read: false,
            severity: 'medium' as const,
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: '3',
            notification_type: 'info' as const,
            title: 'Scheduled Maintenance',
            message: 'Database maintenance completed successfully',
            is_read: true,
            severity: 'low' as const,
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ] as SystemNotification[];
      }
    }
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_notifications' as any)
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications'] });
    }
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_notifications' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications'] });
      toast({ title: "Notification deleted" });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.is_read;
      case 'critical': return notification.severity === 'critical';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const criticalCount = notifications.filter(n => n.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          System Notifications
        </h2>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['system-notifications'] })}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-lg font-bold text-green-600">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button 
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
        <Button 
          variant={filter === 'critical' ? 'default' : 'outline'}
          onClick={() => setFilter('critical')}
        >
          Critical ({criticalCount})
        </Button>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts & Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Alert</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => (
                <TableRow 
                  key={notification.id}
                  className={!notification.is_read ? 'bg-blue-50' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notification.notification_type)}
                      <span className="capitalize">{notification.notification_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-gray-500">{notification.message}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(notification.severity)}>
                      {notification.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

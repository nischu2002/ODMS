
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationCenter = () => {
  const { user } = useAuth();
  const {
    notifications,
    pendingNotifications,
    isLoading,
    approveDeletionRequest,
    rejectDeletionRequest,
    dismissNotification
  } = useNotifications();

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading notifications...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {user?.role === 'admin' ? 'Admin Notifications' : 'Notifications'}
          {pendingNotifications.length > 0 && (
            <Badge variant="destructive">{pendingNotifications.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {user?.role === 'admin' 
            ? 'Staff requests and system notifications' 
            : 'Order assignments and updates'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border rounded-lg ${
                  notification.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 
                  notification.status === 'approved' ? 'border-green-200 bg-green-50' :
                  'border-gray-200'
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

                    {notification.orders && (
                      <p className="text-xs text-gray-500">
                        Customer: {notification.orders.customer_name} | Amount: Nrs. {notification.orders.total_amount}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {notification.status === 'pending' && (
                      <>
                        {notification.notification_type === 'order_deletion_request' && user?.role === 'admin' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveDeletionRequest.mutate({
                                notificationId: notification.id,
                                orderId: notification.order_id
                              })}
                              disabled={approveDeletionRequest.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectDeletionRequest.mutate(notification.id)}
                              disabled={rejectDeletionRequest.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissNotification.mutate(notification.id)}
                      disabled={dismissNotification.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No notifications</p>
              <p className="text-sm text-gray-400">
                You'll see notifications here when they arrive
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

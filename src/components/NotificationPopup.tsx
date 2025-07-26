
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, Check, X, Clock } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationPopup = () => {
  const { 
    pendingNotifications, 
    approveRiderAssignment, 
    rejectRiderAssignment,
    dismissNotification 
  } = useNotifications();

  // Filter for order assignment notifications that are pending
  const assignmentNotifications = pendingNotifications.filter(
    n => n.notification_type === 'order_assignment'
  );

  if (assignmentNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {assignmentNotifications.map((notification) => (
        <Card key={notification.id} className="border-blue-200 bg-blue-50 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-blue-600" />
              New Order Assignment
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                Pending
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              <Clock className="h-3 w-3 inline mr-1" />
              {new Date(notification.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm mb-3">{notification.message}</p>
            {notification.orders && (
              <div className="text-xs text-gray-600 mb-3">
                Customer: {notification.orders.customer_name}<br/>
                Amount: Nrs. {notification.orders.total_amount}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approveRiderAssignment.mutate({
                  notificationId: notification.id,
                  orderId: notification.order_id
                })}
                disabled={approveRiderAssignment.isPending}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
              >
                <Check className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectRiderAssignment.mutate({
                  notificationId: notification.id,
                  orderId: notification.order_id
                })}
                disabled={rejectRiderAssignment.isPending}
                className="text-red-600 hover:text-red-700 border-red-200 text-xs px-2 py-1 h-7"
              >
                <X className="h-3 w-3 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissNotification.mutate(notification.id)}
                disabled={dismissNotification.isPending}
                className="text-gray-600 hover:text-gray-700 text-xs px-2 py-1 h-7"
              >
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

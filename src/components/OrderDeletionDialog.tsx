
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useNotifications } from '../hooks/useNotifications';

interface OrderDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderDetails: {
    customerName: string;
    totalAmount: number;
  };
}

export const OrderDeletionDialog = ({
  isOpen,
  onClose,
  orderId,
  orderDetails
}: OrderDeletionDialogProps) => {
  const [reason, setReason] = useState('');
  const { createDeletionRequest } = useNotifications();

  const handleSubmit = () => {
    if (!reason.trim()) return;

    const message = `Order deletion request for ${orderDetails.customerName} (NPR ${orderDetails.totalAmount}). Reason: ${reason}`;
    
    createDeletionRequest.mutate(
      { orderId, message },
      {
        onSuccess: () => {
          setReason('');
          onClose();
        }
      }
    );
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Order Deletion</DialogTitle>
          <DialogDescription>
            You are requesting to delete the order for {orderDetails.customerName} 
            (NPR {orderDetails.totalAmount}). This request will be sent to the restaurant admin for approval.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for deletion</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for why this order should be deleted..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason.trim() || createDeletionRequest.isPending}
          >
            {createDeletionRequest.isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

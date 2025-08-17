
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Banknote, Check, Clock, DollarSign } from 'lucide-react';

export const CashCollection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);

  const { data: cashCollections = [], isLoading } = useQuery({
    queryKey: ['cash-collections', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('cash_collections')
        .select(`
          *,
          orders!inner(
            id,
            customer_name,
            customer_phone,
            total_amount,
            payment_mode
          )
        `)
        .eq('rider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && user?.role === 'rider'
  });

  const { data: codOrders = [] } = useQuery({
    queryKey: ['cod-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('assigned_rider_id', user.id)
        .eq('payment_mode', 'cod')
        .eq('payment_status', 'pending')
        .in('status', ['picked_up', 'delivered'])
        .is('collected_amount', null);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && user?.role === 'rider'
  });

  const recordCollectionMutation = useMutation({
    mutationFn: async ({ orderId, amount, notes }: { orderId: string; amount: number; notes?: string }) => {
      // First, create the cash collection record
      const { data: collection, error: collectionError } = await supabase
        .from('cash_collections')
        .insert({
          rider_id: user!.id,
          order_id: orderId,
          amount,
          notes,
          status: 'collected'
        })
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Then update the order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          collected_amount: amount,
          collected_by: user!.id,
          collected_at: new Date().toISOString(),
          payment_status: 'paid'
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-collections'] });
      queryClient.invalidateQueries({ queryKey: ['cod-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Cash collection recorded successfully" });
      setShowCollectionDialog(false);
      setSelectedOrder(null);
      setCollectionAmount('');
      setNotes('');
    },
    onError: (error) => {
      console.error('Collection error:', error);
      toast({ title: "Error recording cash collection", variant: "destructive" });
    }
  });

  const submitCollectionMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from('cash_collections')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', collectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-collections'] });
      toast({ title: "Cash collection submitted successfully" });
    },
    onError: (error) => {
      console.error('Submit error:', error);
      toast({ title: "Error submitting cash collection", variant: "destructive" });
    }
  });

  const handleRecordCollection = () => {
    if (!selectedOrder || !collectionAmount) return;

    const amount = parseFloat(collectionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    recordCollectionMutation.mutate({
      orderId: selectedOrder.id,
      amount,
      notes
    });
  };

  const getTotalCollected = () => {
    return cashCollections
      .filter(c => c.status === 'collected')
      .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);
  };

  const getTotalSubmitted = () => {
    return cashCollections
      .filter(c => c.status === 'submitted')
      .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading cash collections...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash to Collect</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {codOrders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0)}</div>
            <p className="text-xs text-muted-foreground">{codOrders.length} pending COD orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {getTotalCollected()}</div>
            <p className="text-xs text-muted-foreground">Not submitted yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Submitted</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NPR {getTotalSubmitted()}</div>
            <p className="text-xs text-muted-foreground">Submitted to restaurant</p>
          </CardContent>
        </Card>
      </div>

      {/* COD Orders to Collect */}
      {codOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders with Cash to Collect</CardTitle>
            <CardDescription>Record cash collection for delivered COD orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {codOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{order.customer_name}</h4>
                    <p className="text-sm text-gray-600">{order.customer_phone}</p>
                    <p className="text-lg font-bold text-green-600">NPR {order.total_amount}</p>
                  </div>
                  <Dialog open={showCollectionDialog && selectedOrder?.id === order.id} onOpenChange={setShowCollectionDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Record Collection
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Cash Collection</DialogTitle>
                        <DialogDescription>
                          Record the cash collected from {order.customer_name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Amount Collected (NPR)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={collectionAmount}
                            onChange={(e) => setCollectionAmount(e.target.value)}
                            placeholder="Enter amount collected"
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional notes..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleRecordCollection}
                          disabled={recordCollectionMutation.isPending}
                        >
                          {recordCollectionMutation.isPending ? 'Recording...' : 'Record Collection'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash Collection History */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Collection History</CardTitle>
          <CardDescription>View all your cash collection records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cashCollections.length > 0 ? (
              cashCollections.map((collection) => (
                <div key={collection.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{collection.orders.customer_name}</h4>
                    <p className="text-sm text-gray-600">
                      Collected: {new Date(collection.collected_at).toLocaleString()}
                    </p>
                    <p className="text-lg font-bold">NPR {collection.amount}</p>
                    {collection.notes && (
                      <p className="text-sm text-gray-500 mt-1">{collection.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={collection.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {collection.status.toUpperCase()}
                    </Badge>
                    {collection.status === 'collected' && (
                      <Button
                        size="sm"
                        onClick={() => submitCollectionMutation.mutate(collection.id)}
                        disabled={submitCollectionMutation.isPending}
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No cash collections recorded yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Truck, MapPin } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { DeliveryRider } from '../types';

export const RiderManagement = () => {
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRider, setEditingRider] = useState<DeliveryRider | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const { restaurant } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadRiders();
  }, [restaurant]);

  const loadRiders = () => {
    if (!restaurant) return;
    
    const existingRiders = localStorage.getItem(`riders_${restaurant.id}`);
    if (existingRiders) {
      setRiders(JSON.parse(existingRiders));
    }
  };

  const saveRiders = (ridersList: DeliveryRider[]) => {
    if (!restaurant) return;
    localStorage.setItem(`riders_${restaurant.id}`, JSON.stringify(ridersList));
    setRiders(ridersList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant) return;

    if (editingRider) {
      const updatedRiders = riders.map(r => 
        r.id === editingRider.id 
          ? { ...editingRider, ...formData }
          : r
      );
      saveRiders(updatedRiders);
      toast({ title: "Rider updated successfully" });
      setEditingRider(null);
    } else {
      const newRider: DeliveryRider = {
        id: 'rider-' + Date.now(),
        ...formData,
        restaurantId: restaurant.id,
        isActive: true,
        isOnline: false,
        totalDeliveries: 0,
        rating: 5.0
      };
      saveRiders([...riders, newRider]);
      toast({ title: "Rider added successfully" });
    }
    
    setFormData({ name: '', email: '', phone: '' });
    setShowAddForm(false);
  };

  const handleEdit = (rider: DeliveryRider) => {
    setEditingRider(rider);
    setFormData({
      name: rider.name,
      email: rider.email,
      phone: rider.phone
    });
    setShowAddForm(true);
  };

  const handleDelete = (riderId: string) => {
    const updatedRiders = riders.filter(r => r.id !== riderId);
    saveRiders(updatedRiders);
    toast({ title: "Rider removed" });
  };

  const toggleStatus = (riderId: string) => {
    const updatedRiders = riders.map(r => 
      r.id === riderId ? { ...r, isActive: !r.isActive } : r
    );
    saveRiders(updatedRiders);
    toast({ title: "Rider status updated" });
  };

  const toggleOnlineStatus = (riderId: string) => {
    const updatedRiders = riders.map(r => 
      r.id === riderId ? { ...r, isOnline: !r.isOnline } : r
    );
    saveRiders(updatedRiders);
    toast({ title: "Rider online status updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Delivery Riders</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Rider
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRider ? 'Edit Rider' : 'Add New Rider'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingRider ? 'Update' : 'Add'} Rider
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRider(null);
                    setFormData({ name: '', email: '', phone: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Active Riders ({riders.filter(r => r.isActive).length})
          </CardTitle>
          <CardDescription>Manage your delivery riders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riders.map((rider) => (
              <div key={rider.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{rider.name}</h3>
                  <p className="text-sm text-gray-600">{rider.email}</p>
                  <p className="text-sm text-gray-600">{rider.phone}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rider.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rider.isOnline ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rider.isOnline ? 'Online' : 'Offline'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      {rider.totalDeliveries} deliveries
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleOnlineStatus(rider.id)}
                    disabled={!rider.isActive}
                  >
                    <MapPin className="h-4 w-4" />
                    {rider.isOnline ? 'Set Offline' : 'Set Online'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStatus(rider.id)}
                  >
                    {rider.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(rider)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(rider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {riders.length === 0 && (
              <p className="text-center text-gray-500 py-8">No riders added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

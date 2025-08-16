import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Plus } from 'lucide-react';

interface NewRestaurantData {
  name: string;
  domain: string;
  address: string;
  phone: string;
  email: string;
  businessType: string;
  ownerName: string;
  adminPassword: string;
}

export const RestaurantCRUD = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState<NewRestaurantData>({
    name: '',
    domain: '',
    address: '',
    phone: '',
    email: '',
    businessType: '',
    ownerName: '',
    adminPassword: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const businessTypes = [
    'Fast Food',
    'Fine Dining',
    'Casual Dining',
    'Cafe/Coffee Shop',
    'Bakery',
    'Pizza',
    'Asian Cuisine',
    'Italian Cuisine',
    'Mexican Cuisine',
    'Indian Cuisine',
    'Desserts/Ice Cream',
    'Healthy/Organic',
    'Other'
  ];

  const generateDomain = (restaurantName: string) => {
    return restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Create restaurant mutation
  const createRestaurantMutation = useMutation({
    mutationFn: async (restaurantData: NewRestaurantData) => {
      const { data, error } = await supabase.functions.invoke('approve-restaurant', {
        body: {
          action: 'create_restaurant',
          requestData: {
            restaurant_name: restaurantData.name,
            domain: restaurantData.domain,
            address: restaurantData.address,
            phone: restaurantData.phone,
            email: restaurantData.email,
            business_type: restaurantData.businessType,
            owner_name: restaurantData.ownerName,
            password: restaurantData.adminPassword
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      toast({ title: "Restaurant created successfully" });
      setShowCreateDialog(false);
      setNewRestaurant({
        name: '',
        domain: '',
        address: '',
        phone: '',
        email: '',
        businessType: '',
        ownerName: '',
        adminPassword: ''
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating restaurant", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleCreateRestaurant = () => {
    if (!newRestaurant.name || !newRestaurant.email || !newRestaurant.ownerName || !newRestaurant.adminPassword) {
      toast({ 
        title: "Missing required fields", 
        description: "Please fill in all required fields",
        variant: "destructive" 
      });
      return;
    }

    // Validate email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValidEmail = emailRegex.test(newRestaurant.email);
    const isGenericEmail = /(^test@|^abc@|@test\.|@abc\.|@example\.|@dummy\.|@fake\.)/.test(newRestaurant.email.toLowerCase());
    
    if (!isValidEmail) {
      toast({ 
        title: "Invalid email", 
        description: "Please enter a valid email address",
        variant: "destructive" 
      });
      return;
    }
    
    if (isGenericEmail) {
      toast({ 
        title: "Invalid email", 
        description: "Please use a real business email address",
        variant: "destructive" 
      });
      return;
    }

    createRestaurantMutation.mutate(newRestaurant);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Restaurant
        </Button>
      </div>

      {/* Create Restaurant Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Restaurant</DialogTitle>
            <DialogDescription>Add a new restaurant to the system with admin account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  value={newRestaurant.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewRestaurant({
                      ...newRestaurant, 
                      name,
                      domain: generateDomain(name)
                    });
                  }}
                  placeholder="Enter restaurant name"
                />
                {newRestaurant.name && (
                  <p className="text-sm text-blue-600 mt-1">
                    Domain: {newRestaurant.domain}.odms.com
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <Select onValueChange={(value) => setNewRestaurant({...newRestaurant, businessType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName">Owner/Manager Name *</Label>
                <Input
                  id="ownerName"
                  value={newRestaurant.ownerName}
                  onChange={(e) => setNewRestaurant({...newRestaurant, ownerName: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Restaurant Address *</Label>
              <Textarea
                id="address"
                value={newRestaurant.address}
                onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                placeholder="Enter complete restaurant address"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Admin Account Setup</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Admin Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newRestaurant.email}
                    onChange={(e) => setNewRestaurant({...newRestaurant, email: e.target.value})}
                    placeholder="admin@restaurant.com"
                  />
                </div>
                <div>
                  <Label htmlFor="adminPassword">Admin Password *</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={newRestaurant.adminPassword}
                    onChange={(e) => setNewRestaurant({...newRestaurant, adminPassword: e.target.value})}
                    placeholder="Create secure password"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateRestaurant}
                disabled={createRestaurantMutation.isPending}
              >
                {createRestaurantMutation.isPending ? 'Creating...' : 'Create Restaurant'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
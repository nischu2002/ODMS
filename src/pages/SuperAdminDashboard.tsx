
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { 
  Store, 
  Users, 
  Plus, 
  Building,
  Globe,
  UserPlus,
  Edit,
  Trash2
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  domain: string;
  address: string;
  phone: string;
  email: string;
  admin_id: string | null;
  business_type: string | null;
  is_active: boolean;
  created_at: string;
}

interface RestaurantAdmin {
  id: string;
  name: string;
  email: string;
  restaurant_id: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [admins, setAdmins] = useState<RestaurantAdmin[]>([]);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    domain: '',
    businessType: '',
    address: '',
    phone: '',
    email: ''
  });
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    restaurantId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadRestaurants();
    loadAdmins();
  }, []);

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast({
        title: "Error loading restaurants",
        description: "Failed to load restaurants",
        variant: "destructive"
      });
    }
  };

  const loadAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast({
        title: "Error loading admins",
        description: "Failed to load restaurant admins",
        variant: "destructive"
      });
    }
  };

  const generateDomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleAddRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.domain) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const domain = newRestaurant.domain || generateDomain(newRestaurant.name);

      const { error } = await supabase
        .from('restaurants')
        .insert({
          name: newRestaurant.name,
          domain: domain,
          address: newRestaurant.address,
          phone: newRestaurant.phone,
          email: newRestaurant.email,
          business_type: newRestaurant.businessType
        });

      if (error) throw error;

      toast({
        title: "Restaurant created",
        description: "Restaurant has been created successfully"
      });

      setNewRestaurant({
        name: '',
        domain: '',
        businessType: '',
        address: '',
        phone: '',
        email: ''
      });
      setShowAddRestaurant(false);
      await loadRestaurants();
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      toast({
        title: "Error creating restaurant",
        description: error.message || "Failed to create restaurant",
        variant: "destructive"
      });
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !newAdmin.restaurantId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          emailRedirectTo: `${window.location.origin}/restaurant-admin`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          restaurant_id: newAdmin.restaurantId,
          email: newAdmin.email,
          name: newAdmin.name,
          role: 'admin'
        });

      if (profileError) throw profileError;

      // Update restaurant admin_id
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ admin_id: authData.user.id })
        .eq('id', newAdmin.restaurantId);

      if (updateError) throw updateError;

      toast({
        title: "Admin created",
        description: "Restaurant admin has been created successfully"
      });

      setNewAdmin({
        name: '',
        email: '',
        password: '',
        restaurantId: ''
      });
      setShowAddAdmin(false);
      await loadAdmins();
      await loadRestaurants();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error creating admin",
        description: error.message || "Failed to create admin",
        variant: "destructive"
      });
    }
  };

  const toggleRestaurantStatus = async (restaurantId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: !isActive })
        .eq('id', restaurantId);

      if (error) throw error;

      await loadRestaurants();
      toast({
        title: "Restaurant status updated",
        description: `Restaurant has been ${!isActive ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      toast({
        title: "Error updating restaurant",
        description: "Failed to update restaurant status",
        variant: "destructive"
      });
    }
  };

  const getRestaurantName = (restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    return restaurant ? restaurant.name : 'Unknown Restaurant';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurants.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurant Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Domains</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{restaurants.filter(r => r.is_active).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Restaurant Management</CardTitle>
                <CardDescription>Manage all restaurants in the system</CardDescription>
              </div>
              <Button onClick={() => setShowAddRestaurant(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddRestaurant && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-4">Add New Restaurant</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="restaurant-name">Restaurant Name</Label>
                    <Input
                      id="restaurant-name"
                      value={newRestaurant.name}
                      onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                      placeholder="Restaurant Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={newRestaurant.domain}
                      onChange={(e) => setNewRestaurant({...newRestaurant, domain: e.target.value})}
                      placeholder="restaurant-domain"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-type">Business Type</Label>
                    <Input
                      id="business-type"
                      value={newRestaurant.businessType}
                      onChange={(e) => setNewRestaurant({...newRestaurant, businessType: e.target.value})}
                      placeholder="Restaurant/Cafe/Fast Food"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newRestaurant.email}
                      onChange={(e) => setNewRestaurant({...newRestaurant, email: e.target.value})}
                      placeholder="contact@restaurant.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newRestaurant.phone}
                      onChange={(e) => setNewRestaurant({...newRestaurant, phone: e.target.value})}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newRestaurant.address}
                      onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                      placeholder="Restaurant Address"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddRestaurant}>Add Restaurant</Button>
                  <Button variant="outline" onClick={() => setShowAddRestaurant(false)}>Cancel</Button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Building className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600">{restaurant.domain}.odms.com</p>
                      <p className="text-sm text-gray-600">{restaurant.business_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{restaurant.email}</p>
                      <p className="text-sm text-gray-600">{restaurant.phone}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.is_active)}
                    >
                      {restaurant.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {restaurant.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
              {restaurants.length === 0 && (
                <p className="text-center text-gray-500 py-8">No restaurants added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Admin Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Restaurant Admin Management</CardTitle>
                <CardDescription>Manage restaurant administrators</CardDescription>
              </div>
              <Button onClick={() => setShowAddAdmin(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Restaurant Admin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddAdmin && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold mb-4">Add New Restaurant Admin</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="admin-name">Full Name</Label>
                    <Input
                      id="admin-name"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                      placeholder="Admin Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                      placeholder="admin@restaurant.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                      placeholder="Password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-restaurant">Restaurant</Label>
                    <select
                      id="admin-restaurant"
                      className="w-full p-2 border rounded-md"
                      value={newAdmin.restaurantId}
                      onChange={(e) => setNewAdmin({...newAdmin, restaurantId: e.target.value})}
                    >
                      <option value="">Select Restaurant</option>
                      {restaurants.map((restaurant) => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddAdmin}>Add Admin</Button>
                  <Button variant="outline" onClick={() => setShowAddAdmin(false)}>Cancel</Button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">{admin.name}</h3>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                      <p className="text-sm text-gray-600">Restaurant: {getRestaurantName(admin.restaurant_id || '')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      Restaurant Admin
                    </span>
                  </div>
                </div>
              ))}
              {admins.length === 0 && (
                <p className="text-center text-gray-500 py-8">No restaurant admins added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

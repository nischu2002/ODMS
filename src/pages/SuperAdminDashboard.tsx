
import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Activity
} from 'lucide-react';
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
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';

interface Restaurant {
  id: string;
  name: string;
  domain: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  business_type?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  restaurant_id?: string;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['all-restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Restaurant[];
    }
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as User[];
    }
  });

  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ['super-admin-analytics'],
    queryFn: async () => {
      // Get total orders across all restaurants
      const { data: orders } = await supabase
        .from('orders')
        .select('*');

      // Get total revenue
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Get today's data
      const today = new Date().toISOString().split('T')[0];
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today);

      const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Get active restaurants
      const activeRestaurants = restaurants.filter(r => r.is_active).length;

      // Get active users
      const activeUsers = users.filter(u => u.is_active).length;

      return {
        totalRestaurants: restaurants.length,
        activeRestaurants,
        totalUsers: users.length,
        activeUsers,
        totalOrders: orders?.length || 0,
        todayOrders: todayOrders?.length || 0,
        totalRevenue,
        todayRevenue
      };
    },
    enabled: !!restaurants.length && !!users.length
  });

  // Toggle restaurant status
  const toggleRestaurantMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: !is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-restaurants'] });
      toast({ title: "Restaurant status updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating restaurant status:', error);
      toast({ title: "Error updating restaurant status", variant: "destructive" });
    }
  });

  // Toggle user status
  const toggleUserMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({ title: "User status updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating user status:', error);
      toast({ title: "Error updating user status", variant: "destructive" });
    }
  });

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <div className="text-sm text-gray-600">
          System-wide overview and management
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalRestaurants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.activeRestaurants || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.activeUsers || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.todayOrders || 0} today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData?.totalRevenue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              ${analyticsData?.todayRevenue?.toFixed(2) || '0.00'} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Restaurants</CardTitle>
            <CardDescription>Recently registered restaurants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {restaurants.slice(0, 5).map((restaurant) => (
                <div key={restaurant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{restaurant.name}</div>
                    <div className="text-sm text-gray-500">{restaurant.domain}.odms.com</div>
                  </div>
                  <Badge className={restaurant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {restaurant.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Overall system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Status</span>
                <Badge className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response Time</span>
                <Badge className="bg-green-100 text-green-800">Fast</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Connections</span>
                <Badge className="bg-blue-100 text-blue-800">{analyticsData?.activeUsers || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">System Load</span>
                <Badge className="bg-green-100 text-green-800">Normal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRestaurants = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Restaurant Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Restaurants ({filteredRestaurants.length})</CardTitle>
          <CardDescription>Manage all restaurants in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">{restaurant.business_type || 'Restaurant'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{restaurant.domain}.odms.com</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{restaurant.email}</div>
                      <div className="text-sm text-gray-500">{restaurant.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={restaurant.is_active}
                      onCheckedChange={() => toggleRestaurantMutation.mutate({ 
                        id: restaurant.id, 
                        is_active: restaurant.is_active 
                      })}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(restaurant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
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

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage all users across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const userRestaurant = restaurants.find(r => r.id === user.restaurant_id);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {userRestaurant ? (
                        <div>
                          <div className="text-sm">{userRestaurant.name}</div>
                          <div className="text-xs text-gray-500">{userRestaurant.domain}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleUserMutation.mutate({ 
                          id: user.id, 
                          is_active: user.is_active 
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Settings</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>Global system settings and configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_restaurants">Max Restaurants</Label>
                <Input id="max_restaurants" type="number" defaultValue="1000" />
              </div>
              <div>
                <Label htmlFor="max_users_per_restaurant">Max Users per Restaurant</Label>
                <Input id="max_users_per_restaurant" type="number" defaultValue="50" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_trial_period">Default Trial Period (days)</Label>
                <Input id="default_trial_period" type="number" defaultValue="30" />
              </div>
              <div>
                <Label htmlFor="system_maintenance">System Maintenance Mode</Label>
                <Switch id="system_maintenance" />
              </div>
            </div>
            
            <Button>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Restaurants
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            {renderOverview()}
          </TabsContent>
          <TabsContent value="restaurants">
            {renderRestaurants()}
          </TabsContent>
          <TabsContent value="users">
            {renderUsers()}
          </TabsContent>
          <TabsContent value="settings">
            {renderSettings()}
          </TabsContent>
        </div>
      </Tabs>
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { RestaurantCRUD } from '../components/RestaurantCRUD';
import { RestaurantRequestsManager } from '../components/RestaurantRequestsManager';
import { SystemNotificationsManager } from '../components/SystemNotificationsManager';
import { CMSManager } from '../components/CMSManager';
import TeamMemberCMS from '../components/TeamMemberCMS';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { 
  Building2, 
  Users, 
  Bell, 
  Globe,
  Database,
  AlertTriangle,
  CheckCircle,
  Settings,
  User
} from 'lucide-react';

interface DatabaseStats {
  restaurantsCount: number | null;
  usersCount: number | null;
  activeRestaurantsCount: number | null;
  pendingRestaurantRequestsCount: number | null;
}

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats>({
    restaurantsCount: null,
    usersCount: null,
    activeRestaurantsCount: null,
    pendingRestaurantRequestsCount: null,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showTeamCMS, setShowTeamCMS] = useState(false);

  useEffect(() => {
    const fetchDatabaseStats = async () => {
      try {
        const [
          { data: restaurantsData, error: restaurantsError },
          { data: usersData, error: usersError },
          { data: activeRestaurantsData, error: activeRestaurantsError },
          { data: pendingRequestsData, error: pendingRequestsError },
        ] = await Promise.all([
          supabase.from('restaurants').select('*', { count: 'exact' }),
          supabase.from('users').select('*', { count: 'exact' }),
          supabase.from('restaurants').select('*', { count: 'exact' }).eq('is_active', true),
          supabase.from('restaurant_requests').select('*', { count: 'exact' }).eq('status', 'pending'),
        ]);

        if (restaurantsError || usersError || activeRestaurantsError || pendingRequestsError) {
          console.error("Error fetching data:", restaurantsError, usersError, activeRestaurantsError, pendingRequestsError);
          toast({
            title: "Error fetching dashboard data",
            description: "Failed to retrieve all dashboard statistics.",
            variant: "destructive",
          });
          return;
        }

        setDatabaseStats({
          restaurantsCount: restaurantsData?.length ?? 0,
          usersCount: usersData?.length ?? 0,
          activeRestaurantsCount: activeRestaurantsData?.length ?? 0,
          pendingRestaurantRequestsCount: pendingRequestsData?.length ?? 0,
        });

      } catch (error) {
        console.error("Unexpected error fetching data:", error);
        toast({
          title: "Unexpected error",
          description: "An unexpected error occurred while fetching dashboard data.",
          variant: "destructive",
        });
      }
    };

    fetchDatabaseStats();
  }, [toast]);

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            You are not authorized to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showTeamCMS) {
    return <TeamMemberCMS onClose={() => setShowTeamCMS(false)} />;
  }

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Welcome, Super Admin!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              As a super admin, you have full control over the system. Use the
              tabs below to manage restaurants, users, and system settings.
            </p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              Requests
            </TabsTrigger>
             <TabsTrigger value="cms" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              CMS
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    Total Restaurants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{databaseStats.restaurantsCount}</div>
                  <p className="text-sm text-gray-500">
                    Total number of registered restaurants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Active Restaurants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{databaseStats.activeRestaurantsCount}</div>
                  <p className="text-sm text-gray-500">
                    Number of currently active restaurants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{databaseStats.usersCount}</div>
                  <p className="text-sm text-gray-500">
                    Total number of registered users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{databaseStats.pendingRestaurantRequestsCount}</div>
                  <p className="text-sm text-gray-500">
                    New restaurant registration requests
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="restaurants">
            <RestaurantCRUD />
          </TabsContent>

          <TabsContent value="requests">
            <RestaurantRequestsManager />
          </TabsContent>

          <TabsContent value="cms">
            <div className="space-y-4">
              <CMSManager />

              <Card>
                <CardHeader>
                  <CardTitle>Team Members Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Manage team member profiles for the public website</p>
                    <Button onClick={() => setShowTeamCMS(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <Settings className="h-4 w-4 mr-2" />
                      Open Team CMS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;

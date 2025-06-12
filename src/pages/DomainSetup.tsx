import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, Globe, Users, Truck, Settings } from 'lucide-react';

export default function DomainSetup() {
  const { domain } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    // Find restaurant by domain
    const allRestaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const foundRestaurant = allRestaurants.find((r: any) => r.domain === domain);
    setRestaurant(foundRestaurant);
  }, [domain]);

  const handleGoToLogin = () => {
    navigate(`/login?domain=${domain}`);
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Restaurant Not Found</CardTitle>
            <CardDescription>
              Please complete the registration process first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/signup')} className="w-full">
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              🎉 Welcome to ODMS!
            </CardTitle>
            <CardDescription className="text-lg">
              Your restaurant account has been successfully created
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Your Domain is Ready!</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {domain}.odms.com
              </p>
              <p className="text-gray-600 mt-2">
                This is your restaurant's dedicated domain for order management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold">Admin Access</h4>
                <p className="text-sm text-gray-600">
                  Full control over restaurant operations and staff management
                </p>
              </div>
              
              <div className="text-center p-4">
                <Settings className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                <h4 className="font-semibold">Staff Portal</h4>
                <p className="text-sm text-gray-600">
                  Kitchen and order management for restaurant staff
                </p>
              </div>
              
              <div className="text-center p-4">
                <Truck className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold">Rider Dashboard</h4>
                <p className="text-sm text-gray-600">
                  Delivery tracking and management for riders
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Account Details:</h3>
              <div className="text-left space-y-2">
                <p><strong>Restaurant:</strong> {restaurant.name}</p>
                <p><strong>Business Type:</strong> {restaurant.businessType}</p>
                <p><strong>Admin Email:</strong> {restaurant.email}</p>
                <p><strong>Domain:</strong> {restaurant.domain}.odms.com</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Login Credentials:</h3>
              <p className="text-sm text-yellow-700">
                Use your admin email <strong>({restaurant.email})</strong> and the password you created during registration to login to your restaurant dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <Button onClick={handleGoToLogin} size="lg" className="w-full md:w-auto px-8">
                Login to Your Restaurant
              </Button>
              
              <p className="text-sm text-gray-600">
                You can access your restaurant management system anytime at odms.com/login
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-red-600">404</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Link to="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 mt-4">
            <p>Need help? Contact support or try one of these links:</p>
            <div className="flex justify-center space-x-4 mt-2">
              <Link to="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

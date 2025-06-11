
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Store, Users, Truck, BarChart3, Shield, Globe } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'restaurant_staff') {
        navigate('/restaurant');
      } else if (user.role === 'rider') {
        navigate('/rider');
      }
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Store,
      title: 'Multi-Restaurant Management',
      description: 'Each restaurant gets their own domain and management portal',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Admin, Restaurant Staff, and Delivery Riders with specific permissions',
    },
    {
      icon: Truck,
      title: 'Real-Time Tracking',
      description: 'GPS tracking for delivery riders and real-time order updates',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive insights for performance tracking and business growth',
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Enterprise-grade security with domain-based isolation',
    },
    {
      icon: Globe,
      title: 'Multi-Tenant Architecture',
      description: 'Scalable solution supporting multiple restaurants simultaneously',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
              <h1 className="text-xl font-bold text-gray-900">ODMS</h1>
            </div>
            <Button onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Order & Delivery
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Management System
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete SAAS platform for restaurants to manage orders, track deliveries, 
            and analyze performance with domain-based multi-tenant architecture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/login')}>
              Access Your Dashboard
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Restaurant Operations?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of restaurants already using ODMS to streamline their order 
            and delivery management processes.
          </p>
          <Button size="lg" onClick={() => navigate('/login')}>
            Start Your Journey
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 ODMS - Order & Delivery Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

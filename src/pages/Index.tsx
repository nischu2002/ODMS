
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Store, Users, Truck, BarChart3, Shield, Globe, Star, Clock, MapPin } from 'lucide-react';
import { ModernNavbar } from '../components/ModernNavbar';
import { ModernFooter } from '../components/ModernFooter';

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
      description: 'Each restaurant gets their own domain and comprehensive management portal with full control',
    },
    {
      icon: Users,
      title: 'Role-Based Access Control',
      description: 'Admin, Restaurant Staff, and Delivery Riders with specific permissions and secure access',
    },
    {
      icon: Truck,
      title: 'Real-Time Order Tracking',
      description: 'GPS tracking for delivery riders and live order updates for customers and restaurants',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics Dashboard',
      description: 'Comprehensive insights for performance tracking, sales analytics and business growth',
    },
    {
      icon: Shield,
      title: 'Enterprise-Grade Security',
      description: 'Advanced security with domain-based isolation and encrypted data protection',
    },
    {
      icon: Globe,
      title: 'Scalable Multi-Tenant Platform',
      description: 'Cloud-native solution designed to support unlimited restaurants simultaneously',
    },
  ];

  const stats = [
    {
      icon: Store,
      number: '500+',
      label: 'Active Restaurants',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      number: '10K+',
      label: 'Daily Orders',
      color: 'text-green-600'
    },
    {
      icon: Clock,
      number: '15min',
      label: 'Average Delivery',
      color: 'text-purple-600'
    },
    {
      icon: Star,
      number: '4.9/5',
      label: 'Customer Rating',
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20 pb-32">
        <div className="absolute inset-0 bg-grid-slate-100 [background-size:20px_20px] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 mb-8">
              <span>🚀 Revolutionizing Restaurant Operations</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Order & Delivery
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent block">
                Management System
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Complete SAAS platform for restaurants to manage orders, track deliveries, 
              and analyze performance with domain-based multi-tenant architecture.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate('/signup')}
              >
                Start Your Restaurant Journey
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 rounded-full border-2 hover:bg-gray-50 transition-all duration-300"
                onClick={() => navigate('/login')}
              >
                Access Dashboard
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md mb-3`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Modern Restaurants</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to run a successful restaurant business in one comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group border-0 shadow-lg bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join hundreds of restaurants already using ODMS to streamline their order 
            and delivery management processes. Get your custom domain and start growing today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate('/signup')}
            >
              Create Your Account Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 rounded-full font-semibold transition-all duration-300"
              onClick={() => navigate('/login')}
            >
              Sign In to Dashboard
            </Button>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}

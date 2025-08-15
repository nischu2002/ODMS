
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, Truck, BarChart3, Clock, Shield, Headphones } from 'lucide-react';
import ModernNavbar from '@/components/ModernNavbar';
import ModernFooter from '@/components/ModernFooter';

const Index = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-orange-600" />,
      title: "Staff Management",
      description: "Efficiently manage your restaurant staff with role-based access control and activity tracking."
    },
    {
      icon: <Truck className="h-8 w-8 text-orange-600" />,
      title: "Delivery Tracking",
      description: "Real-time GPS tracking for delivery riders with automated customer notifications."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics to track orders, revenue, and performance metrics."
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: "Order Management",
      description: "Streamlined order processing from kitchen to customer with status updates."
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      title: "Secure System",
      description: "Enterprise-grade security with encrypted data and secure authentication."
    },
    {
      icon: <Headphones className="h-8 w-8 text-orange-600" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support to help you manage your restaurant operations."
    }
  ];

  const stats = [
    { number: "500+", label: "Restaurants Registered" },
    { number: "10,000+", label: "Orders Processed Daily" },
    { number: "98%", label: "Customer Satisfaction" },
    { number: "24/7", label: "System Uptime" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 to-red-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your Restaurant
              <span className="text-orange-600"> Operations</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Complete Order Delivery Management System (ODMS) designed to optimize your restaurant's workflow, 
              from order processing to delivery tracking and staff management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/restaurant-signup">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-3">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-orange-600">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Restaurant
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to manage orders, staff, deliveries, and analytics in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose ODMS?
              </h2>
              <div className="space-y-4 mb-8">
                {[
                  "Reduce order processing time by 60%",
                  "Improve delivery efficiency with GPS tracking",
                  "Streamline staff management and scheduling",
                  "Get real-time insights with advanced analytics",
                  "Increase customer satisfaction with automated updates",
                  "Scale your business with multi-location support"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link to="/restaurant-signup">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="lg:order-first">
              <img 
                src="/lovable-uploads/e22052b3-b40e-4c5b-a160-dc3662f8f7b2.png" 
                alt="Restaurant Dashboard Preview" 
                className="rounded-xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Restaurant Operations?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of restaurants already using ODMS to streamline their operations and increase profitability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/restaurant-signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Register Your Restaurant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-orange-600">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
};

export default Index;

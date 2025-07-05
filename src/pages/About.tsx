
import React from 'react';
import { ModernNavbar } from '../components/ModernNavbar';
import { ModernFooter } from '../components/ModernFooter';
import { Card, CardContent } from '../components/ui/card';
import { Store, Users, Truck, BarChart3, Shield, Globe, Target, Eye, Heart } from 'lucide-react';

export default function About() {
  const values = [
    {
      icon: Target,
      title: 'Innovation First',
      description: 'We continuously push the boundaries of technology to deliver cutting-edge solutions that transform restaurant operations.',
    },
    {
      icon: Users,
      title: 'Customer Success',
      description: 'Our success is measured by the success of our restaurant partners. We are committed to their growth and prosperity.',
    },
    {
      icon: Shield,
      title: 'Reliability & Trust',
      description: 'We build secure, dependable systems that restaurants can rely on 24/7 to manage their critical business operations.',
    },
    {
      icon: Heart,
      title: 'Community Impact',
      description: 'We believe in empowering local restaurants and contributing to vibrant food communities around the world.',
    },
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Company Founded',
      description: 'Started with a vision to revolutionize restaurant management technology.',
    },
    {
      year: '2021',
      title: 'First 100 Restaurants',
      description: 'Reached our first milestone of 100 active restaurant partners.',
    },
    {
      year: '2022',
      title: 'Multi-Tenant Platform',
      description: 'Launched our scalable multi-tenant architecture serving 1000+ restaurants.',
    },
    {
      year: '2023',
      title: 'Global Expansion',
      description: 'Expanded operations to serve restaurants across multiple countries.',
    },
    {
      year: '2024',
      title: 'AI Integration',
      description: 'Integrated advanced analytics and AI-powered insights for restaurant optimization.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> ODMS</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We're on a mission to empower restaurants worldwide with innovative technology solutions 
              that streamline operations, enhance customer experiences, and drive business growth.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 mb-6">
                <Eye className="h-4 w-4 mr-2" />
                Our Vision
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Transforming Restaurant Operations Globally
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                We envision a world where every restaurant, from local cafes to enterprise chains, 
                has access to enterprise-grade technology that empowers them to deliver exceptional 
                customer experiences while optimizing their operations for maximum efficiency and profitability.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-gray-700">Democratizing access to advanced restaurant technology</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-gray-700">Enabling data-driven decision making for restaurant owners</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-gray-700">Supporting local food communities worldwide</p>
                </div>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-purple-100 text-purple-700 mb-6">
                <Target className="h-4 w-4 mr-2" />
                Our Mission
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Empowering Restaurant Success
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Our mission is to provide restaurants with comprehensive, user-friendly technology solutions 
                that simplify complex operations, enhance customer satisfaction, and drive sustainable business growth 
                through innovation, reliability, and exceptional support.
              </p>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                    <div className="text-gray-600">Active Restaurants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">1M+</div>
                    <div className="text-gray-600">Orders Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                    <div className="text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                    <div className="text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Core
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These fundamental principles guide every decision we make and every solution we build
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="group border-0 shadow-lg bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Journey</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From startup to industry leader, here's how we've grown and evolved
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gradient-to-b from-blue-600 to-purple-600"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full border-4 border-white shadow-lg z-10"></div>
                  
                  {/* Content */}
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                          index % 2 === 0 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {milestone.year}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-600">
                          {milestone.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}

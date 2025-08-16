
import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const ModernFooter = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10">
                <img 
                  src="/lovable-uploads/a42ffb66-427c-426e-9a33-2ff9b05ee0b3.png" 
                  alt="ODMS Logo" 
                  className="w-full h-full object-contain filter brightness-0 invert"
                />
              </div>
              <span className="text-2xl font-bold">ODMS</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Streamline your restaurant operations with our comprehensive Online Delivery Management System. 
              From order processing to delivery tracking, we've got you covered.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="h-4 w-4" />
                <span>info@odms.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
              <li><a href="#team" className="text-gray-300 hover:text-white transition-colors">Our Team</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-300">Order Management</span></li>
              <li><span className="text-gray-300">Delivery Tracking</span></li>
              <li><span className="text-gray-300">Staff Management</span></li>
              <li><span className="text-gray-300">Analytics & Reports</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            &copy; 2024 ODMS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ModernFooter;

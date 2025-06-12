
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Restaurant } from '../types';

interface AuthContextType {
  user: User | null;
  restaurant: Restaurant | null;
  login: (email: string, password: string, domain?: string, requestedRole?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  createSuperAdmin: (email: string, password: string, name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing session
    const storedUser = localStorage.getItem('user');
    const storedRestaurant = localStorage.getItem('restaurant');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedRestaurant) {
      setRestaurant(JSON.parse(storedRestaurant));
    }
    
    setIsLoading(false);
  }, []);

  const createSuperAdmin = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check if super admin already exists
      const existingSuperAdmins = localStorage.getItem('superAdmins');
      const superAdmins = existingSuperAdmins ? JSON.parse(existingSuperAdmins) : [];
      
      if (superAdmins.find((admin: any) => admin.email === email)) {
        return false; // Super admin already exists
      }
      
      const newSuperAdmin = {
        id: 'super-' + Date.now(),
        email,
        password,
        name,
        role: 'super_admin' as const,
        createdAt: new Date().toISOString()
      };
      
      superAdmins.push(newSuperAdmin);
      localStorage.setItem('superAdmins', JSON.stringify(superAdmins));
      
      // Auto login the new super admin
      const mockUser: User = {
        id: newSuperAdmin.id,
        email: newSuperAdmin.email,
        name: newSuperAdmin.name,
        role: 'super_admin',
        createdAt: newSuperAdmin.createdAt
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      return true;
    } catch (error) {
      console.error('Super admin creation failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, domain?: string, requestedRole?: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Handle super admin login
      if (requestedRole === 'super_admin') {
        const superAdmins = JSON.parse(localStorage.getItem('superAdmins') || '[]');
        const superAdmin = superAdmins.find((admin: any) => admin.email === email && admin.password === password);
        
        if (superAdmin) {
          const mockUser: User = {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: 'super_admin',
            createdAt: superAdmin.createdAt
          };
          
          setUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
          return true;
        }
        return false;
      }
      
      // Check if this is a registered restaurant admin
      const registrationData = localStorage.getItem('registrationData');
      const restaurantAdmins = JSON.parse(localStorage.getItem('restaurantAdmins') || '[]');
      
      let mockUser: User;
      let mockRestaurant: Restaurant | null = null;
      
      // Check restaurant admins created by super admin
      const restaurantAdmin = restaurantAdmins.find((admin: any) => admin.email === email && admin.password === password);
      if (restaurantAdmin) {
        const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
        const restaurant = restaurants.find((r: any) => r.id === restaurantAdmin.restaurantId);
        
        if (restaurant) {
          mockUser = {
            id: restaurantAdmin.id,
            email: restaurantAdmin.email,
            name: restaurantAdmin.name,
            role: 'admin',
            restaurantId: restaurant.id,
            createdAt: restaurantAdmin.createdAt
          };
          
          mockRestaurant = restaurant;
        } else {
          return false;
        }
      } else if (registrationData) {
        const regData = JSON.parse(registrationData);
        
        // Check if login credentials match the registered admin
        if (email === regData.adminEmail && password === regData.adminPassword) {
          mockUser = {
            id: 'admin-' + regData.domain,
            email: regData.adminEmail,
            name: regData.ownerName,
            role: 'admin',
            restaurantId: regData.domain,
            createdAt: new Date().toISOString()
          };
          
          mockRestaurant = {
            id: regData.domain,
            name: regData.restaurantName,
            domain: regData.domain,
            address: regData.address,
            phone: regData.phone,
            email: regData.adminEmail,
            adminId: mockUser.id,
            createdAt: new Date().toISOString(),
            isActive: true,
            businessType: regData.businessType
          };
        } else {
          // Default demo users for testing
          if (email.includes('staff')) {
            mockUser = {
              id: '2',
              email,
              name: 'Restaurant Staff',
              role: 'restaurant_staff',
              restaurantId: domain || 'demo-restaurant',
              createdAt: new Date().toISOString()
            };
            mockRestaurant = {
              id: domain || 'demo-restaurant',
              name: domain || 'Demo Restaurant',
              domain: domain || 'demo-restaurant',
              address: '123 Demo Street',
              phone: '+1234567890',
              email: 'contact@demo.com',
              adminId: '1',
              createdAt: new Date().toISOString(),
              isActive: true
            };
          } else if (email.includes('rider')) {
            mockUser = {
              id: '3',
              email,
              name: 'Delivery Rider',
              role: 'rider',
              restaurantId: domain || 'demo-restaurant',
              createdAt: new Date().toISOString()
            };
            mockRestaurant = {
              id: domain || 'demo-restaurant',
              name: domain || 'Demo Restaurant',
              domain: domain || 'demo-restaurant',
              address: '123 Demo Street',
              phone: '+1234567890',
              email: 'contact@demo.com',
              adminId: '1',
              createdAt: new Date().toISOString(),
              isActive: true
            };
          } else {
            // Invalid credentials
            return false;
          }
        }
      } else {
        // Default demo users when no registration data exists
        if (email.includes('staff')) {
          mockUser = {
            id: '2',
            email,
            name: 'Restaurant Staff',
            role: 'restaurant_staff',
            restaurantId: domain || 'demo-restaurant',
            createdAt: new Date().toISOString()
          };
          mockRestaurant = {
            id: domain || 'demo-restaurant',
            name: domain || 'Demo Restaurant',
            domain: domain || 'demo-restaurant',
            address: '123 Demo Street',
            phone: '+1234567890',
            email: 'contact@demo.com',
            adminId: '1',
            createdAt: new Date().toISOString(),
            isActive: true
          };
        } else if (email.includes('rider')) {
          mockUser = {
            id: '3',
            email,
            name: 'Delivery Rider',
            role: 'rider',
            restaurantId: domain || 'demo-restaurant',
            createdAt: new Date().toISOString()
          };
          mockRestaurant = {
            id: domain || 'demo-restaurant',
            name: domain || 'Demo Restaurant',
            domain: domain || 'demo-restaurant',
            address: '123 Demo Street',
            phone: '+1234567890',
            email: 'contact@demo.com',
            adminId: '1',
            createdAt: new Date().toISOString(),
            isActive: true
          };
        } else {
          return false;
        }
      }
      
      setUser(mockUser);
      setRestaurant(mockRestaurant);
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      if (mockRestaurant) {
        localStorage.setItem('restaurant', JSON.stringify(mockRestaurant));
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setRestaurant(null);
    localStorage.removeItem('user');
    localStorage.removeItem('restaurant');
  };

  return (
    <AuthContext.Provider value={{ user, restaurant, login, logout, isLoading, createSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

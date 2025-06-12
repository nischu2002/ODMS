
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
      
      console.log('Login attempt:', { email, password, domain, requestedRole });
      
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
      
      // Get all registered restaurants
      const allRestaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
      console.log('All restaurants:', allRestaurants);
      
      // Check registration data for domain-specific authentication
      const registrationData = localStorage.getItem('registrationData');
      if (registrationData) {
        const regData = JSON.parse(registrationData);
        console.log('Registration data found:', regData);
        
        // Check if this is the restaurant admin trying to login with their domain
        if (domain && regData.domain === domain && email === regData.adminEmail && password === regData.adminPassword) {
          console.log('Credentials match registration data for domain:', domain);
          
          const mockUser: User = {
            id: 'admin-' + regData.domain,
            email: regData.adminEmail,
            name: regData.ownerName,
            role: 'admin',
            restaurantId: regData.domain,
            createdAt: new Date().toISOString()
          };
          
          const mockRestaurant: Restaurant = {
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
          
          // Store in restaurants array if not already there
          const existingRestaurant = allRestaurants.find((r: any) => r.domain === regData.domain);
          if (!existingRestaurant) {
            allRestaurants.push(mockRestaurant);
            localStorage.setItem('restaurants', JSON.stringify(allRestaurants));
          }
          
          setUser(mockUser);
          setRestaurant(mockRestaurant);
          
          localStorage.setItem('user', JSON.stringify(mockUser));
          localStorage.setItem('restaurant', JSON.stringify(mockRestaurant));
          
          return true;
        }
      }
      
      // Check existing restaurants for admin login
      if (domain) {
        const restaurant = allRestaurants.find((r: any) => r.domain === domain);
        if (restaurant && restaurant.email === email) {
          // Need to verify password - check if there's a stored admin for this restaurant
          const restaurantAdmins = JSON.parse(localStorage.getItem('restaurantAdmins') || '[]');
          const admin = restaurantAdmins.find((a: any) => a.email === email && a.restaurantId === restaurant.id);
          
          if (admin && admin.password === password) {
            const mockUser: User = {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: 'admin',
              restaurantId: restaurant.id,
              createdAt: admin.createdAt
            };
            
            setUser(mockUser);
            setRestaurant(restaurant);
            
            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('restaurant', JSON.stringify(restaurant));
            
            return true;
          }
        }
      }
      
      // Check restaurant staff login
      if (domain) {
        const restaurantStaff = JSON.parse(localStorage.getItem(`staff_${domain}`) || '[]');
        const staff = restaurantStaff.find((s: any) => s.email === email && s.password === password);
        
        if (staff) {
          const restaurant = allRestaurants.find((r: any) => r.domain === domain);
          if (restaurant) {
            const mockUser: User = {
              id: staff.id,
              email: staff.email,
              name: staff.name,
              role: 'restaurant_staff',
              restaurantId: restaurant.id,
              createdAt: staff.createdAt
            };
            
            setUser(mockUser);
            setRestaurant(restaurant);
            
            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('restaurant', JSON.stringify(restaurant));
            
            return true;
          }
        }
      }
      
      // Check rider login
      if (domain) {
        const riders = JSON.parse(localStorage.getItem(`riders_${domain}`) || '[]');
        const rider = riders.find((r: any) => r.email === email && r.password === password);
        
        if (rider) {
          const restaurant = allRestaurants.find((r: any) => r.domain === domain);
          if (restaurant) {
            const mockUser: User = {
              id: rider.id,
              email: rider.email,
              name: rider.name,
              role: 'rider',
              restaurantId: restaurant.id,
              createdAt: rider.createdAt
            };
            
            setUser(mockUser);
            setRestaurant(restaurant);
            
            localStorage.setItem('user', JSON.stringify(mockUser));
            localStorage.setItem('restaurant', JSON.stringify(restaurant));
            
            return true;
          }
        }
      }
      
      // Demo credentials fallback
      if (email.includes('admin') && domain) {
        const mockUser: User = {
          id: 'demo-admin-' + domain,
          email,
          name: 'Demo Restaurant Admin',
          role: 'admin',
          restaurantId: domain,
          createdAt: new Date().toISOString()
        };
        
        const mockRestaurant: Restaurant = {
          id: domain,
          name: `${domain} Restaurant`,
          domain: domain,
          address: '123 Demo Street',
          phone: '+1234567890',
          email: email,
          adminId: mockUser.id,
          createdAt: new Date().toISOString(),
          isActive: true
        };
        
        setUser(mockUser);
        setRestaurant(mockRestaurant);
        
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('restaurant', JSON.stringify(mockRestaurant));
        
        return true;
      }
      
      console.log('No matching credentials found');
      return false;
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


import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Restaurant } from '../types';

interface AuthContextType {
  user: User | null;
  restaurant: Restaurant | null;
  login: (email: string, password: string, domain?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
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

  const login = async (email: string, password: string, domain?: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data based on email
      let mockUser: User;
      let mockRestaurant: Restaurant | null = null;
      
      if (email.includes('admin')) {
        mockUser = {
          id: '1',
          email,
          name: 'System Admin',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
      } else if (email.includes('staff')) {
        mockUser = {
          id: '2',
          email,
          name: 'Restaurant Staff',
          role: 'restaurant_staff',
          restaurantId: 'rest-1',
          createdAt: new Date().toISOString()
        };
        mockRestaurant = {
          id: 'rest-1',
          name: domain || 'Sample Restaurant',
          domain: domain || 'sample-restaurant',
          address: '123 Food Street',
          phone: '+1234567890',
          email: 'contact@restaurant.com',
          adminId: '1',
          createdAt: new Date().toISOString(),
          isActive: true
        };
      } else {
        mockUser = {
          id: '3',
          email,
          name: 'Delivery Rider',
          role: 'rider',
          restaurantId: 'rest-1',
          createdAt: new Date().toISOString()
        };
        mockRestaurant = {
          id: 'rest-1',
          name: domain || 'Sample Restaurant',
          domain: domain || 'sample-restaurant',
          address: '123 Food Street',
          phone: '+1234567890',
          email: 'contact@restaurant.com',
          adminId: '1',
          createdAt: new Date().toISOString(),
          isActive: true
        };
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
    <AuthContext.Provider value={{ user, restaurant, login, logout, isLoading }}>
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

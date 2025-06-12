
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Restaurant } from '../types';

interface AuthContextType {
  user: User | null;
  restaurant: Restaurant | null;
  login: (email: string, password: string, domain: string) => Promise<boolean>;
  loginSuperAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  createSuperAdmin: (email: string, password: string, name: string) => Promise<boolean>;
  registerRestaurant: (data: any) => Promise<{ success: boolean; domain?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize proper database structure in localStorage
const initializeDatabase = () => {
  // Check if database is already initialized
  if (!localStorage.getItem('odms_initialized')) {
    // Initialize tables
    localStorage.setItem('restaurants', JSON.stringify([]));
    localStorage.setItem('users', JSON.stringify([]));
    localStorage.setItem('orders', JSON.stringify([]));
    localStorage.setItem('superAdmins', JSON.stringify([]));
    localStorage.setItem('odms_initialized', 'true');
    
    console.log('Database initialized with proper structure');
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize database structure
    initializeDatabase();
    
    // Check for existing session
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

  const generateDomain = (restaurantName: string) => {
    return restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const isDomainUnique = (domain: string) => {
    const allRestaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    return !allRestaurants.find((r: any) => r.domain === domain);
  };

  const isEmailUniqueGlobally = (email: string) => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allRestaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    
    // Check if email exists in users table
    const userExists = allUsers.find((u: any) => u.email === email);
    // Check if email exists as restaurant admin email
    const restaurantExists = allRestaurants.find((r: any) => r.email === email);
    
    return !userExists && !restaurantExists;
  };

  const registerRestaurant = async (data: any): Promise<{ success: boolean; domain?: string; error?: string }> => {
    try {
      const domain = generateDomain(data.restaurantName);
      
      // Check domain uniqueness
      if (!isDomainUnique(domain)) {
        return { success: false, error: 'Restaurant name already taken. Please choose a different name.' };
      }
      
      // Check email uniqueness globally
      if (!isEmailUniqueGlobally(data.adminEmail)) {
        return { success: false, error: 'Email already registered. Please use a different email.' };
      }
      
      const restaurantId = `rest_${Date.now()}`;
      const adminId = `admin_${Date.now()}`;
      
      // Create restaurant entry
      const newRestaurant: Restaurant = {
        id: restaurantId,
        name: data.restaurantName,
        domain: domain,
        address: data.address,
        phone: data.phone,
        email: data.adminEmail,
        adminId: adminId,
        createdAt: new Date().toISOString(),
        isActive: true,
        businessType: data.businessType
      };
      
      // Create admin user entry
      const adminUser = {
        id: adminId,
        restaurantId: restaurantId,
        email: data.adminEmail,
        password: data.adminPassword, // In production, this should be hashed
        name: data.ownerName,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      // Store in database tables
      const allRestaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
      allRestaurants.push(newRestaurant);
      localStorage.setItem('restaurants', JSON.stringify(allRestaurants));
      
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      allUsers.push(adminUser);
      localStorage.setItem('users', JSON.stringify(allUsers));
      
      console.log('Restaurant and admin user created successfully:', { restaurantId, adminId, domain });
      
      return { success: true, domain };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const createSuperAdmin = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check if super admin already exists
      const superAdmins = JSON.parse(localStorage.getItem('superAdmins') || '[]');
      
      if (superAdmins.find((admin: any) => admin.email === email)) {
        return false; // Super admin already exists
      }
      
      const newSuperAdmin = {
        id: 'super-' + Date.now(),
        email,
        password, // In production, this should be hashed
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

  const loginSuperAdmin = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Super admin login attempt:', { email });
      
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
      
      console.log('Super admin not found or invalid credentials');
      return false;
    } catch (error) {
      console.error('Super admin login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, domain: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Restaurant login attempt:', { email, domain });
      
      // Find restaurant by domain
      const allRestaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
      const restaurant = allRestaurants.find((r: any) => r.domain === domain);
      
      if (!restaurant) {
        console.log('Restaurant not found for domain:', domain);
        return false;
      }
      
      // Find user in users table for this restaurant
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = allUsers.find((u: any) => 
        u.email === email && 
        u.password === password && 
        u.restaurantId === restaurant.id
      );
      
      if (user) {
        const mockUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurantId,
          createdAt: user.createdAt
        };
        
        setUser(mockUser);
        setRestaurant(restaurant);
        
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('restaurant', JSON.stringify(restaurant));
        
        console.log('Login successful for user:', user.role);
        return true;
      }
      
      console.log('User not found or invalid credentials');
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
    <AuthContext.Provider value={{ 
      user, 
      restaurant, 
      login, 
      loginSuperAdmin,
      logout, 
      isLoading, 
      createSuperAdmin,
      registerRestaurant
    }}>
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

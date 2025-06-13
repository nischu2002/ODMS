
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { User as AppUser, Restaurant } from '../types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  restaurant: Restaurant | null;
  login: (email: string, password: string, domain: string) => Promise<boolean>;
  loginSuperAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  createSuperAdmin: (email: string, password: string, name: string) => Promise<boolean>;
  registerRestaurant: (data: any) => Promise<{ success: boolean; domain?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
          setRestaurant(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser: User) => {
    try {
      // Check if user is a super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (superAdmin) {
        setUser({
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: 'super_admin',
          createdAt: superAdmin.created_at
        });
        return;
      }

      // Check if user is in users table
      const { data: userData } = await supabase
        .from('users')
        .select('*, restaurants(*)')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role as AppUser['role'],
          restaurantId: userData.restaurant_id || undefined,
          phone: userData.phone || undefined,
          isActive: userData.is_active,
          createdAt: userData.created_at
        });

        // Load restaurant data if user is associated with one
        if (userData.restaurant_id) {
          const { data: restaurantData } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', userData.restaurant_id)
            .single();

          if (restaurantData) {
            setRestaurant({
              id: restaurantData.id,
              name: restaurantData.name,
              domain: restaurantData.domain,
              address: restaurantData.address,
              phone: restaurantData.phone,
              email: restaurantData.email,
              adminId: restaurantData.admin_id || undefined,
              createdAt: restaurantData.created_at,
              isActive: restaurantData.is_active,
              businessType: restaurantData.business_type || undefined
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const generateDomain = (restaurantName: string) => {
    return restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const registerRestaurant = async (data: any): Promise<{ success: boolean; domain?: string; error?: string }> => {
    try {
      const domain = generateDomain(data.restaurantName);
      
      // Check domain uniqueness
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('domain', domain)
        .single();

      if (existingRestaurant) {
        return { success: false, error: 'Restaurant name already taken. Please choose a different name.' };
      }

      // Create admin user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Create restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: data.restaurantName,
          domain: domain,
          address: data.address,
          phone: data.phone,
          email: data.adminEmail,
          admin_id: authData.user.id,
          business_type: data.businessType
        })
        .select()
        .single();

      if (restaurantError) {
        return { success: false, error: restaurantError.message };
      }

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          restaurant_id: restaurantData.id,
          email: data.adminEmail,
          name: data.ownerName,
          role: 'admin',
          phone: data.phone
        });

      if (userError) {
        return { success: false, error: userError.message };
      }

      return { success: true, domain };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const createSuperAdmin = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/dashboard`
        }
      });

      if (authError || !authData.user) {
        return false;
      }

      // Create super admin profile
      const { error: profileError } = await supabase
        .from('super_admins')
        .insert({
          id: authData.user.id,
          email,
          name
        });

      if (profileError) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Super admin creation failed:', error);
      return false;
    }
  };

  const loginSuperAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        return false;
      }

      // Verify user is a super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', data.user.id)
        .single();

      return !!superAdmin;
    } catch (error) {
      console.error('Super admin login failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string, domain: string): Promise<boolean> => {
    try {
      // Find restaurant by domain
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id')
        .eq('domain', domain)
        .single();

      if (!restaurantData) {
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        return false;
      }

      // Verify user belongs to this restaurant
      const { data: userData } = await supabase
        .from('users')
        .select('restaurant_id')
        .eq('id', data.user.id)
        .eq('restaurant_id', restaurantData.id)
        .single();

      return !!userData;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRestaurant(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
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

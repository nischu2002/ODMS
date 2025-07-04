
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { User as AppUser, Restaurant } from '../types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  restaurant: Restaurant | null;
  login: (email: string, password: string, domain: string) => Promise<{ success: boolean; error?: string }>;
  loginSuperAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  createSuperAdmin: (email: string, password: string, name: string) => Promise<boolean>;
  registerRestaurant: (data: any) => Promise<{ success: boolean; domain?: string; error?: string }>;
  createStaffAccount: (data: any) => Promise<{ success: boolean; error?: string }>;
  createRiderAccount: (data: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(initialSession);
        
        if (initialSession?.user) {
          await loadUserData(initialSession.user);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          setTimeout(async () => {
            if (mounted) {
              await loadUserData(session.user);
            }
          }, 0);
        } else {
          setUser(null);
          setRestaurant(null);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (authUser: User) => {
    try {
      // Check if user is a super admin first
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

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
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

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
            .maybeSingle();

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
      
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('domain', domain)
        .maybeSingle();

      if (existingRestaurant) {
        return { success: false, error: `Domain "${domain}" already exists. Please choose a different restaurant name.` };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.adminPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          return { success: false, error: `Email "${data.adminEmail}" already exists. Please use a different email.` };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

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

  const createStaffAccount = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!restaurant?.id) {
        return { success: false, error: 'Restaurant not found' };
      }

      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create auth account' };
      }

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          restaurant_id: restaurant.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: 'restaurant_staff',
          is_active: true
        });

      if (userError) {
        return { success: false, error: userError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating staff account:', error);
      return { success: false, error: 'Failed to create staff account' };
    }
  };

  const createRiderAccount = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!restaurant?.id) {
        return { success: false, error: 'Restaurant not found' };
      }

      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create auth account' };
      }

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          restaurant_id: restaurant.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: 'rider',
          is_active: true
        });

      if (userError) {
        return { success: false, error: userError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating rider account:', error);
      return { success: false, error: 'Failed to create rider account' };
    }
  };

  const createSuperAdmin = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const formattedEmail = email.includes('@') ? email : `${email}@admin.local`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formattedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      if (authError || !authData.user) {
        return false;
      }

      const { error: profileError } = await supabase
        .from('super_admins')
        .insert({
          id: authData.user.id,
          email: formattedEmail,
          name
        });

      return !profileError;
    } catch (error) {
      console.error('Super admin creation failed:', error);
      return false;
    }
  };

  const loginSuperAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      const formattedEmail = email.includes('@') ? email : `${email}@admin.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password
      });

      if (error || !data.user) {
        return false;
      }

      // Verify user is a super admin
      const { data: authSuperAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      return !!authSuperAdmin;
    } catch (error) {
      console.error('Super admin login failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string, domain: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: restaurantData, error: domainError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('domain', domain)
        .maybeSingle();

      if (domainError) {
        return { success: false, error: 'Database error during login. Please try again.' };
      }

      if (!restaurantData) {
        return { success: false, error: `Domain "${domain}" not found. Please check your restaurant domain.` };
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials.' };
        }
        if (!authError.message.includes('email_not_confirmed') && !authError.message.includes('Email not confirmed')) {
          return { success: false, error: authError.message };
        }
      }

      if (!authData.user) {
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('restaurant_id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError) {
        return { success: false, error: 'User verification failed. Please contact support.' };
      }

      if (!userData) {
        return { success: false, error: 'User profile not found. Please contact support.' };
      }

      if (userData.restaurant_id !== restaurantData.id) {
        return { success: false, error: `This account is not associated with domain "${domain}". Please check your domain.` };
      }

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRestaurant(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setSession(null);
      setRestaurant(null);
      window.location.href = '/';
    }
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
      registerRestaurant,
      createStaffAccount,
      createRiderAccount
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

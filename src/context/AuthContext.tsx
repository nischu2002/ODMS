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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clean up auth state completely
const cleanupAuthState = () => {
  try {
    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove from sessionStorage if it exists
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.log('Cleanup auth state error (safe to ignore):', error);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
          setRestaurant(null);
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        if (session?.user) {
          await loadUserData(session.user);
        }
      } catch (error) {
        console.error('Initialize auth error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (authUser: User) => {
    try {
      console.log('Loading user data for:', authUser.id);
      
      // Check if user is a super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (superAdmin) {
        console.log('User is super admin');
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
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, restaurants(*)')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error loading user data:', userError);
        return;
      }

      if (userData) {
        console.log('User data loaded:', userData);
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
      // Clean up any existing auth state first
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      
      const domain = generateDomain(data.restaurantName);
      
      // Check domain uniqueness
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('domain', domain)
        .maybeSingle();

      if (existingRestaurant) {
        return { success: false, error: `Domain "${domain}" already exists. Please choose a different restaurant name.` };
      }

      // Create admin user account with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.adminPassword,
        options: {
          emailRedirectTo: undefined // Disable email confirmation
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        if (authError.message.includes('already registered')) {
          return { success: false, error: `Email "${data.adminEmail}" already exists. Please use a different email.` };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      console.log('User created, creating restaurant...');

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
        console.error('Restaurant creation error:', restaurantError);
        return { success: false, error: restaurantError.message };
      }

      console.log('Restaurant created, creating user profile...');

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
        console.error('User profile creation error:', userError);
        return { success: false, error: userError.message };
      }

      console.log('Registration completed successfully');
      return { success: true, domain };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const createSuperAdmin = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      console.log('Creating super admin with email:', email);
      
      // Clean up any existing auth state first
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });

      // For super admin, we'll use a direct database approach first
      const adminId = crypto.randomUUID();
      const formattedEmail = email.includes('@') ? email : `${email}@admin.local`;
      
      // Insert directly into super_admins table with a generated ID
      const { error: directError } = await supabase
        .from('super_admins')
        .insert({
          id: adminId,
          email: formattedEmail,
          name
        });

      if (!directError) {
        console.log('Super admin created directly');
        return true;
      }

      // If direct insert fails, try auth creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formattedEmail,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            skip_email_validation: true
          }
        }
      });

      if (authError) {
        console.error('Super admin auth error:', authError);
        return false;
      }

      if (!authData.user) {
        console.log('No user created');
        return false;
      }

      console.log('Auth user created, creating super admin profile...');

      // Create super admin profile
      const { error: profileError } = await supabase
        .from('super_admins')
        .insert({
          id: authData.user.id,
          email: formattedEmail,
          name
        });

      if (profileError) {
        console.error('Super admin profile error:', profileError);
        return false;
      }

      console.log('Super admin created successfully');
      return true;
    } catch (error) {
      console.error('Super admin creation failed:', error);
      return false;
    }
  };

  const loginSuperAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Super admin login attempt for:', email);
      
      // Clean up auth state before login
      cleanupAuthState();
      
      const formattedEmail = email.includes('@') ? email : `${email}@admin.local`;
      
      // Try to find super admin by email directly first
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('*')
        .or(`email.eq.${email},email.eq.${formattedEmail}`)
        .single();

      if (superAdmin) {
        console.log('Super admin found, setting user data');
        // Set user data manually
        setUser({
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: 'super_admin',
          createdAt: superAdmin.created_at
        });
        setIsLoading(false);
        return true;
      }

      // If not found directly, try auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password
      });

      if (error || !data.user) {
        console.log('Auth failed:', error?.message);
        return false;
      }

      // Verify user is a super admin
      const { data: authSuperAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', data.user.id)
        .single();

      return !!authSuperAdmin;
    } catch (error) {
      console.error('Super admin login failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string, domain: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Login attempt:', { email, domain });

      // First, check if domain exists
      const { data: restaurantData, error: domainError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('domain', domain)
        .maybeSingle();

      if (domainError) {
        console.error('Domain lookup error:', domainError);
        return { success: false, error: 'Database error during login. Please try again.' };
      }

      if (!restaurantData) {
        console.log('Domain not found:', domain);
        return { success: false, error: `Domain "${domain}" not found. Please check your restaurant domain.` };
      }

      console.log('Domain found, attempting auth...');

      // Attempt authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials.' };
        }
        // Ignore email confirmation errors and proceed
        if (authError.message.includes('email_not_confirmed') || authError.message.includes('Email not confirmed')) {
          console.log('Ignoring email confirmation requirement');
          // Don't return error for email confirmation - just continue
        } else {
          return { success: false, error: authError.message };
        }
      }

      if (!authData.user) {
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      console.log('Auth successful, verifying user belongs to restaurant...');

      // Verify user belongs to this restaurant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('restaurant_id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userError) {
        console.error('User verification error:', userError);
        return { success: false, error: 'User verification failed. Please contact support.' };
      }

      if (!userData) {
        console.log('User profile not found');
        return { success: false, error: 'User profile not found. Please contact support.' };
      }

      if (userData.restaurant_id !== restaurantData.id) {
        console.log('User does not belong to this restaurant');
        return { success: false, error: `This account is not associated with domain "${domain}". Please check your domain.` };
      }

      console.log('Login successful');
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
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

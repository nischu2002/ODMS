
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2, Store, UserCog, Truck } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if domain is provided in URL params
    const urlDomain = searchParams.get('domain');
    if (urlDomain) {
      setDomain(urlDomain);
      setActiveTab('admin'); // Default to admin tab for domain-specific login
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate domain is provided for restaurant users
      if (!domain && activeTab !== 'super_admin') {
        toast({
          title: "Domain Required",
          description: "Please enter your restaurant domain.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const success = await login(email, password, activeTab === 'super_admin' ? undefined : domain);
      
      if (success) {
        toast({
          title: "Login successful",
          description: "Welcome to ODMS!",
        });
        
        // Navigate based on role
        if (activeTab === 'admin') {
          navigate('/restaurant-admin');
        } else if (activeTab === 'restaurant') {
          navigate('/restaurant');
        } else if (activeTab === 'rider') {
          navigate('/rider');
        } else {
          navigate('/super-admin');
        }
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials or domain. Please check your details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoCredentials = (role: string) => {
    switch (role) {
      case 'admin':
        return { email: 'admin@restaurant.com', password: 'admin123', domain: 'demo-restaurant' };
      case 'restaurant':
        return { email: 'staff@restaurant.com', password: 'staff123', domain: 'demo-restaurant' };
      case 'rider':
        return { email: 'rider@delivery.com', password: 'rider123', domain: 'demo-restaurant' };
      case 'super_admin':
        return { email: 'superadmin@odms.com', password: 'superadmin123', domain: '' };
      default:
        return { email: '', password: '', domain: '' };
    }
  };

  const fillDemoCredentials = () => {
    const creds = getDemoCredentials(activeTab);
    setEmail(creds.email);
    setPassword(creds.password);
    if (creds.domain) {
      setDomain(creds.domain);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {domain ? (
            <>
              <CardTitle className="text-2xl font-bold">{domain}.odms.com</CardTitle>
              <CardDescription>
                Restaurant Management Portal
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold">ODMS Login</CardTitle>
              <CardDescription>
                Restaurant Order & Delivery Management
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="admin" className="flex items-center gap-1">
                <UserCog className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="restaurant" className="flex items-center gap-1">
                <Store className="h-4 w-4" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="rider" className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                Rider
              </TabsTrigger>
              <TabsTrigger value="super_admin" className="flex items-center gap-1 text-xs">
                Super
              </TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              {activeTab !== 'super_admin' && (
                <div className="space-y-2">
                  <Label htmlFor="domain">Restaurant Domain</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="restaurant-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">Enter your restaurant's domain (without .odms.com)</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={fillDemoCredentials}
              >
                Use Demo Credentials
              </Button>
            </form>
            
            <TabsContent value="admin" className="mt-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Restaurant Admin Access:</strong></p>
                <p>• Manage restaurant operations</p>
                <p>• View restaurant analytics</p>
                <p>• Manage staff and riders</p>
              </div>
            </TabsContent>
            
            <TabsContent value="restaurant" className="mt-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Restaurant Staff Access:</strong></p>
                <p>• Manage orders and kitchen</p>
                <p>• Assign deliveries</p>
                <p>• View daily insights</p>
              </div>
            </TabsContent>
            
            <TabsContent value="rider" className="mt-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Delivery Rider Access:</strong></p>
                <p>• View assigned deliveries</p>
                <p>• Update delivery status</p>
                <p>• GPS tracking enabled</p>
              </div>
            </TabsContent>
          </Tabs>

          {activeTab !== 'super_admin' && (
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Don't have an account? 
                <Button variant="link" onClick={() => navigate('/signup')} className="p-0 ml-1">
                  Create Restaurant Account
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { loginSuperAdmin, createSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in as super admin
  React.useEffect(() => {
    if (user && user.role === 'super_admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let success = false;
      
      if (isSignup) {
        if (!name.trim()) {
          toast({
            title: "Name required",
            description: "Please enter your full name.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          toast({
            title: "Password too short",
            description: "Password must be at least 6 characters long.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        console.log('Creating super admin account...');
        success = await createSuperAdmin(email, password, name);
        if (success) {
          toast({
            title: "Super Admin account created",
            description: "Account created successfully! You can now sign in.",
          });
          setIsSignup(false);
          setEmail('');
          setPassword('');
          setName('');
        } else {
          toast({
            title: "Account creation failed",
            description: "Failed to create super admin account. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log('Logging in super admin...');
        success = await loginSuperAdmin(email, password);
        if (success) {
          toast({
            title: "Login successful",
            description: "Welcome back, Super Admin!",
          });
          // Navigate will happen via useEffect when user state updates
        } else {
          toast({
            title: "Login failed",
            description: "Invalid credentials. Please check your email and password.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Super admin auth error:', error);
      toast({
        title: isSignup ? "Signup error" : "Login error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Super Admin Access
          </CardTitle>
          <CardDescription>
            {isSignup ? 'Create Super Admin Account' : 'ODMS System Administration'}
          </CardDescription>
          <div className="text-xs text-gray-500 mt-2">
            {isSignup ? 'Create your admin account' : 'Use your admin credentials to access the system'}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username *</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isSignup ? 6 : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {isSignup && (
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              )}
            </div>
            
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignup ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                isSignup ? 'Create Super Admin Account' : 'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="link" 
              onClick={() => {
                setIsSignup(!isSignup);
                setEmail('');
                setPassword('');
                setName('');
                setShowPassword(false);
              }}
              className="text-red-600"
              disabled={isLoading}
            >
              {isSignup ? 'Already have an account? Sign In' : 'Need to create an account? Sign Up'}
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate('/')} className="text-gray-600">
              Back to Main Site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

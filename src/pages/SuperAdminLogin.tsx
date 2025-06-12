
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  
  const { loginSuperAdmin, createSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let success = false;
      
      if (isSignup) {
        success = await createSuperAdmin(email, password, name);
        if (success) {
          toast({
            title: "Super Admin account created",
            description: "Welcome to ODMS Super Admin!",
          });
        }
      } else {
        success = await loginSuperAdmin(email, password);
        if (success) {
          toast({
            title: "Login successful",
            description: "Welcome back, Super Admin!",
          });
        }
      }
      
      if (success) {
        navigate('/super-admin');
      } else {
        toast({
          title: isSignup ? "Signup failed" : "Login failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: isSignup ? "Signup error" : "Login error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('superadmin@odms.com');
    setPassword('superadmin123');
    if (isSignup) {
      setName('Super Administrator');
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
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
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
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={fillDemoCredentials}
            >
              Use Demo Credentials
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="link" 
              onClick={() => setIsSignup(!isSignup)}
              className="text-red-600"
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

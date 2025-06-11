
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Loader2, Store, ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useForm } from 'react-hook-form';
import { RestaurantRegistration } from '../types';

export default function RestaurantSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<RestaurantRegistration>({
    defaultValues: {
      restaurantName: '',
      businessType: '',
      adminEmail: '',
      adminPassword: '',
      ownerName: '',
      phone: '',
      address: '',
    },
  });

  const businessTypes = [
    'Fast Food',
    'Fine Dining',
    'Casual Dining',
    'Cafe/Coffee Shop',
    'Bakery',
    'Pizza',
    'Asian Cuisine',
    'Italian Cuisine',
    'Mexican Cuisine',
    'Indian Cuisine',
    'Desserts/Ice Cream',
    'Healthy/Organic',
    'Other'
  ];

  const generateDomain = (restaurantName: string) => {
    return restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const onSubmit = async (data: RestaurantRegistration) => {
    setIsLoading(true);

    try {
      // Simulate API call for restaurant registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const domain = generateDomain(data.restaurantName);
      
      // Store registration data temporarily (in real app, this would be sent to backend)
      localStorage.setItem('registrationData', JSON.stringify({
        ...data,
        domain,
        registrationComplete: true
      }));

      toast({
        title: "Registration Successful!",
        description: `Your domain ${domain}.odms.com has been created.`,
      });

      // Redirect to domain setup page
      navigate(`/setup/${domain}`);
      
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="absolute left-4 top-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Store className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Join ODMS</CardTitle>
            <CardDescription className="text-lg">
              Create your restaurant account and get your custom domain
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="restaurantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter restaurant name" {...field} required />
                        </FormControl>
                        <FormMessage />
                        {field.value && (
                          <p className="text-sm text-blue-600">
                            Domain: {generateDomain(field.value)}.odms.com
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner/Manager Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter complete restaurant address" 
                          {...field} 
                          required 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Admin Account Setup</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="admin@restaurant.com" 
                              {...field} 
                              required 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="adminPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Password *</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create secure password" 
                              {...field} 
                              required 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Your Account...
                    </>
                  ) : (
                    'Create Restaurant Account'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Already have an account? 
                <Button variant="link" onClick={() => navigate('/login')} className="p-0 ml-1">
                  Sign in here
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

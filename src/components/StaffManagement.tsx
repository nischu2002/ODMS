
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  restaurantId: string;
  isActive: boolean;
  createdAt: string;
}

export const StaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'restaurant_staff',
    password: '',
    confirmPassword: ''
  });
  const { restaurant } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (restaurant) {
      loadStaff();
    }
  }, [restaurant]);

  const loadStaff = async () => {
    if (!restaurant) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'restaurant_staff');

      if (error) throw error;

      const formattedStaff: Staff[] = data?.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        restaurantId: user.restaurant_id!,
        isActive: user.is_active,
        createdAt: user.created_at
      })) || [];

      setStaff(formattedStaff);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({ 
        title: "Error loading staff", 
        description: "Failed to load staff members",
        variant: "destructive" 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant) return;

    // Validate passwords match for new staff
    if (!editingStaff && formData.password !== formData.confirmPassword) {
      toast({ 
        title: "Password mismatch", 
        description: "Passwords do not match",
        variant: "destructive" 
      });
      return;
    }

    if (!editingStaff && formData.password.length < 6) {
      toast({ 
        title: "Password too short", 
        description: "Password must be at least 6 characters",
        variant: "destructive" 
      });
      return;
    }

    try {
      if (editingStaff) {
        // Update existing staff
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null
          })
          .eq('id', editingStaff.id);

        if (error) throw error;

        toast({ title: "Staff member updated successfully" });
        setEditingStaff(null);
      } else {
        // Create new staff member
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/staff-dashboard`
          }
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('Failed to create user account');
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            restaurant_id: restaurant.id,
            email: formData.email,
            name: formData.name,
            role: 'restaurant_staff',
            phone: formData.phone || null
          });

        if (profileError) throw profileError;

        toast({ title: "Staff member added successfully" });
      }
      
      setFormData({ name: '', email: '', phone: '', role: 'restaurant_staff', password: '', confirmPassword: '' });
      setShowAddForm(false);
      await loadStaff();
    } catch (error: any) {
      console.error('Error managing staff:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to manage staff member",
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      role: staffMember.role,
      password: '',
      confirmPassword: ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', staffId);

      if (error) throw error;
      
      await loadStaff();
      toast({ title: "Staff member deactivated" });
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast({ 
        title: "Error", 
        description: "Failed to deactivate staff member",
        variant: "destructive" 
      });
    }
  };

  const toggleStatus = async (staffId: string) => {
    try {
      const staffMember = staff.find(s => s.id === staffId);
      if (!staffMember) return;

      const { error } = await supabase
        .from('users')
        .update({ is_active: !staffMember.isActive })
        .eq('id', staffId);

      if (error) throw error;
      
      await loadStaff();
      toast({ title: "Staff status updated" });
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update staff status",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={!!editingStaff}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                {!editingStaff && (
                  <>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingStaff ? 'Update' : 'Add'} Staff Member
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingStaff(null);
                    setFormData({ name: '', email: '', phone: '', role: 'restaurant_staff', password: '', confirmPassword: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Staff ({staff.length})
          </CardTitle>
          <CardDescription>Manage your restaurant staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staff.map((staffMember) => (
              <div key={staffMember.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{staffMember.name}</h3>
                  <p className="text-sm text-gray-600">{staffMember.email}</p>
                  <p className="text-sm text-gray-600">{staffMember.phone || 'No phone'}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    staffMember.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {staffMember.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStatus(staffMember.id)}
                  >
                    {staffMember.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(staffMember)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(staffMember.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {staff.length === 0 && (
              <p className="text-center text-gray-500 py-8">No staff members added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

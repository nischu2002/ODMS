
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, User, Mail, Phone } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const StaffManagement = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'restaurant_staff'
  });
  const { restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch staff for the restaurant
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['restaurant-staff', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'restaurant_staff')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StaffMember[];
    },
    enabled: !!restaurant?.id
  });

  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (staffData: any) => {
      if (!restaurant?.id) throw new Error('Restaurant not found');

      // For now, we'll just create the user record without auth
      // In a real app, you'd want to handle user authentication separately
      const { data, error } = await supabase
        .from('users')
        .insert({
          restaurant_id: restaurant.id,
          name: staffData.name,
          email: staffData.email,
          phone: staffData.phone,
          role: 'restaurant_staff',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff', restaurant?.id] });
      toast({ title: "Staff member added successfully" });
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating staff:', error);
      toast({ title: "Error adding staff member", variant: "destructive" });
    }
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, ...staffData }: StaffMember) => {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: staffData.name,
          email: staffData.email,
          phone: staffData.phone,
          role: staffData.role
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff', restaurant?.id] });
      toast({ title: "Staff member updated successfully" });
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating staff:', error);
      toast({ title: "Error updating staff member", variant: "destructive" });
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff', restaurant?.id] });
      toast({ title: "Staff status updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating staff status:', error);
      toast({ title: "Error updating staff status", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', role: 'restaurant_staff' });
    setShowAddForm(false);
    setEditingStaff(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStaff) {
      updateStaffMutation.mutate({ ...editingStaff, ...formData });
    } else {
      createStaffMutation.mutate(formData);
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role
    });
    setShowAddForm(true);
  };

  const handleToggleActive = (staff: StaffMember) => {
    toggleActiveMutation.mutate({ id: staff.id, is_active: staff.is_active });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading staff...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Restaurant Staff Management</h2>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="restaurant_staff">Kitchen Staff</option>
                    <option value="restaurant_staff">Server</option>
                    <option value="restaurant_staff">Manager</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                >
                  {createStaffMutation.isPending || updateStaffMutation.isPending 
                    ? 'Saving...' 
                    : editingStaff ? 'Update Staff Member' : 'Add Staff Member'
                  }
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({staff.length})</CardTitle>
          <CardDescription>Manage your restaurant staff</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone || 'N/A'}</TableCell>
                  <TableCell className="capitalize">{member.role.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(member)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={member.is_active ? "destructive" : "default"}
                        onClick={() => handleToggleActive(member)}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {member.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {staff.length === 0 && (
            <p className="text-center text-gray-500 py-8">No staff members yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

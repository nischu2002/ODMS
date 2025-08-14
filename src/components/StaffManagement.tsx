
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Eye, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const StaffManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'restaurant_staff'
  });

  const { restaurant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch staff members
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff', restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'restaurant_staff')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Staff[];
    },
    enabled: !!restaurant?.id
  });

  // Create staff mutation - Fixed to prevent admin logout
  const createStaffMutation = useMutation({
    mutationFn: async (staffData: typeof newStaff) => {
      if (!restaurant?.id) throw new Error('No restaurant selected');

      // Use the edge function to create user account with admin privileges
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: staffData.email,
          password: staffData.password,
          user_metadata: {
            name: staffData.name,
            role: staffData.role,
            restaurant_id: restaurant.id
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // Insert user data into our users table
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            name: staffData.name,
            email: staffData.email,
            phone: staffData.phone,
            role: staffData.role,
            restaurant_id: restaurant.id,
            is_active: true
          });

        if (userError) throw userError;
      }

      return data?.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', restaurant?.id] });
      toast({ title: "Staff member created successfully" });
      setShowCreateForm(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'restaurant_staff'
      });
    },
    onError: (error: any) => {
      console.error('Error creating staff:', error);
      toast({ 
        title: "Error creating staff member", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ staffId, updates }: { staffId: string; updates: Partial<Staff> }) => {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', staffId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', restaurant?.id] });
      toast({ title: "Staff member updated successfully" });
      setEditingStaff(null);
    },
    onError: (error) => {
      console.error('Error updating staff:', error);
      toast({ title: "Error updating staff member", variant: "destructive" });
    }
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', restaurant?.id] });
      toast({ title: "Staff member deleted successfully" });
    },
    onError: (error) => {
      console.error('Error deleting staff:', error);
      toast({ title: "Error deleting staff member", variant: "destructive" });
    }
  });

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleStaffStatus = (staffId: string, currentStatus: boolean) => {
    updateStaffMutation.mutate({
      staffId,
      updates: { is_active: !currentStatus }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading staff...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="restaurant_staff">Restaurant Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Create Staff Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Staff Member</CardTitle>
            <CardDescription>Create a new staff account for your restaurant</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              createStaffMutation.mutate(newStaff);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={createStaffMutation.isPending}>
                  {createStaffMutation.isPending ? 'Creating...' : 'Create Staff Member'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          <CardDescription>Manage your restaurant staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStaffStatus(member.id, member.is_active)}
                      >
                        {member.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteStaffMutation.mutate(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredStaff.length === 0 && (
            <p className="text-center text-gray-500 py-8">No staff members found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

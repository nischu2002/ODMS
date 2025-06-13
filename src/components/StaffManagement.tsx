
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
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
    role: 'kitchen_staff',
    password: '',
    confirmPassword: ''
  });
  const { restaurant } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadStaff();
  }, [restaurant]);

  const loadStaff = () => {
    if (!restaurant) return;
    
    const existingStaff = localStorage.getItem(`staff_${restaurant.id}`);
    if (existingStaff) {
      setStaff(JSON.parse(existingStaff));
    }
  };

  const saveStaff = (staffList: Staff[]) => {
    if (!restaurant) return;
    localStorage.setItem(`staff_${restaurant.id}`, JSON.stringify(staffList));
    setStaff(staffList);
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    if (editingStaff) {
      const updatedStaff = staff.map(s => 
        s.id === editingStaff.id 
          ? { ...editingStaff, name: formData.name, email: formData.email, phone: formData.phone, role: formData.role }
          : s
      );
      saveStaff(updatedStaff);
      toast({ title: "Staff member updated successfully" });
      setEditingStaff(null);
    } else {
      const newStaff: Staff = {
        id: 'staff-' + Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        restaurantId: restaurant.id,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Add to users table for login
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const newUser = {
        id: newStaff.id,
        restaurantId: restaurant.id,
        email: formData.email,
        password: formData.password, // In production, this should be hashed
        name: formData.name,
        role: 'restaurant_staff',
        createdAt: new Date().toISOString()
      };
      allUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(allUsers));

      saveStaff([...staff, newStaff]);
      toast({ title: "Staff member added successfully" });
    }
    
    setFormData({ name: '', email: '', phone: '', role: 'kitchen_staff', password: '', confirmPassword: '' });
    setShowAddForm(false);
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      password: '',
      confirmPassword: ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (staffId: string) => {
    const updatedStaff = staff.filter(s => s.id !== staffId);
    saveStaff(updatedStaff);
    
    // Remove from users table
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.filter((u: any) => u.id !== staffId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    toast({ title: "Staff member removed" });
  };

  const toggleStatus = (staffId: string) => {
    const updatedStaff = staff.map(s => 
      s.id === staffId ? { ...s, isActive: !s.isActive } : s
    );
    saveStaff(updatedStaff);
    toast({ title: "Staff status updated" });
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
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="kitchen_staff">Kitchen Staff</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="waiter">Waiter</option>
                  </select>
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
                    setFormData({ name: '', email: '', phone: '', role: 'kitchen_staff', password: '', confirmPassword: '' });
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
                  <p className="text-sm text-gray-600">{staffMember.phone}</p>
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

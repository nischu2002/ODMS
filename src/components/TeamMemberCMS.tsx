import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ModernNavbar from './ModernNavbar';
import ModernFooter from './ModernFooter';
import { ArrowLeft, Plus, Edit, Trash2, User, Upload, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  description: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

interface TeamMemberFormData {
  name: string;
  position: string;
  email: string;
  phone: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface TeamMemberCMSProps {
  onClose: () => void;
}

export const TeamMemberCMS = ({ onClose }: TeamMemberCMSProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: '',
    position: '',
    email: '',
    phone: '',
    description: '',
    image_url: '',
    is_active: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team members with error handling for missing table
  const { data: teamMembers = [], isLoading, error } = useQuery({
    queryKey: ['team-members-cms'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Team members query error:', error);
          if (error.message.includes('relation "public.team_members" does not exist')) {
            setTableExists(false);
            return [];
          }
          throw error;
        }
        setTableExists(true);
        return data as TeamMember[];
      } catch (error) {
        console.error('Error fetching team members:', error);
        setTableExists(false);
        return [];
      }
    },
    retry: false
  });

  // Create team member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (memberData: Omit<TeamMemberFormData, 'id'>) => {
      if (!tableExists) {
        throw new Error('Team members table does not exist. Please run the database migration first.');
      }

      const { error } = await supabase
        .from('team_members')
        .insert([memberData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members-cms'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: "Team member created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error creating team member:', error);
      toast({ title: "Error creating team member", variant: "destructive" });
    }
  });

  // Update team member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, ...memberData }: Partial<TeamMemberFormData> & { id: string }) => {
      if (!tableExists) {
        throw new Error('Team members table does not exist. Please run the database migration first.');
      }

      const { error } = await supabase
        .from('team_members')
        .update(memberData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members-cms'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: "Team member updated successfully" });
      resetForm();
      setIsDialogOpen(false);
      setEditingMember(null);
    },
    onError: (error) => {
      console.error('Error updating team member:', error);
      toast({ title: "Error updating team member", variant: "destructive" });
    }
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tableExists) {
        throw new Error('Team members table does not exist. Please run the database migration first.');
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members-cms'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: "Team member deleted successfully" });
    },
    onError: (error) => {
      console.error('Error deleting team member:', error);
      toast({ title: "Error deleting team member", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      email: '',
      phone: '',
      description: '',
      image_url: '',
      is_active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableExists) {
      toast({ 
        title: "Database table missing", 
        description: "Please run the database migration to create the team_members table",
        variant: "destructive" 
      });
      return;
    }
    
    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember.id, ...formData });
    } else {
      createMemberMutation.mutate(formData);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      position: member.position,
      email: member.email,
      phone: member.phone,
      description: member.description,
      image_url: member.image_url || '',
      is_active: member.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      deleteMemberMutation.mutate(id);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `team-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Error uploading image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Team Member Management</h1>
            </div>
            <Button
              onClick={() => {
                if (!tableExists) {
                  toast({ 
                    title: "Database table missing", 
                    description: "Please run the database migration to create the team_members table",
                    variant: "destructive" 
                  });
                  return;
                }
                resetForm();
                setEditingMember(null);
                setIsDialogOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!tableExists}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>

          {/* Warning Alert if table doesn't exist */}
          {!tableExists && (
            <Alert className="mb-8 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Database Migration Required:</strong> The team_members table doesn't exist yet. 
                Please run the database migration to create the table before managing team members.
              </AlertDescription>
            </Alert>
          )}

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({teamMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !tableExists ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-4">Database table not found</p>
                  <p className="text-gray-500 text-sm">
                    Run the database migration to create the team_members table
                  </p>
                </div>
              ) : teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teamMembers.map((member) => (
                    <Card key={member.id} className="relative overflow-hidden">
                      <div className="aspect-square overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                        {member.image_url ? (
                          <img
                            src={member.image_url}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-900">{member.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={member.is_active}
                              onCheckedChange={(checked) => 
                                updateMemberMutation.mutate({ 
                                  id: member.id, 
                                  is_active: checked 
                                })
                              }
                            />
                          </div>
                        </div>
                        <p className="text-blue-600 font-medium text-sm mb-2">{member.position}</p>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{member.description}</p>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(member)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(member.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No team members added yet</p>
                  <Button
                    onClick={() => {
                      resetForm();
                      setEditingMember(null);
                      setIsDialogOpen(true);
                    }}
                    className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={!tableExists}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Team Member
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
            <DialogDescription>
              {editingMember ? 'Update team member information' : 'Add a new team member to your organization'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="image">Profile Photo</Label>
              <div className="mt-2 space-y-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                {formData.image_url && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden border">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {isUploading && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Upload className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active (visible on public page)</Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMemberMutation.isPending || updateMemberMutation.isPending || isUploading || !tableExists}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {editingMember ? 'Update' : 'Create'} Team Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ModernFooter />
    </div>
  );
};

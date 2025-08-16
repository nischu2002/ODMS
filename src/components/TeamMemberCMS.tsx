import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import ModernNavbar from './ModernNavbar';
import ModernFooter from './ModernFooter';
import { toast } from './ui/use-toast';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  image_url: string;
  created_at?: string;
}

interface TeamMemberCMSProps {
  onClose?: () => void;
}

const TeamMemberCMS: React.FC<TeamMemberCMSProps> = ({ onClose }) => {
  const [open, setOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const queryClient = useQueryClient();

  const { data: teamMembers, isLoading, isError } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      return (data || []).map(member => ({
        id: member.id,
        name: member.name,
        position: member.position,
        bio: member.description || '',
        image_url: member.image_url || '',
        created_at: member.created_at
      }));
    }
  });

  const createTeamMemberMutation = useMutation({
    mutationFn: async (newMember: Omit<TeamMember, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert([{
          name: newMember.name,
          position: newMember.position,
          description: newMember.bio,
          image_url: newMember.image_url,
          email: '',
          phone: '',
          is_active: true
        }])
        .select('*')
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return {
        id: data.id,
        name: data.name,
        position: data.position,
        bio: data.description || '',
        image_url: data.image_url || '',
        created_at: data.created_at
      } as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setOpen(false);
      toast({
        title: 'Success',
        description: 'Team member created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTeamMemberMutation = useMutation({
    mutationFn: async (updatedMember: TeamMember) => {
      const { data, error } = await supabase
        .from('team_members')
        .update({
          name: updatedMember.name,
          position: updatedMember.position,
          description: updatedMember.bio,
          image_url: updatedMember.image_url
        })
        .eq('id', updatedMember.id)
        .select('*')
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return {
        id: data.id,
        name: data.name,
        position: data.position,
        bio: data.description || '',
        image_url: data.image_url || '',
        created_at: data.created_at
      } as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setEditMember(null);
      toast({
        title: 'Success',
        description: 'Team member updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTeamMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast({
        title: 'Success',
        description: 'Team member deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreate = async (newMember: Omit<TeamMember, 'id' | 'created_at'>) => {
    createTeamMemberMutation.mutate(newMember);
  };

  const handleUpdate = async (updatedMember: TeamMember) => {
    updateTeamMemberMutation.mutate(updatedMember);
  };

  const handleDelete = async (id: string) => {
    deleteTeamMemberMutation.mutate(id);
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching team members.</p>;

  return (
    <>
      <ModernNavbar />
      <div className="container py-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Our Team</CardTitle>
            <div className="flex gap-2">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Back
                </Button>
              )}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  <CreateTeamMemberForm onCreate={handleCreate} loading={createTeamMemberMutation.isPending} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {teamMembers?.map((member) => (
                <div key={member.id} className="border rounded-md p-4">
                  <div className="relative">
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-40 object-cover rounded-md mb-2"
                    />
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <Dialog open={editMember?.id === member.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setEditMember(null);
                        else setEditMember(member);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Edit Team Member</DialogTitle>
                          </DialogHeader>
                          <EditTeamMemberForm
                            member={member}
                            onUpdate={handleUpdate}
                            loading={updateTeamMemberMutation.isPending}
                            onCancel={() => setEditMember(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(member.id)}
                        disabled={deleteTeamMemberMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.position}</p>
                  <p className="text-sm mt-2">{member.bio}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <ModernFooter />
    </>
  );
};

interface CreateTeamMemberFormProps {
  onCreate: (newMember: Omit<TeamMember, 'id' | 'created_at'>) => void;
  loading: boolean;
}

const CreateTeamMemberForm: React.FC<CreateTeamMemberFormProps> = ({ onCreate, loading }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, position, bio, image_url: imageUrl });
    setName('');
    setPosition('');
    setBio('');
    setImageUrl('');
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="position">Position</Label>
        <Input type="text" id="position" value={position} onChange={(e) => setPosition(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input type="url" id="image_url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
};

interface EditTeamMemberFormProps {
  member: TeamMember;
  onUpdate: (updatedMember: TeamMember) => void;
  loading: boolean;
  onCancel: () => void;
}

const EditTeamMemberForm: React.FC<EditTeamMemberFormProps> = ({ member, onUpdate, loading, onCancel }) => {
  const [name, setName] = useState(member.name);
  const [position, setPosition] = useState(member.position);
  const [bio, setBio] = useState(member.bio);
  const [imageUrl, setImageUrl] = useState(member.image_url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...member, name, position, bio, image_url: imageUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="position">Position</Label>
        <Input type="text" id="position" value={position} onChange={(e) => setPosition(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input type="url" id="image_url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
      </div>
      <div className="flex justify-between">
        <Button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default TeamMemberCMS;

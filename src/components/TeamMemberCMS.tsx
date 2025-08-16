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

const TeamMemberCMS = () => {
  const [open, setOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const queryClient = useQueryClient();

  const { data: teamMembers, isLoading, isError } = useQuery<TeamMember[]>('teamMembers', async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  });

  const { mutate: createTeamMember, isLoading: isCreateLoading } = useMutation(
    async (newMember: Omit<TeamMember, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert([newMember])
        .select('*')
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return data as TeamMember;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teamMembers');
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
    }
  );

  const { mutate: updateTeamMember, isLoading: isUpdateLoading } = useMutation(
    async (updatedMember: TeamMember) => {
      const { data, error } = await supabase
        .from('team_members')
        .update(updatedMember)
        .eq('id', updatedMember.id)
        .select('*')
        .single();
      if (error) {
        throw new Error(error.message);
      }
      return data as TeamMember;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teamMembers');
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
    }
  );

  const { mutate: deleteTeamMember, isLoading: isDeleteLoading } = useMutation(
    async (id: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teamMembers');
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
    }
  );

  const handleCreate = async (newMember: Omit<TeamMember, 'id' | 'created_at'>) => {
    createTeamMember(newMember);
  };

  const handleUpdate = async (updatedMember: TeamMember) => {
    updateTeamMember(updatedMember);
  };

  const handleDelete = async (id: string) => {
    deleteTeamMember(id);
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
                <CreateTeamMemberForm onCreate={handleCreate} loading={isCreateLoading} />
              </DialogContent>
            </Dialog>
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
                            loading={isUpdateLoading}
                            onCancel={() => setEditMember(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(member.id)}
                        disabled={isDeleteLoading}
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

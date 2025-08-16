
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TeamMemberCMS from './TeamMemberCMS';
import { 
  Globe, 
  FileText, 
  Image, 
  Users,
  Save,
  Eye,
  Edit
} from 'lucide-react';

interface CMSContent {
  id?: string;
  section: string;
  title: string;
  content: string;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CMSUpdateData {
  section: string;
  title: string;
  content: string;
  image_url?: string;
  is_active: boolean;
}

export const CMSManager = () => {
  const [activeTab, setActiveTab] = useState('landing');
  const [showTeamCMS, setShowTeamCMS] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch CMS content
  const { data: cmsContent = [], isLoading } = useQuery({
    queryKey: ['cms-content'],
    queryFn: async (): Promise<CMSContent[]> => {
      try {
        const { data, error } = await supabase
          .from('cms_content')
          .select('*')
          .order('section', { ascending: true });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        return (data || []) as CMSContent[];
      } catch (error) {
        console.error('Error fetching CMS content:', error);
        return [] as CMSContent[];
      }
    }
  });

  // Update CMS content mutation
  const updateContentMutation = useMutation({
    mutationFn: async (content: CMSUpdateData) => {
      const { error } = await supabase
        .from('cms_content')
        .upsert(content);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content'] });
      toast({ title: "Content updated successfully" });
    },
    onError: (error) => {
      console.error('Error updating content:', error);
      toast({ title: "Error updating content", variant: "destructive" });
    }
  });

  const handleSaveContent = (section: string, title: string, content: string, imageUrl?: string) => {
    updateContentMutation.mutate({
      section,
      title,
      content,
      image_url: imageUrl,
      is_active: true
    });
  };

  if (showTeamCMS) {
    return <TeamMemberCMS onClose={() => setShowTeamCMS(false)} />;
  }

  const renderLandingPageCMS = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Hero Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hero-title">Main Title</Label>
              <Input id="hero-title" placeholder="Enter hero title" />
            </div>
            <div>
              <Label htmlFor="hero-subtitle">Subtitle</Label>
              <Textarea id="hero-subtitle" placeholder="Enter hero subtitle" />
            </div>
            <div>
              <Label htmlFor="hero-cta">Call to Action Text</Label>
              <Input id="hero-cta" placeholder="Get Started" />
            </div>
            <Button onClick={() => handleSaveContent('hero', 'Hero Section', 'Hero content')}>
              <Save className="h-4 w-4 mr-2" />
              Save Hero Section
            </Button>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Features Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="features-title">Section Title</Label>
              <Input id="features-title" placeholder="Why Choose Us?" />
            </div>
            <div>
              <Label htmlFor="features-description">Description</Label>
              <Textarea id="features-description" placeholder="Section description" />
            </div>
            <Button onClick={() => handleSaveContent('features', 'Features Section', 'Features content')}>
              <Save className="h-4 w-4 mr-2" />
              Save Features
            </Button>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              About Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="about-title">About Title</Label>
              <Input id="about-title" placeholder="About ODMS" />
            </div>
            <div>
              <Label htmlFor="about-content">About Content</Label>
              <Textarea id="about-content" placeholder="About us content" rows={4} />
            </div>
            <Button onClick={() => handleSaveContent('about', 'About Section', 'About content')}>
              <Save className="h-4 w-4 mr-2" />
              Save About
            </Button>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contact Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input id="contact-email" type="email" placeholder="info@odms.com" />
            </div>
            <div>
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input id="contact-phone" placeholder="+1 234 567 8900" />
            </div>
            <div>
              <Label htmlFor="contact-address">Address</Label>
              <Textarea id="contact-address" placeholder="Company address" />
            </div>
            <Button onClick={() => handleSaveContent('contact', 'Contact Section', 'Contact content')}>
              <Save className="h-4 w-4 mr-2" />
              Save Contact
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">CMS Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="landing" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Landing Page
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="landing">
          {renderLandingPageCMS()}
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Manage team member profiles for the public website</p>
                <Button onClick={() => setShowTeamCMS(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Edit className="h-4 w-4 mr-2" />
                  Open Team CMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload and manage images for the website</p>
                <Button>
                  <Image className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

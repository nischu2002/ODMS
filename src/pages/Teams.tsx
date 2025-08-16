
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import ModernNavbar from '../components/ModernNavbar';
import ModernFooter from '../components/ModernFooter';
import TeamMemberCMS from '../components/TeamMemberCMS';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  Settings, 
  AlertTriangle,
  Users as UsersIcon
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  description: string;
  image_url?: string;
  is_active: boolean;
}

export default function Teams() {
  const [showCMS, setShowCMS] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  // Check if user is super admin (simplified check)
  const { data: isSuperAdmin } = useQuery({
    queryKey: ['is-super-admin'],
    queryFn: async () => {
      try {
        const { data } = await supabase.rpc('is_super_admin');
        return data || false;
      } catch {
        return false;
      }
    }
  });

  // Fetch active team members with error handling
  const { data: teamMembers = [], isLoading, error } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('is_active', true)
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

  if (showCMS) {
    return <TeamMemberCMS onClose={() => setShowCMS(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our dedicated team of professionals working together to provide the best 
              order and delivery management solutions for restaurants worldwide.
            </p>
            
            {/* Super Admin CMS Access */}
            {isSuperAdmin && (
              <div className="mt-8">
                <Button
                  onClick={() => setShowCMS(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Team Members
                </Button>
              </div>
            )}
          </div>

          {/* Warning Alert if table doesn't exist */}
          {!tableExists && (
            <Alert className="mb-8 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Content Management System:</strong> The team members database table is not yet configured. 
                {isSuperAdmin && ' You can still access the CMS to set up the database.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Team Members Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !tableExists || teamMembers.length === 0 ? (
            <div className="text-center py-16">
              <UsersIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {!tableExists ? 'Team Profiles Coming Soon' : 'No Team Members Yet'}
              </h2>
              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                {!tableExists 
                  ? 'We\'re setting up our team profiles. Check back soon to meet the amazing people behind ODMS!'
                  : 'Our team profiles will be added soon. Stay tuned to meet the people behind ODMS!'
                }
              </p>
              
              {/* Featured Team Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[1, 2, 3].map((index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                    <CardContent className="p-6 text-center">
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded mb-4 animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded w-3/4 mx-auto animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Member Photo */}
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-20 w-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Member Info */}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <p className="text-blue-600 font-semibold mb-3">{member.position}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {member.description}
                    </p>
                    
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${member.email}`} className="hover:text-blue-600">
                          {member.email}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${member.phone}`} className="hover:text-blue-600">
                          {member.phone}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModernFooter />
    </div>
  );
}

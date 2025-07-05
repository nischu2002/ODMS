
import React, { useState } from 'react';
import { ModernNavbar } from '../components/ModernNavbar';
import { ModernFooter } from '../components/ModernFooter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { TeamMemberCMS } from '../components/TeamMemberCMS';
import { User, Mail, Phone, Users as UsersIcon, Plus } from 'lucide-react';

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

export default function Teams() {
  const [showCMS, setShowCMS] = useState(false);
  const { user } = useAuth();

  // Check if user is super admin
  const { data: isSuperAdmin } = useQuery({
    queryKey: ['is-super-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', user.id)
        .single();
      
      return !!data;
    },
    enabled: !!user?.id
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }
      
      return data as TeamMember[];
    }
  });

  if (showCMS && isSuperAdmin) {
    return <TeamMemberCMS onClose={() => setShowCMS(false)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <ModernNavbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 mb-8">
              <UsersIcon className="h-4 w-4 mr-2" />
              Meet Our Team
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              The People Behind
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block md:inline"> ODMS</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Our diverse team of passionate professionals is dedicated to revolutionizing restaurant operations 
              through innovative technology and exceptional service.
            </p>
            
            {isSuperAdmin && (
              <Button
                onClick={() => setShowCMS(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manage Team Members
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <Card key={member.id} className="group border-0 shadow-lg bg-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-medium mb-4">
                      {member.position}
                    </p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {member.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <a 
                          href={`mailto:${member.email}`}
                          className="hover:text-blue-600 transition-colors text-sm"
                        >
                          {member.email}
                        </a>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <a 
                          href={`tel:${member.phone}`}
                          className="hover:text-blue-600 transition-colors text-sm"
                        >
                          {member.phone}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <UsersIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Team Information Coming Soon
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                We're building an amazing team and will showcase our talented members here soon. 
                Stay tuned for updates!
              </p>
              {isSuperAdmin && (
                <Button
                  onClick={() => setShowCMS(true)}
                  className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Team Member
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <ModernFooter />
    </div>
  );
}

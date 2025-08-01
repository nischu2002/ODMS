
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MapPin, RefreshCw, Clock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface RiderLocation {
  id: string;
  rider_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  updated_at: string;
  rider_name?: string;
}

export const RiderLocationViewer = () => {
  const [riderLocations, setRiderLocations] = useState<RiderLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  const fetchRiderLocations = async () => {
    setLoading(true);
    try {
      const { data: locations, error } = await supabase
        .from('rider_locations')
        .select(`
          id,
          rider_id,
          latitude,
          longitude,
          accuracy,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching rider locations:', error);
        return;
      }

      // Fetch rider names
      const riderIds = locations?.map(loc => loc.rider_id) || [];
      const { data: riders } = await supabase
        .from('users')
        .select('id, name')
        .in('id', riderIds)
        .eq('role', 'rider');

      const locationsWithNames = locations?.map(location => ({
        ...location,
        rider_name: riders?.find(rider => rider.id === location.rider_id)?.name || 'Unknown Rider'
      })) || [];

      setRiderLocations(locationsWithNames);
    } catch (error) {
      console.error('Failed to fetch rider locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderLocations();
    
    // Clean up existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Set up real-time updates with unique channel name
    const channelName = `rider-locations-${user?.id || 'guest'}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rider_locations'
      }, () => {
        fetchRiderLocations();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  const openInMaps = (lat: number, lng: number, riderName: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&label=${encodeURIComponent(riderName)}`;
    window.open(url, '_blank');
  };

  const getLastUpdatedText = (updatedAt: string) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return updated.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Rider Locations
            </CardTitle>
            <Button 
              onClick={fetchRiderLocations} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {riderLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rider locations available</p>
              <p className="text-sm">Riders need to enable GPS tracking</p>
            </div>
          ) : (
            <div className="space-y-4">
              {riderLocations.map((location) => (
                <Card key={location.id} className="bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{location.rider_name}</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Lat: {location.latitude.toFixed(6)}</p>
                          <p>Lng: {location.longitude.toFixed(6)}</p>
                          {location.accuracy && (
                            <p>Accuracy: ±{location.accuracy.toFixed(0)}m</p>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{getLastUpdatedText(location.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openInMaps(location.latitude, location.longitude, location.rider_name || '')}
                        variant="outline"
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        View Map
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

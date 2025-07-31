
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MapPin, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

interface Location {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

export const RiderGPSTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setLocationError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy
        };

        setCurrentLocation(location);
        updateLocationInDatabase(location);
      },
      (error) => {
        setLocationError(error.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    // Store watch ID for cleanup
    localStorage.setItem('gps_watch_id', watchId.toString());
  };

  const stopTracking = () => {
    const watchId = localStorage.getItem('gps_watch_id');
    if (watchId) {
      navigator.geolocation.clearWatch(parseInt(watchId));
      localStorage.removeItem('gps_watch_id');
    }
    setIsTracking(false);
    toast({ title: "GPS tracking stopped" });
  };

  const updateLocationInDatabase = async (location: Location) => {
    try {
      const { error } = await supabase
        .from('rider_locations')
        .upsert({
          rider_id: user?.id,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
          updated_at: location.timestamp
        });

      if (error) {
        console.error('Error updating location:', error);
      }
    } catch (error) {
      console.error('Location update failed:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: position.coords.accuracy
        };

        setCurrentLocation(location);
        updateLocationInDatabase(location);
        toast({ title: "Location updated successfully" });
      },
      (error) => {
        setLocationError(error.message);
        toast({ 
          title: "Location error", 
          description: error.message,
          variant: "destructive" 
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const openInMaps = () => {
    if (currentLocation) {
      const url = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      const watchId = localStorage.getItem('gps_watch_id');
      if (watchId) {
        navigator.geolocation.clearWatch(parseInt(watchId));
        localStorage.removeItem('gps_watch_id');
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            GPS Location Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!isTracking ? (
              <Button onClick={startTracking} className="bg-green-600 hover:bg-green-700">
                <MapPin className="h-4 w-4 mr-2" />
                Start GPS Tracking
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="outline" className="border-red-500 text-red-600">
                Stop Tracking
              </Button>
            )}
            
            <Button onClick={getCurrentLocation} variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Get Current Location
            </Button>
          </div>

          {isTracking && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">GPS tracking is active</span>
            </div>
          )}

          {locationError && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{locationError}</span>
            </div>
          )}

          {currentLocation && (
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Current Location</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Latitude: {currentLocation.lat.toFixed(6)}</p>
                      <p>Longitude: {currentLocation.lng.toFixed(6)}</p>
                      {currentLocation.accuracy && (
                        <p>Accuracy: ±{currentLocation.accuracy.toFixed(0)}m</p>
                      )}
                      <p>Updated: {new Date(currentLocation.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={openInMaps}
                    variant="outline"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Open in Maps
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p><strong>Note:</strong> GPS tracking allows the restaurant admin to see your real-time location for better delivery coordination. Your location is only shared while you're on duty and tracking is enabled.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

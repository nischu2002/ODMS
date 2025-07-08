import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Navigation, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
  lastUpdated: string;
}

export const RiderLocationManager = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load saved location on component mount
  useEffect(() => {
    const savedLocation = localStorage.getItem(`rider_location_${user?.id}`);
    if (savedLocation) {
      setLocation(JSON.parse(savedLocation));
    }
  }, [user?.id]);

  const getCurrentLocation = () => {
    setIsUpdating(true);
    
    if (!navigator.geolocation) {
      toast({ 
        title: "Geolocation not supported", 
        description: "Please update your location manually",
        variant: "destructive" 
      });
      setIsUpdating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address (simplified for demo)
          const address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
          
          const newLocation: Location = {
            latitude,
            longitude,
            address,
            lastUpdated: new Date().toISOString()
          };
          
          setLocation(newLocation);
          localStorage.setItem(`rider_location_${user?.id}`, JSON.stringify(newLocation));
          
          toast({ 
            title: "Location updated successfully",
            description: "Your current location has been saved"
          });
        } catch (error) {
          console.error('Error getting address:', error);
          toast({ 
            title: "Error updating location", 
            variant: "destructive" 
          });
        } finally {
          setIsUpdating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({ 
          title: "Unable to get location", 
          description: "Please check your location permissions and try again",
          variant: "destructive" 
        });
        setIsUpdating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const updateManualLocation = () => {
    if (!manualAddress.trim()) {
      toast({ 
        title: "Please enter an address", 
        variant: "destructive" 
      });
      return;
    }

    const newLocation: Location = {
      latitude: 0, // Will be 0 for manual entries
      longitude: 0,
      address: manualAddress.trim(),
      lastUpdated: new Date().toISOString()
    };

    setLocation(newLocation);
    localStorage.setItem(`rider_location_${user?.id}`, JSON.stringify(newLocation));
    setManualAddress('');
    
    toast({ 
      title: "Location updated successfully",
      description: "Your location has been manually updated"
    });
  };

  const openInMaps = () => {
    if (!location) return;
    
    if (location.latitude !== 0 && location.longitude !== 0) {
      // Use coordinates if available
      const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(mapsUrl, '_blank');
    } else {
      // Use address if no coordinates
      const encodedAddress = encodeURIComponent(location.address);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Location Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Location
            </CardTitle>
            <CardDescription>Your current location for delivery tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {location ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-900">Current Location:</div>
                    <div className="text-sm text-green-700">{location.address}</div>
                    <div className="text-xs text-green-600 mt-1">
                      Last updated: {new Date(location.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                  
                  {location.latitude !== 0 && location.longitude !== 0 && (
                    <div className="text-xs text-gray-600">
                      Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={openInMaps}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      View in Maps
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No location set yet</p>
                  <p className="text-sm">Update your location to start receiving deliveries</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Update Location */}
        <Card>
          <CardHeader>
            <CardTitle>Update Location</CardTitle>
            <CardDescription>Keep your location current for efficient deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Auto Location */}
              <div className="space-y-2">
                <Label>Automatic Location</Label>
                <Button 
                  onClick={getCurrentLocation}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Getting Location...' : 'Use Current Location'}
                </Button>
                <p className="text-xs text-gray-600">
                  Uses GPS to get your exact location
                </p>
              </div>

              <div className="text-center text-sm text-gray-500">or</div>

              {/* Manual Location */}
              <div className="space-y-2">
                <Label htmlFor="manual_address">Manual Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual_address"
                    placeholder="Enter your current address..."
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                  />
                  <Button 
                    onClick={updateManualLocation}
                    variant="outline"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Manually enter your location if GPS is not available
                </p>
              </div>

              {/* Location Tips */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">💡 Location Tips:</div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Update location before starting deliveries</li>
                  <li>• Keep location current during your shift</li>
                  <li>• Use GPS for most accurate positioning</li>
                  <li>• Manual entry works when GPS is unavailable</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
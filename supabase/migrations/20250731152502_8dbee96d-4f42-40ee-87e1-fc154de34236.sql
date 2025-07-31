
-- Create rider_locations table for GPS tracking
CREATE TABLE public.rider_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for rider locations
CREATE POLICY "Riders can manage their own location" 
  ON public.rider_locations 
  FOR ALL 
  USING (rider_id = auth.uid());

-- Restaurant users can view rider locations for their restaurant
CREATE POLICY "Restaurant users can view rider locations" 
  ON public.rider_locations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2 
      WHERE u1.id = auth.uid() 
        AND u2.id = rider_locations.rider_id 
        AND u1.restaurant_id = u2.restaurant_id
    ) OR is_super_admin()
  );

-- Super admins can view all rider locations
CREATE POLICY "Super admins can view all rider locations" 
  ON public.rider_locations 
  FOR ALL 
  USING (is_super_admin());

-- Create trigger to update updated_at column
CREATE TRIGGER update_rider_locations_updated_at
  BEFORE UPDATE ON public.rider_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_rider_locations_rider_id ON public.rider_locations(rider_id);
CREATE INDEX idx_rider_locations_updated_at ON public.rider_locations(updated_at DESC);

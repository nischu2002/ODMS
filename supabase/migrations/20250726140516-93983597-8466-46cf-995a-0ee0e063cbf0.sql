
-- Create notifications table if it doesn't exist or update it
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  rider_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  status text DEFAULT 'pending',
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view notifications for their restaurant" 
ON public.notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = notifications.order_id 
    AND o.restaurant_id = get_current_user_restaurant_id()
  ) OR is_super_admin()
);

CREATE POLICY "Users can create notifications for their restaurant" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = notifications.order_id 
    AND o.restaurant_id = get_current_user_restaurant_id()
  ) OR is_super_admin()
);

CREATE POLICY "Admin and staff can update notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  (admin_id = auth.uid() OR staff_id = auth.uid() OR rider_id = auth.uid()) AND
  (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = notifications.order_id 
    AND o.restaurant_id = get_current_user_restaurant_id()
  ) OR is_super_admin())
);

-- Create trigger to update updated_at column
CREATE OR REPLACE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

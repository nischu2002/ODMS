
-- Add the missing rider_id column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS rider_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Update the RLS policies to include rider_id access
DROP POLICY IF EXISTS "Users can view notifications for their restaurant" ON public.notifications;
CREATE POLICY "Users can view notifications for their restaurant" 
ON public.notifications 
FOR SELECT 
USING (
  (admin_id = auth.uid() OR staff_id = auth.uid() OR rider_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = notifications.order_id 
    AND o.restaurant_id = get_current_user_restaurant_id()
  )) OR is_super_admin()
);


-- Drop existing restrictive policies for restaurants
DROP POLICY IF EXISTS "Super admins can view all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant admins can view their own restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant admins can update their own restaurant" ON public.restaurants;

-- Create new policies that allow restaurant registration
CREATE POLICY "Super admins can manage all restaurants" ON public.restaurants
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.super_admins WHERE id = auth.uid()
  ));

CREATE POLICY "Allow restaurant registration" ON public.restaurants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Restaurant admins can view their own restaurant" ON public.restaurants
  FOR SELECT USING (
    admin_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid())
  );

CREATE POLICY "Restaurant admins can update their own restaurant" ON public.restaurants
  FOR UPDATE USING (
    admin_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid())
  );

-- Also update the users table policies to allow user creation during registration
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Restaurant admins can manage their restaurant users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

CREATE POLICY "Super admins can manage all users" ON public.users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.super_admins WHERE id = auth.uid()
  ));

CREATE POLICY "Allow user registration" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Restaurant admins can manage their restaurant users" ON public.users
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE admin_id = auth.uid()
    ) OR id = auth.uid()
  );

CREATE POLICY "Users can view and update their own profile" ON public.users
  FOR SELECT USING (
    id = auth.uid() OR 
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE admin_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid())
  );

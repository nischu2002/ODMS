
-- Fix the delete_restaurant_auth_user function to properly handle auth user deletion
-- and ensure login works correctly by fixing any missing constraints

-- Drop the existing problematic function
DROP FUNCTION IF EXISTS public.delete_restaurant_auth_user();

-- Create a simpler trigger function that doesn't try to delete auth users
-- (since that requires service role and causes issues)
CREATE OR REPLACE FUNCTION public.delete_restaurant_cascade_fixed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all users (admin, staff, riders) associated with this restaurant
  DELETE FROM public.users WHERE restaurant_id = OLD.id;
  
  -- Delete all orders associated with this restaurant
  DELETE FROM public.orders WHERE restaurant_id = OLD.id;
  
  -- Delete all menu items associated with this restaurant  
  DELETE FROM public.menu_items WHERE restaurant_id = OLD.id;
  
  -- Delete all analytics events associated with this restaurant
  DELETE FROM public.analytics_events WHERE restaurant_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS delete_restaurant_cascade_trigger ON public.restaurants;
CREATE TRIGGER delete_restaurant_cascade_trigger
  BEFORE DELETE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_restaurant_cascade_fixed();

-- Ensure the restaurants table has proper constraints
ALTER TABLE public.restaurants 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN domain SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

-- Add unique constraint on domain if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'restaurants_domain_key' 
    AND table_name = 'restaurants'
  ) THEN
    ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_domain_key UNIQUE (domain);
  END IF;
END $$;

-- Ensure users table has proper foreign key
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_restaurant_id_fkey,
  ADD CONSTRAINT users_restaurant_id_fkey 
    FOREIGN KEY (restaurant_id) 
    REFERENCES public.restaurants(id) 
    ON DELETE CASCADE;

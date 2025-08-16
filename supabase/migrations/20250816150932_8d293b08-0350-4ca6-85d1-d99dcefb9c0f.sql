-- Fix search path security for the delete function
CREATE OR REPLACE FUNCTION public.delete_restaurant_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the auth user associated with this restaurant admin
  IF OLD.admin_id IS NOT NULL THEN
    -- Use the service role to delete the auth user
    PERFORM auth.delete_user(OLD.admin_id);
  END IF;
  
  RETURN OLD;
END;
$$;
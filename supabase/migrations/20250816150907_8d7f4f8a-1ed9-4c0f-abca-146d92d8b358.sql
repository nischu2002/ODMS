-- Add trigger to delete restaurant admin from auth.users when restaurant is deleted
CREATE OR REPLACE FUNCTION public.delete_restaurant_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger that fires before restaurant deletion
DROP TRIGGER IF EXISTS delete_restaurant_auth_trigger ON public.restaurants;
CREATE TRIGGER delete_restaurant_auth_trigger
  BEFORE DELETE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_restaurant_auth_user();
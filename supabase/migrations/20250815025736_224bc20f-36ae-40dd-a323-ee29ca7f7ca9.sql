
-- Add cascade delete trigger for restaurants to clean up all related data
CREATE OR REPLACE FUNCTION delete_restaurant_cascade()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all users (admin, staff, riders) associated with this restaurant
  DELETE FROM users WHERE restaurant_id = OLD.id;
  
  -- Delete all orders associated with this restaurant
  DELETE FROM orders WHERE restaurant_id = OLD.id;
  
  -- Delete all menu items associated with this restaurant
  DELETE FROM menu_items WHERE restaurant_id = OLD.id;
  
  -- Delete all analytics events associated with this restaurant
  DELETE FROM analytics_events WHERE restaurant_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before restaurant deletion
DROP TRIGGER IF EXISTS trigger_delete_restaurant_cascade ON restaurants;
CREATE TRIGGER trigger_delete_restaurant_cascade
  BEFORE DELETE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION delete_restaurant_cascade();

-- Add a password field to restaurant_requests table so we can store user's requested password
ALTER TABLE restaurant_requests ADD COLUMN IF NOT EXISTS password text;

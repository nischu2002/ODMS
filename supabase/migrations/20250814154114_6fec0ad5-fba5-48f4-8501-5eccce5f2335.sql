-- Create notifications for super admin when restaurant requests are created
CREATE OR REPLACE FUNCTION notify_super_admin_on_restaurant_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all super admins
  INSERT INTO notifications (
    notification_type,
    message,
    status
  )
  SELECT 
    'restaurant_request',
    'New restaurant registration request from ' || NEW.restaurant_name,
    'pending'
  FROM super_admins;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for restaurant requests
DROP TRIGGER IF EXISTS on_restaurant_request_created ON restaurant_requests;
CREATE TRIGGER on_restaurant_request_created
  AFTER INSERT ON restaurant_requests
  FOR EACH ROW EXECUTE FUNCTION notify_super_admin_on_restaurant_request();
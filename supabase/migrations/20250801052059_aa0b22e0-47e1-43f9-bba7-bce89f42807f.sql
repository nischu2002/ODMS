
-- Create cms_content table for managing website content
CREATE TABLE public.cms_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create restaurant_requests table for managing restaurant applications
CREATE TABLE public.restaurant_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_notifications table for system alerts and notifications
CREATE TABLE public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for cms_content
ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage cms content" 
  ON public.cms_content 
  FOR ALL 
  USING (is_super_admin());

CREATE POLICY "Public can view active cms content" 
  ON public.cms_content 
  FOR SELECT 
  USING (is_active = true);

-- Add Row Level Security (RLS) for restaurant_requests
ALTER TABLE public.restaurant_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage restaurant requests" 
  ON public.restaurant_requests 
  FOR ALL 
  USING (is_super_admin());

CREATE POLICY "Allow public to create restaurant requests" 
  ON public.restaurant_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Add Row Level Security (RLS) for system_notifications
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage system notifications" 
  ON public.system_notifications 
  FOR ALL 
  USING (is_super_admin());

-- Add triggers for updated_at columns
CREATE TRIGGER update_cms_content_updated_at 
  BEFORE UPDATE ON public.cms_content 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_restaurant_requests_updated_at 
  BEFORE UPDATE ON public.restaurant_requests 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_system_notifications_updated_at 
  BEFORE UPDATE ON public.system_notifications 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

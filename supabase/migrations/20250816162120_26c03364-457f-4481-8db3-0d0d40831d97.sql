-- Add password field to restaurant_requests table and fix edge function password flow
ALTER TABLE public.restaurant_requests ADD COLUMN IF NOT EXISTS password TEXT;
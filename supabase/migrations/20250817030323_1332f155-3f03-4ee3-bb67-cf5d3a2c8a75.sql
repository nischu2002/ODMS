
-- Add payment_mode column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'cod';

-- Add collected_amount column to orders table for tracking cash collection
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS collected_amount numeric DEFAULT 0;

-- Add collected_by column to track who collected the payment
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS collected_by uuid REFERENCES public.users(id);

-- Add collected_at timestamp
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS collected_at timestamp with time zone;

-- Create cash_collections table for rider cash tracking
CREATE TABLE IF NOT EXISTS public.cash_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id uuid NOT NULL REFERENCES public.users(id),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  amount numeric NOT NULL,
  collected_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  status text NOT NULL DEFAULT 'collected', -- collected, submitted
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on cash_collections table
ALTER TABLE public.cash_collections ENABLE ROW LEVEL SECURITY;

-- Create policy for cash collections - riders can manage their own collections
CREATE POLICY "Riders can manage their cash collections" 
  ON public.cash_collections 
  FOR ALL 
  USING (
    (rider_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM public.users u1, public.users u2 
      WHERE u1.id = auth.uid() 
      AND u2.id = cash_collections.rider_id 
      AND u1.restaurant_id = u2.restaurant_id
      AND u1.role IN ('admin', 'restaurant_staff')
    )) OR 
    is_super_admin()
  );

-- Create policy for restaurant users to view cash collections
CREATE POLICY "Restaurant users can view cash collections" 
  ON public.cash_collections 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u1, public.users u2 
      WHERE u1.id = auth.uid() 
      AND u2.id = cash_collections.rider_id 
      AND u1.restaurant_id = u2.restaurant_id
    ) OR is_super_admin()
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_cash_collections_updated_at
  BEFORE UPDATE ON public.cash_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

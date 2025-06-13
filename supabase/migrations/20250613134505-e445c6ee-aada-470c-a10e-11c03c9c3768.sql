
-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  business_type TEXT
);

-- Create users table for all user types (admin, staff, rider)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'restaurant_staff', 'rider')),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, restaurant_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  assigned_staff_id UUID REFERENCES public.users(id),
  assigned_rider_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_delivery_time TIMESTAMP WITH TIME ZONE
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create super_admins table for system administrators
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants
CREATE POLICY "Super admins can view all restaurants" ON public.restaurants
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.super_admins WHERE id = auth.uid()
  ));

CREATE POLICY "Restaurant admins can view their own restaurant" ON public.restaurants
  FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Restaurant admins can update their own restaurant" ON public.restaurants
  FOR UPDATE USING (admin_id = auth.uid());

-- RLS Policies for users
CREATE POLICY "Super admins can manage all users" ON public.users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.super_admins WHERE id = auth.uid()
  ));

CREATE POLICY "Restaurant admins can manage their restaurant users" ON public.users
  FOR ALL USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

-- RLS Policies for orders
CREATE POLICY "Restaurant users can manage their restaurant orders" ON public.orders
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.users WHERE id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.super_admins WHERE id = auth.uid()
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Users can manage order items for accessible orders" ON public.order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        restaurant_id IN (
          SELECT restaurant_id FROM public.users WHERE id = auth.uid()
        ) OR EXISTS (
          SELECT 1 FROM public.super_admins WHERE id = auth.uid()
        )
    )
  );

-- RLS Policies for super_admins
CREATE POLICY "Super admins can manage themselves" ON public.super_admins
  FOR ALL USING (id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_restaurants_domain ON public.restaurants(domain);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_restaurant_id ON public.users(restaurant_id);
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

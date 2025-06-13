
export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          domain: string;
          address: string;
          phone: string;
          email: string;
          admin_id: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          business_type: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          domain: string;
          address: string;
          phone: string;
          email: string;
          admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          business_type?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          address?: string;
          phone?: string;
          email?: string;
          admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          business_type?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          restaurant_id: string | null;
          email: string;
          name: string;
          role: 'super_admin' | 'admin' | 'restaurant_staff' | 'rider';
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          email: string;
          name: string;
          role: 'super_admin' | 'admin' | 'restaurant_staff' | 'rider';
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          email?: string;
          name?: string;
          role?: 'super_admin' | 'admin' | 'restaurant_staff' | 'rider';
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          customer_name: string;
          customer_phone: string;
          customer_address: string;
          total_amount: number;
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
          payment_status: 'pending' | 'paid' | 'failed';
          assigned_staff_id: string | null;
          assigned_rider_id: string | null;
          created_at: string;
          updated_at: string;
          estimated_delivery_time: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          customer_name: string;
          customer_phone: string;
          customer_address: string;
          total_amount: number;
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
          payment_status?: 'pending' | 'paid' | 'failed';
          assigned_staff_id?: string | null;
          assigned_rider_id?: string | null;
          created_at?: string;
          updated_at?: string;
          estimated_delivery_time?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          customer_name?: string;
          customer_phone?: string;
          customer_address?: string;
          total_amount?: number;
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
          payment_status?: 'pending' | 'paid' | 'failed';
          assigned_staff_id?: string | null;
          assigned_rider_id?: string | null;
          created_at?: string;
          updated_at?: string;
          estimated_delivery_time?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          name: string;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          name: string;
          quantity?: number;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          name?: string;
          quantity?: number;
          price?: number;
          created_at?: string;
        };
      };
      super_admins: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
      };
    };
  };
}

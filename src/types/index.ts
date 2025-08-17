
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'restaurant_staff' | 'rider';
  restaurantId?: string;
  phone?: string;
  isActive?: boolean;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  domain: string;
  address: string;
  phone: string;
  email: string;
  adminId?: string;
  admin_id?: string; // Add both versions for compatibility
  createdAt: string;
  isActive: boolean;
  businessType?: string;
}

export interface RestaurantRegistration {
  restaurantName: string;
  businessType: string;
  adminEmail: string;
  adminPassword: string;
  ownerName: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  assignedStaffId?: string;
  assignedRiderId?: string;
  riderId?: string;
  createdAt: string;
  estimatedDeliveryTime?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMode: 'cod' | 'esewa' | 'phonepay' | 'bank_transfer' | 'online';
  collectedAmount?: number;
  collectedBy?: string;
  collectedAt?: string;
  kitchen_assigned_at?: string;
  rider_assigned_at?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface CashCollection {
  id: string;
  riderId: string;
  orderId: string;
  amount: number;
  collectedAt: string;
  submittedAt?: string;
  status: 'collected' | 'submitted';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    customerName: string;
    customerPhone: string;
    totalAmount: number;
  };
}

export interface DeliveryRider {
  id: string;
  name: string;
  email: string;
  phone: string;
  restaurantId: string;
  isActive: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  isOnline: boolean;
  totalDeliveries: number;
  rating: number;
}

export interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  totalDeliveries: number;
  averageDeliveryTime: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface Notification {
  id: string;
  order_id: string;
  staff_id: string | null;
  admin_id: string | null;
  rider_id: string | null;
  notification_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'dismissed';
  message: string;
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
    email: string;
  };
  orders?: {
    customer_name: string;
    total_amount: number;
  };
}

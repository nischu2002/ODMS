
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
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
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

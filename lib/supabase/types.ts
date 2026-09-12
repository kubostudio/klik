export type PlanType = 'starter' | 'pro';

export type OrderStatus = 'new' | 'contacted' | 'confirmed' | 'delivered' | 'cancelled';

export type FollowUpType = 'unconfirmed_order' | 'post_purchase' | 'inactive_customer';
export type FollowUpStatus = 'pending' | 'completed' | 'dismissed';

export type AnalyticsEventType =
  | 'store_view'
  | 'product_view'
  | 'cart_add'
  | 'cart_remove'
  | 'checkout_started'
  | 'order_created';

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  whatsapp: string;
  instagram: string | null;
  facebook: string | null;
  city: string | null;
  email?: string | null;
  plan: PlanType;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  brand?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  dni?: string | null;
  address: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  store_id: string;
  customer_id: string | null;
  status: OrderStatus;
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_dni?: string | null;
  customer_address: string | null;
  customer_reference: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  variant_data: Record<string, string> | null;
  subtotal: number;
}

export interface FollowUp {
  id: string;
  store_id: string;
  customer_id: string;
  order_id: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  customer?: Customer;
  order?: Order;
}

export interface AnalyticsEvent {
  id: string;
  store_id: string;
  event_type: AnalyticsEventType;
  product_id?: string | null;
  order_id?: string | null;
  session_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface StoreIntegration {
  store_id: string;
  google_analytics_id: string | null;
  meta_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  auto_followup_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  store_id: string;
  plan: PlanType;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  provider: string;
  provider_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

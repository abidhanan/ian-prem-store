export type Role = "user" | "admin";
export type OrderStatus = "pending" | "completed" | "cancelled";
export type AccountField = "email" | "password" | "profile" | "pin" | "access_link";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price: number;
  original_price: number | null;
  duration: string | null;
  features: string[];
  account_fields: AccountField[];
  is_active: boolean;
  is_featured: boolean;
  stock_count: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "id" | "name" | "slug" | "icon" | "color"> | null;
}

export interface Order {
  id: string;
  order_code: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  category_name: string | null;
  unit_price: number;
  quantity: number;
  total: number;
  status: OrderStatus;
  customer_note: string | null;
  admin_note: string | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  profiles?: Pick<Profile, "full_name" | "email" | "phone"> | null;
  products?: Pick<Product, "slug" | "image_url" | "account_fields"> | null;
}

export interface AccountStock {
  id: string;
  product_id: string;
  email: string | null;
  password: string | null;
  profile: string | null;
  pin: string | null;
  access_link: string | null;
  notes: string | null;
  status: "available" | "sold";
  order_id: string | null;
  created_at: string;
  sold_at: string | null;
  products?: Pick<Product, "name"> | null;
  orders?: Pick<Order, "order_code"> | null;
}

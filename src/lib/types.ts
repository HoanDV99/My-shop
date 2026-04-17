export interface Category {
  id: string
  name: string
  color: string
  icon: string
  sort_order: number
}

export interface Product {
  id: string
  name: string
  alias: string | null
  category_id: string | null
  current_cost_price: number
  current_selling_price: number
  stock: number
  image_url?: string | null
  is_active: boolean
  created_at: string
  categories?: Category
}

export interface Order {
  id: string
  created_at: string
  total_amount: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price_at_sale: number
  cost_at_sale: number
  products?: Product
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface StockImport {
  id: string
  product_id: string
  quantity: number
  cost_price: number
  supplier: string | null
  created_at: string
  products?: Product
}

export interface StockExport {
  id: string
  product_id: string
  quantity: number
  reason: string | null
  created_at: string
  products?: Product
}

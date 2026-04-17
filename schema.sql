-- ================================================
-- My-Shop POS — Database Schema for Supabase
-- ================================================

-- Bảng danh mục sản phẩm
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '📦',
  sort_order INT DEFAULT 0
);

-- Bảng sản phẩm
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  current_cost_price BIGINT NOT NULL DEFAULT 0,
  current_selling_price BIGINT NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng đơn hàng
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  total_amount BIGINT NOT NULL DEFAULT 0
);

-- Bảng chi tiết đơn hàng
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_at_sale BIGINT NOT NULL,
  cost_at_sale BIGINT NOT NULL
);

-- Bảng lịch sử nhập hàng
CREATE TABLE stock_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  cost_price BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_alias ON products(alias);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Enable RLS (with public access for internal POS use)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON stock_imports FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- Seed Data
-- ================================================

INSERT INTO categories (name, color, icon, sort_order) VALUES
  ('Đồ uống',  '#ef4444', '🥤', 1),
  ('Bánh kẹo',  '#f59e0b', '🍪', 2),
  ('Mì & Cháo', '#10b981', '🍜', 3),
  ('Gia vị',    '#8b5cf6', '🧂', 4),
  ('Đồ dùng',   '#06b6d4', '🧹', 5),
  ('Khác',       '#6b7280', '📦', 6);

# My Shop POS — Implementation Plan

> **Cập nhật lần cuối:** 2026-04-17 10:47 (GMT+7)

---

## Phase 1: Database Setup
> Thiết kế và tạo database schema trên Supabase.

| # | Task | Trạng thái | Ghi chú |
|---|------|:----------:|---------|
| 1.1 | Thiết kế bảng `categories` (id, name, color, icon, sort_order) | ✅ Done | Seed 6 danh mục |
| 1.2 | Thiết kế bảng `products` (id, name, alias, category_id, current_cost_price, current_selling_price, stock, is_active) | ✅ Done | BIGINT cho giá |
| 1.3 | Thiết kế bảng `orders` (id, created_at, total_amount) | ✅ Done | |
| 1.4 | Thiết kế bảng `order_items` (id, order_id, product_id, quantity, price_at_sale, cost_at_sale) | ✅ Done | Snapshot giá tại thời điểm bán |
| 1.5 | Thiết kế bảng `stock_imports` (id, product_id, quantity, cost_price, created_at) | ✅ Done | Audit trail nhập hàng |
| 1.6 | Tạo indexes (alias, category, orders, order_items) | ✅ Done | |
| 1.7 | Cấu hình RLS policies (Allow all — POS nội bộ) | ✅ Done | |
| 1.8 | Seed data danh mục (Đồ uống, Bánh kẹo, Mì, Gia vị, Đồ dùng, Khác) | ✅ Done | |
| 1.9 | Xuất file `schema.sql` để chạy trên Supabase Dashboard | ✅ Done | `schema.sql` |

📁 **File:** `schema.sql`

---

## Phase 2: Backend API
> Thiết lập kết nối Supabase và các hàm tiện ích phía server/client.

| # | Task | Trạng thái | Ghi chú |
|---|------|:----------:|---------|
| 2.1 | Cài đặt `@supabase/supabase-js` + `@supabase/ssr` | ✅ Done | |
| 2.2 | Tạo Supabase Browser Client (`src/lib/supabase/client.ts`) | ✅ Done | Guard cho build-time |
| 2.3 | Tạo Supabase Server Client (`src/lib/supabase/server.ts`) | ✅ Done | Cookie-based |
| 2.4 | Tạo `.env.local` template (SUPABASE_URL, ANON_KEY) | ✅ Done | |
| 2.5 | Định nghĩa TypeScript interfaces (`src/lib/types.ts`) | ✅ Done | Product, Order, CartItem, ... |
| 2.6 | Hàm tiện ích: `formatVND()`, `formatShortVND()` | ✅ Done | `src/lib/utils.ts` |
| 2.7 | Hàm tiện ích: `removeVietnameseTones()` + `searchProducts()` | ✅ Done | Tìm kiếm không dấu + alias |
| 2.8 | Hàm tiện ích: `formatDateTime()`, `formatDate()` | ✅ Done | Locale vi-VN |
| 2.9 | Hàm tiện ích: `getProductColor()` | ✅ Done | 8 gradient colors |
| 2.10 | Logic tạo đơn hàng (insert orders → order_items → update stock) | ✅ Done | Trong POS page |
| 2.11 | Logic nhập hàng (insert stock_imports → update products) | ✅ Done | Trong Inventory page |
| 2.12 | Logic báo cáo (aggregate orders + order_items theo ngày) | ✅ Done | Trong Reports page |

📁 **Files:** `src/lib/supabase/`, `src/lib/types.ts`, `src/lib/utils.ts`

---

## Phase 3: Frontend Mobile UI
> Giao diện tối ưu cho thao tác tay trên mobile (< 1024px).

| # | Task | Trạng thái | Ghi chú |
|---|------|:----------:|---------|
| 3.1 | Bottom Navigation Bar (4 tabs: Bán hàng, Sản phẩm, Nhập hàng, Báo cáo) | ✅ Done | Glass effect |
| 3.2 | Product Grid dạng 2 cột với nút bấm lớn, gradient màu | ✅ Done | `btn-press` animation |
| 3.3 | Category Tabs cuộn ngang (horizontal scroll, no-scrollbar) | ✅ Done | |
| 3.4 | Floating Cart Button (hiện khi giỏ có hàng) | ✅ Done | `animate-slide-up` |
| 3.5 | Cart Bottom Sheet (drawer slide-up từ dưới) | ✅ Done | Backdrop blur |
| 3.6 | Checkout Modal dạng bottom-sheet trên mobile | ✅ Done | Handle bar kéo |
| 3.7 | Search bar full-width với nút clear | ✅ Done | |
| 3.8 | Product form modal responsive (bottom-sheet trên mobile) | ✅ Done | |
| 3.9 | Inventory form responsive | ✅ Done | |
| 3.10 | Report cards & chart responsive (2 cột grid) | ✅ Done | |

📁 **Files:** `src/components/pos/MobileCartButton.tsx`, `MobileCartDrawer.tsx`, `src/components/layout/MobileNav.tsx`

---

## Phase 4: Frontend Desktop UI
> Giao diện 2 cột chuyên nghiệp cho laptop/desktop (≥ 1024px).

| # | Task | Trạng thái | Ghi chú |
|---|------|:----------:|---------|
| 4.1 | Sidebar cố định bên trái (220px, logo, nav items, user info) | ✅ Done | Active state tracking |
| 4.2 | POS layout 2 cột: Trái (sản phẩm) + Phải (giỏ hàng 360px) | ✅ Done | `flex-row` on `lg:` |
| 4.3 | Product Grid 3-4 cột trên desktop | ✅ Done | `lg:grid-cols-3 xl:grid-cols-4` |
| 4.4 | Cart Panel cố định bên phải với scroll riêng | ✅ Done | `overflow-y-auto` |
| 4.5 | Checkout Modal centered trên desktop | ✅ Done | `sm:rounded-2xl` |
| 4.6 | Products list view với inline actions (edit, toggle) | ✅ Done | |
| 4.7 | Dark theme toàn bộ với design system CSS variables | ✅ Done | 10+ custom properties |
| 4.8 | Animations: scale-in, slide-up, fade-in, badge-pulse | ✅ Done | `globals.css` |
| 4.9 | Glass morphism effect cho toast, bottom nav | ✅ Done | `backdrop-filter: blur` |

📁 **Files:** `src/components/layout/Sidebar.tsx`, `src/components/pos/CartPanel.tsx`, `src/app/globals.css`

---

## Phase 5: Analytics Logic
> Trang báo cáo doanh thu và lợi nhuận.

| # | Task | Trạng thái | Ghi chú |
|---|------|:----------:|---------|
| 5.1 | Date range filter (Hôm nay / 7 ngày / 30 ngày / Tất cả) | ✅ Done | Re-fetch on change |
| 5.2 | Stat cards: Tổng doanh thu, Lợi nhuận, Số đơn, TB/đơn | ✅ Done | `useMemo` computed |
| 5.3 | Công thức lợi nhuận: `SUM((price_at_sale - cost_at_sale) * quantity)` | ✅ Done | Chính xác dù giá thay đổi |
| 5.4 | Bar chart CSS theo ngày (gradient bars, % lãi) | ✅ Done | Không cần chart library |
| 5.5 | Danh sách đơn hàng gần đây (amount, time, items, profit) | ✅ Done | Top 20 đơn |
| 5.6 | Daily aggregation: revenue + profit + order count theo ngày | ✅ Done | `Map` grouping |
| 5.7 | Hiển thị lãi ước tính trước khi thanh toán (Checkout Modal) | ✅ Done | Preview profit |

📁 **File:** `src/app/reports/page.tsx`

---

## Tổng kết

| Phase | Tiến độ | Số task |
|-------|:-------:|:-------:|
| 1. Database Setup | ✅ 9/9 | 100% |
| 2. Backend API | ✅ 12/12 | 100% |
| 3. Frontend Mobile UI | ✅ 10/10 | 100% |
| 4. Frontend Desktop UI | ✅ 9/9 | 100% |
| 5. Analytics Logic | ✅ 7/7 | 100% |
| **Tổng cộng** | **✅ 47/47** | **100%** |

---

## ⚠️ Pending — User Action Required

- [ ] Tạo Supabase project → lấy URL + Anon Key
- [ ] Cập nhật `.env.local` với credentials thực
- [ ] Chạy `schema.sql` trong Supabase SQL Editor
- [ ] Thêm sản phẩm thật qua `/products`
- [ ] Deploy lên Vercel (optional)

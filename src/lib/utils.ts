import { Product } from './types'

/**
 * Format số tiền sang dạng VND (VD: 15,000đ)
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

/**
 * Format số tiền rút gọn (VD: 15k, 1.2M)
 */
export function formatShortVND(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'k'
  }
  return amount.toString() + 'đ'
}

/**
 * Bỏ dấu tiếng Việt
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

/**
 * Tìm kiếm sản phẩm theo tên (không dấu) hoặc alias
 */
export function searchProducts(products: Product[], query: string): Product[] {
  if (!query.trim()) return products
  const q = removeVietnameseTones(query)
  return products.filter(
    (p) =>
      removeVietnameseTones(p.name).includes(q) ||
      (p.alias && p.alias.toLowerCase().includes(q))
  )
}

/**
 * Format ngày giờ
 */
export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

/**
 * Format ngày
 */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(dateStr))
}

/**
 * Lấy mảng màu cho nút sản phẩm
 */
const PRODUCT_COLORS = [
  'from-rose-500 to-pink-600',
  'from-orange-500 to-amber-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-rose-600',
]

export function getProductColor(index: number): string {
  return PRODUCT_COLORS[index % PRODUCT_COLORS.length]
}

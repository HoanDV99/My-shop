'use client'

import { CartItem } from '@/lib/types'
import { formatVND } from '@/lib/utils'

interface MobileCartButtonProps {
  items: CartItem[]
  onClick: () => void
}

export function MobileCartButton({ items, onClick }: MobileCartButtonProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.current_selling_price * item.quantity,
    0
  )

  if (items.length === 0) return null

  return (
    <button
      onClick={onClick}
      className="btn-press lg:hidden fixed bottom-20 left-4 right-4 z-40 flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-accent to-purple-600 text-white rounded-2xl shadow-xl shadow-accent/30 animate-slide-up"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl">🛒</span>
        <span className="font-bold">{totalItems} sản phẩm</span>
      </div>
      <span className="font-extrabold text-lg">{formatVND(totalAmount)}</span>
    </button>
  )
}

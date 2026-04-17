'use client'

import { CartItem } from '@/lib/types'
import { formatVND } from '@/lib/utils'

interface CartPanelProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onCheckout: () => void
  onClear: () => void
}

export function CartPanel({ items, onUpdateQuantity, onRemove, onCheckout, onClear }: CartPanelProps) {
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.current_selling_price * item.quantity,
    0
  )
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛒</span>
          <h2 className="font-bold text-base">Giỏ hàng</h2>
          {totalItems > 0 && (
            <span className="badge-pulse bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-muted hover:text-danger transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted py-10">
            <span className="text-4xl mb-3">🧺</span>
            <p className="text-sm">Chưa có sản phẩm nào</p>
            <p className="text-xs mt-1">Bấm vào sản phẩm để thêm</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="animate-scale-in flex items-center gap-3 bg-surface-hover rounded-xl p-3"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.product.name}</p>
                <p className="text-xs text-muted mt-0.5">
                  {formatVND(item.product.current_selling_price)}
                </p>
              </div>

              {/* Quantity control */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() =>
                    item.quantity <= 1
                      ? onRemove(item.product.id)
                      : onUpdateQuantity(item.product.id, -1)
                  }
                  className="btn-press w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-sm font-bold text-muted hover:text-danger hover:border-danger/30 transition-colors"
                >
                  {item.quantity <= 1 ? '🗑' : '−'}
                </button>
                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="btn-press w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-sm font-bold text-muted hover:text-accent hover:border-accent/30 transition-colors disabled:opacity-30"
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <span className="text-sm font-bold text-accent w-[70px] text-right shrink-0">
                {formatVND(item.product.current_selling_price * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer / Checkout */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted text-sm">Tổng cộng</span>
          <span className="text-xl font-extrabold gradient-text">
            {formatVND(totalAmount)}
          </span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="btn-press w-full py-3.5 bg-gradient-to-r from-accent to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-base"
        >
          💳 Thanh toán {totalItems > 0 && `(${totalItems})`}
        </button>
      </div>
    </div>
  )
}

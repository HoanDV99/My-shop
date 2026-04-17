'use client'

import { CartItem } from '@/lib/types'
import { formatVND } from '@/lib/utils'

interface MobileCartDrawerProps {
  items: CartItem[]
  isOpen: boolean
  onClose: () => void
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onCheckout: () => void
  onClear: () => void
}

export function MobileCartDrawer({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onClear,
}: MobileCartDrawerProps) {
  if (!isOpen) return null

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.current_selling_price * item.quantity,
    0
  )
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer from bottom */}
      <div className="animate-slide-up absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl max-h-[80vh] flex flex-col border-t border-border shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="font-bold text-base">Giỏ hàng</h2>
            {totalItems > 0 && (
              <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button onClick={onClear} className="text-xs text-muted hover:text-danger transition-colors">
                Xóa tất cả
              </button>
            )}
            <button onClick={onClose} className="text-muted hover:text-foreground text-lg">✕</button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted">
              <span className="text-4xl mb-3">🧺</span>
              <p className="text-sm">Giỏ hàng trống</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 bg-surface-hover rounded-xl p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.product.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatVND(item.product.current_selling_price)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() =>
                      item.quantity <= 1
                        ? onRemove(item.product.id)
                        : onUpdateQuantity(item.product.id, -1)
                    }
                    className="btn-press w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-sm font-bold"
                  >
                    {item.quantity <= 1 ? '🗑' : '−'}
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="btn-press w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-sm font-bold disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-bold text-accent w-[70px] text-right shrink-0">
                  {formatVND(item.product.current_selling_price * item.quantity)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Checkout */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">Tổng cộng</span>
              <span className="text-xl font-extrabold gradient-text">{formatVND(totalAmount)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="btn-press w-full py-3.5 bg-gradient-to-r from-accent to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-accent/25 text-base"
            >
              💳 Thanh toán ({totalItems})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

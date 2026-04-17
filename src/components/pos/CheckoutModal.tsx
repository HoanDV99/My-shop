'use client'

import { CartItem } from '@/lib/types'
import { formatVND } from '@/lib/utils'
import { HiddenPrice } from '@/components/HiddenPrice'

interface CheckoutModalProps {
  items: CartItem[]
  isOpen: boolean
  isProcessing: boolean
  onClose: () => void
  onConfirm: () => void
}

export function CheckoutModal({ items, isOpen, isProcessing, onClose, onConfirm }: CheckoutModalProps) {
  if (!isOpen) return null

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.current_selling_price * item.quantity,
    0
  )
  const totalProfit = items.reduce(
    (sum, item) =>
      sum + (item.product.current_selling_price - item.product.current_cost_price) * item.quantity,
    0
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="animate-slide-up relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl max-h-[85vh] overflow-hidden">
        {/* Handle for mobile */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold">Xác nhận thanh toán</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover text-muted transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Items summary */}
        <div className="px-5 py-4 max-h-[40vh] overflow-y-auto space-y-2">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted">
                  {formatVND(item.product.current_selling_price)} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-bold">
                {formatVND(item.product.current_selling_price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-5 py-4 border-t border-border space-y-2 bg-surface-hover/50">
          <div className="flex justify-between text-sm text-muted">
            <span>Lợi nhuận ước tính</span>
            <span className="text-success font-medium z-50 relative"><HiddenPrice value={`+${formatVND(totalProfit)}`} /></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold">Tổng thanh toán</span>
            <span className="text-2xl font-extrabold gradient-text">{formatVND(totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="btn-press flex-1 py-3 border border-border rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="btn-press flex-[2] py-3 bg-gradient-to-r from-accent to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-accent/25 transition-all disabled:opacity-60"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              '✓ Xác nhận'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

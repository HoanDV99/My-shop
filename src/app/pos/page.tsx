'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/lib/types'
import { searchProducts } from '@/lib/utils'
import { useProducts, useCategories } from '@/lib/hooks/queries'
import { useCartStore } from '@/lib/store/useCartStore'
import { useQueryClient } from '@tanstack/react-query'
import { CategoryTabs } from '@/components/pos/CategoryTabs'
import { SearchBar } from '@/components/pos/SearchBar'
import { ProductGrid } from '@/components/pos/ProductGrid'
import { CartPanel } from '@/components/pos/CartPanel'
import { CheckoutModal } from '@/components/pos/CheckoutModal'
import { MobileCartButton } from '@/components/pos/MobileCartButton'
import { MobileCartDrawer } from '@/components/pos/MobileCartDrawer'

export default function POSPage() {
  const supabase = createClient()

  const queryClient = useQueryClient()

  // Data
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories()
  const { data: products = [], isLoading: isLoadingProducts } = useProducts(true)
  const loading = isLoadingCategories || isLoadingProducts

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Cart from Zustand
  const { items: cartItems, addToCart, updateQuantity, removeFromCart, clearCart } = useCartStore()

  // UI state
  const [showCheckout, setShowCheckout] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Filter products
  const filteredProducts = (() => {
    let result = products
    if (activeCategory) {
      result = result.filter((p) => p.category_id === activeCategory)
    }
    if (searchQuery) {
      result = searchProducts(result, searchQuery)
    }
    return result
  })()

  // Cart actions are handled by Zustand hook now.
  // We don't need to re-implement them, they are destructured above.

  // Show toast
  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) return
    setIsProcessing(true)

    try {
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.product.current_selling_price * item.quantity,
        0
      )

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ total_amount: totalAmount })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_sale: item.product.current_selling_price,
        cost_at_sale: item.product.current_cost_price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Update stock
      for (const item of cartItems) {
        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id)
      }

      // Record export history
      const exportItems = cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        reason: 'Bán qua POS'
      }))
      
      const { error: exportError } = await supabase
        .from('stock_exports')
        .insert(exportItems)
        
      if (exportError) {
        console.warn('Bạn chưa tạo bảng stock_exports trên máy chủ hoặc có lỗi:', exportError.message || exportError)
      }

      // Refresh products and other related caches
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['stock_exports'] })
      await queryClient.invalidateQueries({ queryKey: ['orders_report'] })

      // Clear cart & close modal
      clearCart()
      setShowCheckout(false)
      setShowMobileCart(false)
      showToast('✅ Thanh toán thành công!')
    } catch (error) {
      console.error('Checkout error:', error)
      showToast('❌ Lỗi thanh toán, vui lòng thử lại')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-full overflow-hidden">
      {/* Left: Product area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">🛒 Bán hàng</h1>
              <p className="text-xs text-muted mt-0.5">Chọn sản phẩm để thêm vào giỏ</p>
            </div>
            {loading && (
              <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            )}
          </div>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[100px] rounded-2xl bg-surface-hover animate-pulse"
                />
              ))}
            </div>
          ) : (
            <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
          )}
        </div>
      </div>

      {/* Right: Cart — desktop only */}
      <div className="hidden lg:flex w-[360px] shrink-0 border-l border-border bg-surface">
        <div className="flex-1 flex flex-col">
          <CartPanel
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onCheckout={() => setShowCheckout(true)}
            onClear={clearCart}
          />
        </div>
      </div>

      {/* Mobile: Floating cart button */}
      <MobileCartButton items={cartItems} onClick={() => setShowMobileCart(true)} />

      {/* Mobile: Cart drawer */}
      <MobileCartDrawer
        items={cartItems}
        isOpen={showMobileCart}
        onClose={() => setShowMobileCart(false)}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          setShowMobileCart(false)
          setShowCheckout(true)
        }}
        onClear={clearCart}
      />

      {/* Checkout modal */}
      <CheckoutModal
        items={cartItems}
        isOpen={showCheckout}
        isProcessing={isProcessing}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleCheckout}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[200] animate-slide-up glass px-5 py-3 rounded-xl text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}

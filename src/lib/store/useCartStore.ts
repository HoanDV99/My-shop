import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CartItem } from '../types'

interface CartState {
  items: CartItem[]
  addToCart: (product: Product) => void
  updateQuantity: (productId: string, delta: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addToCart: (product) => set((state) => {
        const existing = state.items.find((item) => item.product.id === product.id)
        if (existing) {
          if (existing.quantity >= product.stock) return state
          return {
            items: state.items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          }
        }
        return { items: [...state.items, { product, quantity: 1 }] }
      }),
      updateQuantity: (productId, delta) => set((state) => ({
        items: state.items.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
      })),
      removeFromCart: (productId) => set((state) => ({
        items: state.items.filter((item) => item.product.id !== productId)
      })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: 'pos-cart-storage',
    }
  )
)

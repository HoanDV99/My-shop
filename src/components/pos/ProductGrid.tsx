'use client'

import { Product } from '@/lib/types'
import { formatShortVND, getProductColor } from '@/lib/utils'

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted">
        <span className="text-5xl mb-4">📭</span>
        <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
        <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {products.map((product, index) => (
        <button
          key={product.id}
          onClick={() => onAddToCart(product)}
          disabled={product.stock <= 0}
          className={`btn-press group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${getProductColor(index)} text-white shadow-lg hover:shadow-xl transition-all duration-200 min-h-[100px] ${
            product.stock <= 0 ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:scale-[1.03] active:scale-95'
          }`}
        >
          {/* Product name */}
          <span className="text-sm font-bold text-center leading-tight line-clamp-2 drop-shadow-sm">
            {product.alias || product.name}
          </span>

          {/* Price */}
          <span className="mt-2 text-lg font-extrabold drop-shadow-sm">
            {formatShortVND(product.current_selling_price)}
          </span>

          {/* Stock badge */}
          <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            product.stock <= 5
              ? 'bg-red-900/60 text-red-200'
              : 'bg-black/20 text-white/80'
          }`}>
            {product.stock <= 0 ? 'Hết' : `SL: ${product.stock}`}
          </span>

          {/* Hover overlay */}
          <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
      ))}
    </div>
  )
}

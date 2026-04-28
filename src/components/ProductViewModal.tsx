'use client'

import { Product } from '@/lib/types'
import { formatVND } from '@/lib/utils'
import { HiddenPrice } from '@/components/HiddenPrice'

interface ProductViewModalProps {
  product: Product;
  onClose: () => void;
  onEdit?: (product: Product) => void;
}

export function ProductViewModal({ product, onClose, onEdit }: ProductViewModalProps) {
  return (
    <div className="fixed inset-0 z-[150] flex flex-col md:flex-row bg-surface animate-fade-in overflow-hidden">
      {/* Header / Cover Image */}
      <div className="relative flex-1 bg-surface-hover flex items-center justify-center p-4 md:p-8 min-h-[50vh]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain rounded-xl drop-shadow-2xl" />
        ) : (
          <div 
            className="w-full h-full max-w-2xl max-h-[70vh] flex items-center justify-center text-white text-9xl font-bold rounded-3xl shadow-xl"
            style={{ backgroundColor: product.categories?.color || '#6b7280' }}
          >
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:top-6 md:left-6 md:right-auto w-12 h-12 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors backdrop-blur-md text-xl z-20"
        >
          ✕
        </button>
      </div>

      {/* Details Sidebar */}
      <div className="w-full md:w-[400px] lg:w-[480px] bg-surface flex flex-col shadow-2xl z-10 border-t md:border-t-0 md:border-l border-border h-auto md:h-full max-h-[50vh] md:max-h-full overflow-y-auto">
        <div className="px-6 py-6 md:py-8 flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{product.name}</h2>
              {product.alias && <p className="text-base text-muted mt-2">Mã SP: {product.alias}</p>}
            </div>
            <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg shrink-0 ml-4 ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-surface-hover text-muted'}`}>
              {product.is_active ? 'Đang bán' : 'Đã ẩn'}
            </span>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-surface-hover rounded-2xl p-5">
              <div>
                <p className="text-sm text-muted mb-1.5">Giá bán</p>
                <p className="font-bold text-accent text-2xl">{formatVND(product.current_selling_price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1.5">Giá vốn</p>
                <p className="font-semibold text-foreground text-lg"><HiddenPrice value={formatVND(product.current_cost_price)} /></p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-4 pt-2">
              <span className="text-base text-muted">Danh mục</span>
              <span className="text-base font-medium flex items-center gap-2 px-3 py-1 bg-surface-hover rounded-lg">
                {product.categories?.icon} {product.categories?.name || 'Không có'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="text-base text-muted">Tồn kho</span>
              <span className={`text-base font-bold px-3 py-1 rounded-lg ${product.stock <= 5 ? 'bg-red-100 text-danger' : 'bg-surface-hover text-foreground'}`}>
                {product.stock} sản phẩm
              </span>
            </div>

            {product.created_at && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted">Ngày tạo</span>
                <span className="text-sm font-medium">{new Date(product.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {onEdit && (
          <div className="p-6 border-t border-border bg-surface shrink-0">
            <button 
              onClick={() => { onClose(); onEdit(product); }}
              className="w-full btn-press py-4 bg-gradient-to-r from-accent to-purple-600 text-white font-bold text-lg rounded-xl shadow-xl shadow-accent/20"
            >
              Chỉnh sửa sản phẩm
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

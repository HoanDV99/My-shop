'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, Product } from '@/lib/types'
import { useCategories } from '@/lib/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { formatVND } from '@/lib/utils'
import { ProductViewModal } from '@/components/ProductViewModal'

export default function CategoriesPage() {
  const supabase = createClient()

  const queryClient = useQueryClient()
  const { data: categories = [], isLoading } = useCategories()
  const loading = isLoading
  const [showModal, setShowModal] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [viewCategory, setViewCategory] = useState<Category | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formColor, setFormColor] = useState('#6366f1')
  const [formSortOrder, setFormSortOrder] = useState('0')

  // fetch handled by react-query hook

  async function openViewCategory(cat: Category) {
    setViewCategory(cat)
    setLoadingProducts(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', cat.id)
      .order('name')
    setCategoryProducts(data || [])
    setLoadingProducts(false)
  }

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openCreateModal() {
    setEditCategory(null)
    setFormName('')
    setFormIcon('📌')
    setFormColor('#6366f1')
    setFormSortOrder((categories.length * 10).toString())
    setShowModal(true)
  }

  function openEditModal(category: Category) {
    setEditCategory(category)
    setFormName(category.name)
    setFormIcon(category.icon || '')
    setFormColor(category.color || '#6366f1')
    setFormSortOrder((category.sort_order || 0).toString())
    setShowModal(true)
  }

  async function handleSave() {
    if (!formName.trim()) return
    setSaving(true)

    const data = {
      name: formName.trim(),
      icon: formIcon.trim() || null,
      color: formColor.trim() || null,
      sort_order: parseInt(formSortOrder) || 0,
    }

    try {
      if (editCategory) {
        const { error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', editCategory.id)
        if (error) throw error
        showToastMsg('✅ Đã cập nhật danh mục')
      } else {
        const { error } = await supabase.from('categories').insert(data)
        if (error) throw error
        showToastMsg('✅ Đã thêm danh mục mới')
      }
      setShowModal(false)
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
    } catch (error) {
      console.error(error)
      showToastMsg('❌ Lỗi, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🏷️ Quản lý danh mục</h1>
            <p className="text-xs text-muted mt-0.5">{categories.length} danh mục</p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-press px-4 py-2.5 bg-gradient-to-r from-accent to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-accent/25"
          >
            + Thêm mới
          </button>
        </div>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl bg-surface-hover animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <span className="text-5xl mb-4">📭</span>
            <p>Chưa có danh mục nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => openViewCategory(cat)}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer"
              >
                {/* Thumbnail / Category color */}
                <div
                  className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: cat.color || '#6b7280' }}
                >
                  {cat.icon || cat.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold truncate">{cat.name}</p>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Số lượng sản phẩm: {(cat as any).products?.[0]?.count || 0}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(cat); }}
                    className="btn-press w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors text-sm"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Category Products Modal */}
      {viewCategory && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-surface animate-fade-in">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between pt-6 sm:pt-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: viewCategory.color || '#6b7280' }}
              >
                {viewCategory.icon || viewCategory.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold">{viewCategory.name}</h2>
                <p className="text-xs text-muted">{categoryProducts.length} sản phẩm</p>
              </div>
            </div>
            <button onClick={() => setViewCategory(null)} className="text-muted hover:text-foreground text-lg">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 bg-surface">
            {loadingProducts ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <p className="text-4xl mb-2">📦</p>
                <p>Danh mục này chưa có sản phẩm nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoryProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="flex items-center gap-3 p-3 bg-surface-hover rounded-xl border border-transparent hover:border-border transition-colors cursor-pointer"
                  >
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-black/10 flex items-center justify-center text-xl text-muted font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted mt-1">Kho: {p.stock} · Giá bán: <span className="font-medium text-accent">{formatVND(p.current_selling_price)}</span></p>
                    </div>
                    <div className="shrink-0">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-surface text-muted'}`}>
                        {p.is_active ? 'Đang bán' : 'Đã ẩn'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {selectedProduct && (
        <ProductViewModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="animate-slide-up relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editCategory ? '✏️ Sửa danh mục' : '➕ Thêm danh mục'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground text-lg">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Tên danh mục *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Đồ uống"
                  className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Icon (Emoji)</label>
                <input
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="VD: 🥤"
                  className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Màu sắc (Hiển thị nền)</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-12 h-11 rounded-xl cursor-pointer bg-transparent border-none p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 uppercase"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Thứ tự hiển thị (Số nhỏ xếp trước)</label>
                <input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-border flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn-press flex-1 py-3 border border-border rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="btn-press flex-[2] py-3 bg-gradient-to-r from-accent to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-accent/25 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editCategory ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[200] animate-slide-up glass px-5 py-3 rounded-xl text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}

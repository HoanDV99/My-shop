'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/lib/types'
import { formatVND, searchProducts } from '@/lib/utils'

export default function ProductsPage() {
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formAlias, setFormAlias] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formSellingPrice, setFormSellingPrice] = useState('')
  const [formStock, setFormStock] = useState('')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*, categories(*)').order('name'),
    ])
    setCategories(cats || [])
    setProducts(prods || [])
    setLoading(false)
  }

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openCreateModal() {
    setEditProduct(null)
    setFormName('')
    setFormAlias('')
    setFormCategory(categories[0]?.id || '')
    setFormCostPrice('')
    setFormSellingPrice('')
    setFormStock('0')
    setShowModal(true)
  }

  function openEditModal(product: Product) {
    setEditProduct(product)
    setFormName(product.name)
    setFormAlias(product.alias || '')
    setFormCategory(product.category_id || '')
    setFormCostPrice(product.current_cost_price.toString())
    setFormSellingPrice(product.current_selling_price.toString())
    setFormStock(product.stock.toString())
    setShowModal(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formSellingPrice) return
    setSaving(true)

    const data = {
      name: formName.trim(),
      alias: formAlias.trim() || null,
      category_id: formCategory || null,
      current_cost_price: parseInt(formCostPrice) || 0,
      current_selling_price: parseInt(formSellingPrice) || 0,
      stock: parseInt(formStock) || 0,
    }

    try {
      if (editProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editProduct.id)
        if (error) throw error
        showToastMsg('✅ Đã cập nhật sản phẩm')
      } else {
        const { error } = await supabase.from('products').insert(data)
        if (error) throw error
        showToastMsg('✅ Đã thêm sản phẩm mới')
      }
      setShowModal(false)
      await fetchData()
    } catch (error) {
      console.error(error)
      showToastMsg('❌ Lỗi, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(product: Product) {
    await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    await fetchData()
    showToastMsg(product.is_active ? '⏸️ Đã ẩn sản phẩm' : '▶️ Đã hiện sản phẩm')
  }

  const filtered = searchQuery ? searchProducts(products, searchQuery) : products

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">📋 Quản lý sản phẩm</h1>
            <p className="text-xs text-muted mt-0.5">{products.length} sản phẩm</p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-press px-4 py-2.5 bg-gradient-to-r from-accent to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-accent/25"
          >
            + Thêm mới
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-lg">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
          />
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl bg-surface-hover animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <span className="text-5xl mb-4">📭</span>
            <p>Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((product) => (
              <div
                key={product.id}
                className={`flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors ${
                  !product.is_active ? 'opacity-50' : ''
                }`}
              >
                {/* Category color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: product.categories?.color || '#6b7280' }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{product.name}</p>
                    {product.alias && (
                      <span className="text-xs text-muted bg-surface-hover px-1.5 py-0.5 rounded">
                        {product.alias}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                    <span>Vốn: {formatVND(product.current_cost_price)}</span>
                    <span>Bán: <span className="text-accent font-medium">{formatVND(product.current_selling_price)}</span></span>
                    <span className={product.stock <= 5 ? 'text-danger' : ''}>
                      SL: {product.stock}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(product)}
                    className="btn-press w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleToggleActive(product)}
                    className="btn-press w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors text-sm"
                    title={product.is_active ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                  >
                    {product.is_active ? '👁' : '🚫'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="animate-slide-up relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editProduct ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground text-lg">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Coca Cola"
                  className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Alias */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Tên viết tắt (alias)</label>
                <input
                  type="text"
                  value={formAlias}
                  onChange={(e) => setFormAlias(e.target.value)}
                  placeholder="VD: coca, pepsi"
                  className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Danh mục</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Giá vốn (đ)</label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Giá bán (đ) *</label>
                  <input
                    type="number"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Số lượng tồn kho</label>
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
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
                disabled={saving || !formName.trim() || !formSellingPrice}
                className="btn-press flex-[2] py-3 bg-gradient-to-r from-accent to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-accent/25 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editProduct ? 'Cập nhật' : 'Thêm mới'}
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

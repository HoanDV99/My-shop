'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, StockImport } from '@/lib/types'
import { formatVND, formatDateTime, searchProducts } from '@/lib/utils'

export default function InventoryPage() {
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [recentImports, setRecentImports] = useState<StockImport[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [importQuantity, setImportQuantity] = useState('')
  const [importCostPrice, setImportCostPrice] = useState('')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: prods }, { data: imports }] = await Promise.all([
      supabase.from('products').select('*, categories(*)').order('name'),
      supabase
        .from('stock_imports')
        .select('*, products(name)')
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setProducts(prods || [])
    setRecentImports(imports || [])
    setLoading(false)
  }

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function selectProduct(product: Product) {
    setSelectedProduct(product)
    setImportCostPrice(product.current_cost_price.toString())
    setImportQuantity('')
    setSearchQuery('')
  }

  async function handleImport() {
    if (!selectedProduct || !importQuantity) return
    setSaving(true)

    const qty = parseInt(importQuantity)
    const cost = parseInt(importCostPrice) || selectedProduct.current_cost_price

    try {
      // Record import
      const { error: importError } = await supabase.from('stock_imports').insert({
        product_id: selectedProduct.id,
        quantity: qty,
        cost_price: cost,
      })
      if (importError) throw importError

      // Update product stock & cost price
      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock: selectedProduct.stock + qty,
          current_cost_price: cost,
        })
        .eq('id', selectedProduct.id)
      if (updateError) throw updateError

      showToastMsg(`✅ Đã nhập ${qty} ${selectedProduct.name}`)
      setSelectedProduct(null)
      setImportQuantity('')
      setImportCostPrice('')
      await fetchData()
    } catch (error) {
      console.error(error)
      showToastMsg('❌ Lỗi nhập hàng')
    } finally {
      setSaving(false)
    }
  }

  const searchResults = searchQuery.length > 0 ? searchProducts(products, searchQuery) : []

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold">📦 Nhập hàng</h1>
        <p className="text-xs text-muted mt-0.5">Cập nhật số lượng tồn kho và giá vốn</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Import form */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-muted">Chọn sản phẩm</h2>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-lg">🔍</span>
            <input
              type="text"
              value={selectedProduct ? selectedProduct.name : searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (selectedProduct) setSelectedProduct(null)
              }}
              placeholder="Tìm sản phẩm cần nhập..."
              className="w-full pl-11 pr-4 py-3 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            {/* Dropdown */}
            {searchResults.length > 0 && !selectedProduct && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-20 max-h-[200px] overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors text-left text-sm"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted">SL: {p.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected product details */}
          {selectedProduct && (
            <div className="animate-scale-in space-y-4">
              <div className="flex items-center gap-3 bg-surface-hover rounded-xl p-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedProduct.categories?.color || '#6b7280' }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{selectedProduct.name}</p>
                  <p className="text-xs text-muted">
                    Tồn kho: <span className="font-medium text-foreground">{selectedProduct.stock}</span>
                    {' · '}Giá vốn: {formatVND(selectedProduct.current_cost_price)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Số lượng nhập *</label>
                  <input
                    type="number"
                    value={importQuantity}
                    onChange={(e) => setImportQuantity(e.target.value)}
                    placeholder="VD: 24"
                    className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Giá vốn mới (đ)</label>
                  <input
                    type="number"
                    value={importCostPrice}
                    onChange={(e) => setImportCostPrice(e.target.value)}
                    placeholder="Giữ nguyên"
                    className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
              </div>

              {importQuantity && (
                <div className="text-xs text-muted bg-surface-hover rounded-xl p-3">
                  Sau nhập: Tồn kho sẽ là{' '}
                  <span className="font-bold text-success">
                    {selectedProduct.stock + (parseInt(importQuantity) || 0)}
                  </span>{' '}
                  sản phẩm
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={saving || !importQuantity}
                className="btn-press w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {saving ? 'Đang xử lý...' : `📥 Nhập ${importQuantity || '0'} sản phẩm`}
              </button>
            </div>
          )}
        </div>

        {/* Recent imports */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">📋 Lịch sử nhập hàng gần đây</h2>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[60px] rounded-xl bg-surface-hover animate-pulse" />
              ))}
            </div>
          ) : recentImports.length === 0 ? (
            <div className="text-center py-10 text-muted text-sm">Chưa có lịch sử nhập hàng</div>
          ) : (
            <div className="space-y-2">
              {recentImports.map((imp) => (
                <div
                  key={imp.id}
                  className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium">{(imp as unknown as { products: { name: string } }).products?.name || 'N/A'}</p>
                    <p className="text-xs text-muted mt-0.5">{formatDateTime(imp.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">+{imp.quantity}</p>
                    <p className="text-xs text-muted">{formatVND(imp.cost_price)}/cái</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[200] animate-slide-up glass px-5 py-3 rounded-xl text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, StockImport, StockExport } from '@/lib/types'
import { formatVND, formatDateTime, searchProducts } from '@/lib/utils'
import { useProducts, useStockImports, useStockExports } from '@/lib/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { HiddenPrice } from '@/components/HiddenPrice'

export default function InventoryPage() {
  const supabase = createClient()

  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'balance'>('import')

  const { data: products = [], isLoading: isLoadingProds } = useProducts(false)
  const { data: recentImports = [], isLoading: isLoadingImports } = useStockImports()
  const { data: recentExports = [], isLoading: isLoadingExports } = useStockExports()
  const loading = isLoadingProds || isLoadingImports || isLoadingExports

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Nhập kho state
  const [importQuantity, setImportQuantity] = useState('')
  const [importCostPrice, setImportCostPrice] = useState('')
  const [importSupplier, setImportSupplier] = useState('')

  // Xuất kho state
  const [exportQuantity, setExportQuantity] = useState('')
  const [exportReason, setExportReason] = useState('')

  // fetchlogic replaced by react query hooks

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function selectProduct(product: Product) {
    setSelectedProduct(product)
    setImportCostPrice(product.current_cost_price.toLocaleString('vi-VN'))
    setImportQuantity('')
    setImportSupplier('')
    setExportQuantity('')
    setExportReason('')
    setSearchQuery('')
  }

  const handlePriceInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (!rawValue) {
      setter('')
    } else {
      setter(parseInt(rawValue, 10).toLocaleString('vi-VN'))
    }
  }

  async function handleImport() {
    if (!selectedProduct || !importQuantity) return
    setSaving(true)

    const qty = parseInt(importQuantity)
    const cost = parseInt(importCostPrice.replace(/\D/g, '')) || selectedProduct.current_cost_price

    try {
      const { error: importError } = await supabase.from('stock_imports').insert({
        product_id: selectedProduct.id,
        quantity: qty,
        cost_price: cost,
        supplier: importSupplier.trim() || null,
      })
      if (importError) {
        if (importError.message.includes('column "supplier"')) {
          throw new Error('Bạn cần chạy lệnh SQL để thêm cột supplier cho bảng nhập hàng trước!')
        }
        throw importError
      }

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
      setImportSupplier('')
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['stock_imports'] })
    } catch (error) {
      console.error(error)
      showToastMsg('❌ Lỗi nhập hàng')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    if (!selectedProduct || !exportQuantity) return
    setSaving(true)

    const qty = parseInt(exportQuantity)
    if (qty > selectedProduct.stock) {
      showToastMsg('❌ Số lượng xuất lớn hơn tồn kho')
      setSaving(false)
      return
    }

    try {
      // Allow inserting into stock_exports only if bucket check passes or we just catch it
      // Let's just insert
      const { error: exportError } = await supabase.from('stock_exports').insert({
        product_id: selectedProduct.id,
        quantity: qty,
        reason: exportReason.trim() || null,
      })
      
      // If error is about relation doesn't exist, tell user to run SQL
      if (exportError) {
        if (exportError.message.includes('does not exist')) {
          throw new Error('Vui lòng chạy lệnh SQL để tạo bảng stock_exports trước nhé!')
        }
        throw exportError
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: selectedProduct.stock - qty })
        .eq('id', selectedProduct.id)
      if (updateError) throw updateError

      showToastMsg(`✅ Đã xuất ${qty} ${selectedProduct.name}`)
      setSelectedProduct(null)
      setExportQuantity('')
      setExportReason('')
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['stock_exports'] })
    } catch (error: any) {
      console.error(error)
      showToastMsg(error.message || '❌ Lỗi xuất hàng')
    } finally {
      setSaving(false)
    }
  }

  const searchResults = searchQuery.length > 0 ? searchProducts(products, searchQuery) : []

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold">📦 Quản lý kho</h1>
        <p className="text-xs text-muted mt-0.5">Nhập kho, xuất hủy, và thống kê tồn kho</p>
      </div>

      <div className="flex px-4 border-b border-border text-sm overflow-x-auto no-scrollbar mb-4 gap-4">
        <button
          onClick={() => { setActiveTab('import'); setSelectedProduct(null) }}
          className={`py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'import' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'}`}
        >📥 Nhập kho</button>
        <button
          onClick={() => { setActiveTab('export'); setSelectedProduct(null) }}
          className={`py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'export' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'}`}
        >📤 Xuất kho</button>
        <button
          onClick={() => { setActiveTab('balance'); setSelectedProduct(null) }}
          className={`py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'balance' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground'}`}
        >📋 Tồn kho</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {(activeTab === 'import' || activeTab === 'export') && (
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
                placeholder="Tìm sản phẩm cần xử lý..."
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

            {/* Selected product details & Actions */}
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
                      {' · '}Giá vốn: <HiddenPrice value={formatVND(selectedProduct.current_cost_price)} />
                    </p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="text-muted hover:text-foreground">✕</button>
                </div>

                {activeTab === 'import' ? (
                  <>
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
                          type="text"
                          inputMode="numeric"
                          value={importCostPrice}
                          onChange={handlePriceInput(setImportCostPrice)}
                          placeholder="Giữ nguyên"
                          className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Nhà cung cấp / Nguồn nhập</label>
                      <input
                        type="text"
                        value={importSupplier}
                        onChange={(e) => setImportSupplier(e.target.value)}
                        placeholder="VD: Đại lý ABC"
                        className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                      />
                    </div>

                    {importQuantity && (
                      <div className="text-xs text-muted bg-surface-hover rounded-xl p-3">
                        Sau nhập: Tồn kho sẽ là <span className="font-bold text-success">{selectedProduct.stock + (parseInt(importQuantity) || 0)}</span> sản phẩm
                      </div>
                    )}

                    <button
                      onClick={handleImport}
                      disabled={saving || !importQuantity}
                      className="btn-press w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                    >
                      {saving ? 'Đang xử lý...' : `📥 Xác nhận nhập ${importQuantity || '0'} sản phẩm`}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">Số lượng xuất *</label>
                        <input
                          type="number"
                          value={exportQuantity}
                          onChange={(e) => setExportQuantity(e.target.value)}
                          placeholder="VD: 5"
                          className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">Lý do xuất</label>
                        <input
                          type="text"
                          value={exportReason}
                          onChange={(e) => setExportReason(e.target.value)}
                          placeholder="VD: Hàng hỏng"
                          className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                    </div>

                    {exportQuantity && (
                      <div className="text-xs text-muted bg-surface-hover rounded-xl p-3">
                        Sau xuất: Tồn kho chỉ còn <span className="font-bold text-danger">{selectedProduct.stock - (parseInt(exportQuantity) || 0)}</span> sản phẩm
                      </div>
                    )}

                    <button
                      onClick={handleExport}
                      disabled={saving || !exportQuantity}
                      className="btn-press w-full py-3 bg-gradient-to-r from-danger to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-danger/25 disabled:opacity-50"
                    >
                      {saving ? 'Đang xử lý...' : `📤 Xác nhận xuất ${exportQuantity || '0'} sản phẩm`}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* History sections */}
        {activeTab === 'import' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted">📋 Lịch sử nhập hàng gần đây</h2>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[60px] rounded-xl bg-surface-hover animate-pulse" />)}
              </div>
            ) : recentImports.length === 0 ? (
              <div className="text-center py-10 text-muted text-sm">Chưa có lịch sử nhập hàng</div>
            ) : (
              <div className="space-y-2">
                {recentImports.map((imp) => (
                  <div key={imp.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{(imp as any).products?.name || 'N/A'}</p>
                      <p className="text-xs text-muted mt-0.5">{formatDateTime(imp.created_at)} {imp.supplier && `· ${imp.supplier}`}</p>
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
        )}

        {activeTab === 'export' && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted">📋 Lịch sử xuất hàng gần đây</h2>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[60px] rounded-xl bg-surface-hover animate-pulse" />)}
              </div>
            ) : recentExports.length === 0 ? (
              <div className="text-center py-10 text-muted text-sm">Chưa có lịch sử xuất hàng</div>
            ) : (
              <div className="space-y-2">
                {recentExports.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{(exp as any).products?.name || 'N/A'}</p>
                      <p className="text-xs text-muted mt-0.5">{formatDateTime(exp.created_at)} {exp.reason && `· ${exp.reason}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-danger">-{exp.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Balance tab */}
        {activeTab === 'balance' && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-sm font-semibold text-muted">Danh sách tồn kho</h2>
               <div className="text-right text-xs">
                  <p className="text-muted">Tổng đọng vốn</p>
                  <p className="font-bold text-accent text-sm">
                    <HiddenPrice value={formatVND(products.filter(p => p.is_active).reduce((acc, p) => acc + (p.stock * p.current_cost_price), 0))} />
                  </p>
               </div>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[60px] rounded-xl bg-surface-hover animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {products.filter(p => p.is_active).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-surface-hover rounded-xl border border-transparent hover:border-border transition-colors">
                     <div>
                        <p className="text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-muted mt-0.5">Vốn: <HiddenPrice value={formatVND(p.current_cost_price)} /></p>
                     </div>
                     <div className="text-right">
                       <p className={`text-sm font-bold ${p.stock <= 5 ? 'text-danger' : 'text-foreground'}`}>
                         {p.stock} <span className="text-xs font-normal text-muted">cái</span>
                       </p>
                       <p className="text-xs font-medium text-muted mt-0.5"><HiddenPrice value={formatVND(p.stock * p.current_cost_price)} /></p>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

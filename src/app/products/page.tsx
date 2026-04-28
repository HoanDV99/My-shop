'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/lib/types'
import { formatVND, searchProducts } from '@/lib/utils'
import { useProducts, useCategories } from '@/lib/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { HiddenPrice } from '@/components/HiddenPrice'

// Resize image using Canvas before upload (max 800x800, JPEG 85%)
async function resizeImage(file: File, maxSize = 800, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not supported'))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to resize image'))
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

export default function ProductsPage() {
  const supabase = createClient()

  const queryClient = useQueryClient()
  const { data: categories = [], isLoading: loadingCats } = useCategories()
  const { data: products = [], isLoading: loadingProds } = useProducts(false)
  const loading = loadingCats || loadingProds

  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formAlias, setFormAlias] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formSellingPrice, setFormSellingPrice] = useState('')
  const [formStock, setFormStock] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formDescription, setFormDescription] = useState('')

  // Image upload state
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // fetch logic handled by Query hooks

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
    setFormImage('')
    setFormDescription('')
    setImageMode('url')
    setImageFile(null)
    setImagePreview(null)
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
    setFormImage(product.image_url || '')
    setFormDescription(product.description || '')
    setImageMode(product.image_url ? 'url' : 'upload')
    setImageFile(null)
    setImagePreview(product.image_url || null)
    setShowModal(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formSellingPrice) return
    setSaving(true)

    let finalImageUrl = formImage.trim() || null

    if (imageMode === 'upload' && imageFile) {
      setUploadingImage(true)
      try {
        const resizedFile = await resizeImage(imageFile)
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, resizedFile)
        
        if (uploadError) {
          if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('Object not found')) {
            throw new Error('Vui lòng tạo bucket "product-images" (Public) trên Supabase')
          }
          throw uploadError
        }

        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        finalImageUrl = publicUrlData.publicUrl
      } catch (err: any) {
        setSaving(false)
        setUploadingImage(false)
        console.error('Upload err:', err)
        showToastMsg(`❌ Lỗi tải ảnh: ${err.message}`)
        return
      }
      setUploadingImage(false)
    }

    const data = {
      name: formName.trim(),
      alias: formAlias.trim() || null,
      category_id: formCategory || null,
      current_cost_price: parseInt(formCostPrice.replace(/\D/g, '')) || 0,
      current_selling_price: parseInt(formSellingPrice.replace(/\D/g, '')) || 0,
      stock: parseInt(formStock) || 0,
      image_url: finalImageUrl,
      description: formDescription.trim() || null,
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
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
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
    await queryClient.invalidateQueries({ queryKey: ['products'] })
    showToastMsg(product.is_active ? '⏸️ Đã ẩn sản phẩm' : '▶️ Đã hiện sản phẩm')
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setFormImage('')
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormImage('')
  }

  const handlePriceInput = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (!rawValue) {
      setter('')
    } else {
      setter(parseInt(rawValue, 10).toLocaleString('vi-VN'))
    }
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
                onClick={() => setViewProduct(product)}
                className={`flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer ${
                  !product.is_active ? 'opacity-50' : ''
                }`}
              >
                {/* Thumbnail / Category color */}
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: product.categories?.color || '#6b7280' }}
                  >
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}

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
                    <span>Vốn: <HiddenPrice value={formatVND(product.current_cost_price)} /></span>
                    <span>Bán: <span className="text-accent font-medium">{formatVND(product.current_selling_price)}</span></span>
                    <span className={product.stock <= 5 ? 'text-danger' : ''}>
                      SL: {product.stock}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(product) }}
                    className="btn-press w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleActive(product) }}
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

      {/* View Modal (Full Screen) */}
      {viewProduct && (
        <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-surface animate-fade-in overflow-hidden">
          {/* Header / Cover Image (Takes up most space) */}
          <div className="relative flex-1 bg-surface-hover flex items-center justify-center p-4 md:p-8 min-h-[50vh]">
            {viewProduct.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewProduct.image_url} alt={viewProduct.name} className="max-w-full max-h-full object-contain rounded-xl drop-shadow-2xl" />
            ) : (
              <div 
                className="w-full h-full max-w-2xl max-h-[70vh] flex items-center justify-center text-white text-9xl font-bold rounded-3xl shadow-xl"
                style={{ backgroundColor: viewProduct.categories?.color || '#6b7280' }}
              >
                {viewProduct.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <button 
              onClick={() => setViewProduct(null)} 
              className="absolute top-4 right-4 md:top-6 md:left-6 md:right-auto w-12 h-12 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors backdrop-blur-md text-xl z-10"
            >
              ✕
            </button>
          </div>

          {/* Details Sidebar */}
          <div className="w-full md:w-[400px] lg:w-[480px] bg-surface flex flex-col shadow-2xl z-10 border-t md:border-t-0 md:border-l border-border h-auto md:h-full max-h-[50vh] md:max-h-full overflow-y-auto">
            <div className="px-6 py-6 md:py-8 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{viewProduct.name}</h2>
                  {viewProduct.alias && <p className="text-base text-muted mt-2">Mã SP: {viewProduct.alias}</p>}
                </div>
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-lg shrink-0 ml-4 ${viewProduct.is_active ? 'bg-green-100 text-green-700' : 'bg-surface-hover text-muted'}`}>
                  {viewProduct.is_active ? 'Đang bán' : 'Đã ẩn'}
                </span>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4 bg-surface-hover rounded-2xl p-5">
                  <div>
                    <p className="text-sm text-muted mb-1.5">Giá bán</p>
                    <p className="font-bold text-accent text-2xl">{formatVND(viewProduct.current_selling_price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1.5">Giá vốn</p>
                    <p className="font-semibold text-foreground text-lg"><HiddenPrice value={formatVND(viewProduct.current_cost_price)} /></p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-4 pt-2">
                  <span className="text-base text-muted">Danh mục</span>
                  <span className="text-base font-medium flex items-center gap-2 px-3 py-1 bg-surface-hover rounded-lg">
                    {viewProduct.categories?.icon} {viewProduct.categories?.name || 'Không có'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="text-base text-muted">Tồn kho</span>
                  <span className={`text-base font-bold px-3 py-1 rounded-lg ${viewProduct.stock <= 5 ? 'bg-red-100 text-danger' : 'bg-surface-hover text-foreground'}`}>
                    {viewProduct.stock} sản phẩm
                  </span>
                </div>

                {viewProduct.description && (
                  <div className="pt-2">
                    <span className="text-sm font-bold text-muted block mb-2">Mô tả sản phẩm</span>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-surface-hover p-4 rounded-xl border border-border">
                      {viewProduct.description}
                    </p>
                  </div>
                )}

                {viewProduct.created_at && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted">Ngày tạo</span>
                    <span className="text-sm font-medium">{new Date(viewProduct.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-surface shrink-0">
              <button 
                onClick={() => { setViewProduct(null); openEditModal(viewProduct); }}
                className="w-full btn-press py-4 bg-gradient-to-r from-accent to-purple-600 text-white font-bold text-lg rounded-xl shadow-xl shadow-accent/20"
              >
                Chỉnh sửa sản phẩm
              </button>
            </div>
          </div>
        </div>
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
                <label className="block text-xs font-medium text-muted mb-1.5">Mã sản phẩm (alias)</label>
                <input
                  type="text"
                  value={formAlias}
                  onChange={(e) => setFormAlias(e.target.value)}
                  placeholder="VD: SP001, COCA"
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

              {/* Image Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-muted">Hình ảnh sản phẩm</label>
                  <div className="flex bg-surface-hover rounded-lg p-0.5">
                    <button
                      onClick={() => setImageMode('url')}
                      className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${imageMode === 'url' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                      URL
                    </button>
                    <button
                      onClick={() => setImageMode('upload')}
                      className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${imageMode === 'upload' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                    >
                      Upload / Chụp
                    </button>
                  </div>
                </div>

                {imageMode === 'url' ? (
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => {
                      setFormImage(e.target.value)
                      setImagePreview(e.target.value)
                    }}
                    placeholder="https://example.com/image.png"
                    className="w-full px-4 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                ) : (
                  <div className="flex gap-2">
                    <label className="flex-1 btn-press flex items-center justify-center gap-2 py-2 bg-surface-hover border border-border rounded-xl text-sm cursor-pointer hover:bg-surface transition-colors">
                      <span>📁 File</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                    </label>
                    <label className="flex-1 btn-press flex items-center justify-center gap-2 py-2 bg-surface-hover border border-border rounded-xl text-sm cursor-pointer hover:bg-surface transition-colors">
                      <span>📸 Chụp</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageFileChange} />
                    </label>
                  </div>
                )}

                {/* Preview */}
                {imagePreview && (
                  <div className="mt-2 w-full h-32 rounded-xl overflow-hidden bg-surface-hover border border-border flex items-center justify-center relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                    <button onClick={clearImage} className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black transition-colors">✕</button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Mô tả sản phẩm</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Nhập mô tả chi tiết sản phẩm..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Giá vốn (đ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formCostPrice}
                    onChange={handlePriceInput(setFormCostPrice)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Giá bán (đ) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formSellingPrice}
                    onChange={handlePriceInput(setFormSellingPrice)}
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
                className="btn-press flex-[2] py-3 bg-gradient-to-r from-accent to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-accent/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (uploadingImage ? 'Đang tải ảnh...' : 'Đang lưu...') : editProduct ? 'Cập nhật' : 'Thêm mới'}
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

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pinEntry, setPinEntry] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const APP_PIN = process.env.NEXT_PUBLIC_APP_PIN || '78952'

  const handleResetData = async () => {
    if (pinEntry !== APP_PIN) {
      setError('❌ Mã PIN không chính xác!')
      setPinEntry('')
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      // Deletion order to avoid FK constraints
      const tables = [
        'order_items',
        'orders',
        'stock_exports',
        'stock_imports',
        'products',
        'categories'
      ]

      for (const table of tables) {
        // Supabase doesn't allow unconditional delete. 
        // We use a dummy condition that matches all (id is not null)
        const { error: delError } = await supabase
          .from(table)
          .delete()
          .not('id', 'is', null)

        if (delError) {
          console.error(`Error deleting ${table}:`, delError)
          // Some tables might not exist or have different patterns
        }
      }

      setSuccess('✅ Toàn bộ dữ liệu đã được xóa sạch!')
      setShowConfirm(false)
      
      // Reload page after a delay to clear all caches
      setTimeout(() => {
        window.location.href = '/pos'
      }, 2000)

    } catch (err: any) {
      setError('❌ Lỗi hệ thống: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-full bg-background p-6">
      <div className="max-w-2xl mx-auto w-full space-y-8 animate-fade-in">
        <header>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="text-4xl text-accent">⚙️</span> Cài đặt hệ thống
          </h1>
          <p className="text-muted mt-2">Quản lý cấu hình và dữ liệu ứng dụng của bạn.</p>
        </header>

        <div className="grid gap-6">
          {/* General settings could go here */}
          
          {/* Danger Zone */}
          <section className="bg-surface border border-danger/20 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-danger/10 bg-danger/5">
              <h2 className="text-lg font-bold text-danger flex items-center gap-2">
                ⚠️ Khu vực nguy hiểm (Danger Zone)
              </h2>
              <p className="text-xs text-muted mt-1">
                Các thao tác tại đây không thể hoàn tác. Hãy cẩn trọng.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base">Xóa toàn bộ dữ liệu (Factory Reset)</h3>
                  <p className="text-xs text-muted mt-1 max-w-sm">
                    Xóa sạch 100% Sản phẩm, Danh mục, Đơn hàng và Lịch sử kho. Đưa ứng dụng về trạng thái mới cài đặt.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="btn-press px-6 py-3 bg-danger text-white font-bold rounded-xl shadow-lg shadow-danger/20 active:scale-95 transition-transform"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isDeleting && setShowConfirm(false)} />
          
          <div className="relative bg-surface w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border animate-scale-in">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center text-3xl">
                🚨
              </div>
              <h3 className="text-2xl font-black text-danger">Xác nhận xóa!</h3>
              <p className="text-sm text-muted">
                Hành động này sẽ xóa **vĩnh viễn** toàn bộ dữ liệu của bạn trên Supabase. Không thể khôi phục.
              </p>
              
              <div className="pt-4 space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">
                    Nhập mã PIN để xác nhận
                  </label>
                  <input
                    type="password"
                    maxLength={5}
                    value={pinEntry}
                    onChange={(e) => setPinEntry(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••••"
                    className="w-full h-14 bg-background border border-border rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:border-accent outline-none"
                    disabled={isDeleting}
                  />
                  {error && <p className="text-danger text-xs font-bold text-center mt-2">{error}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 h-12 rounded-xl font-bold bg-surface-hover hover:bg-border transition-colors disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleResetData}
                    disabled={isDeleting || pinEntry.length < 5}
                    className="flex-[2] h-12 rounded-xl font-bold bg-danger text-white hover:bg-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xóa...
                      </>
                    ) : (
                      '🔥 XÁC NHẬN XÓA TẤT CẢ'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[3000] glass px-8 py-4 rounded-2xl shadow-2xl border-success/30 flex items-center gap-3 animate-slide-up">
          <span className="text-2xl">🎉</span>
          <span className="font-bold text-success">{success}</span>
        </div>
      )}
    </div>
  )
}

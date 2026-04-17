'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem } from '@/lib/types'
import { formatVND, formatDateTime, formatDate } from '@/lib/utils'
import { useOrdersReport } from '@/lib/hooks/queries'

type DateRange = 'today' | '7days' | '30days' | 'all'

export default function ReportsPage() {
  const supabase = createClient()

  const [dateRange, setDateRange] = useState<DateRange>('today')

  const { data, isLoading: loading } = useOrdersReport(dateRange)
  const orders = data?.orders || []
  const orderItems = data?.orderItems || []

  // fetching handled by react-query hook

  // Computed stats
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + o.total_amount, 0)
    const totalProfit = orderItems.reduce(
      (s, item) => s + (item.price_at_sale - item.cost_at_sale) * item.quantity,
      0
    )
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    return { totalRevenue, totalProfit, totalOrders, avgOrderValue }
  }, [orders, orderItems])

  // Daily data for chart
  const dailyData = useMemo(() => {
    const dayMap = new Map<string, { revenue: number; profit: number; orders: number }>()

    orders.forEach((order) => {
      const day = new Date(order.created_at).toISOString().split('T')[0]
      const existing = dayMap.get(day) || { revenue: 0, profit: 0, orders: 0 }
      existing.revenue += order.total_amount
      existing.orders += 1
      dayMap.set(day, existing)
    })

    orderItems.forEach((item) => {
      // Find order to get date
      const order = orders.find((o) => o.id === item.order_id)
      if (order) {
        const day = new Date(order.created_at).toISOString().split('T')[0]
        const existing = dayMap.get(day)
        if (existing) {
          existing.profit += (item.price_at_sale - item.cost_at_sale) * item.quantity
        }
      }
    })

    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }))
  }, [orders, orderItems])

  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1)

  const DATE_OPTIONS: { key: DateRange; label: string }[] = [
    { key: 'today', label: 'Hôm nay' },
    { key: '7days', label: '7 ngày' },
    { key: '30days', label: '30 ngày' },
    { key: 'all', label: 'Tất cả' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div>
          <h1 className="text-xl font-bold">📊 Báo cáo</h1>
          <p className="text-xs text-muted mt-0.5">Doanh thu và lợi nhuận</p>
        </div>

        {/* Date range tabs */}
        <div className="flex gap-2">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDateRange(opt.key)}
              className={`btn-press px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                dateRange === opt.key
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : 'bg-surface-hover text-muted hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[80px] rounded-2xl bg-surface-hover animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-xs text-muted mb-1">💰 Doanh thu</p>
                <p className="text-lg font-extrabold gradient-text">{formatVND(stats.totalRevenue)}</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-xs text-muted mb-1">📈 Lợi nhuận</p>
                <p className={`text-lg font-extrabold ${stats.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}{formatVND(stats.totalProfit)}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-xs text-muted mb-1">🧾 Số đơn hàng</p>
                <p className="text-lg font-extrabold">{stats.totalOrders}</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-xs text-muted mb-1">📊 TB /đơn</p>
                <p className="text-lg font-extrabold">{formatVND(stats.avgOrderValue)}</p>
              </div>
            </div>

            {/* Bar chart */}
            {dailyData.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-muted mb-4">Doanh thu theo ngày</h3>
                <div className="space-y-3">
                  {dailyData.map((day) => (
                    <div key={day.date} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">{formatDate(day.date)}</span>
                        <span className="font-medium">{formatVND(day.revenue)}</span>
                      </div>
                      <div className="h-6 bg-surface-hover rounded-lg overflow-hidden flex">
                        {/* Revenue bar */}
                        <div
                          className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${(day.revenue / maxRevenue) * 100}%`, minWidth: day.revenue > 0 ? '40px' : '0' }}
                        >
                          {day.orders > 0 && (
                            <span className="text-[10px] text-white font-medium">{day.orders} đơn</span>
                          )}
                        </div>
                      </div>
                      {/* Profit line */}
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <span className="text-success">Lãi: {formatVND(day.profit)}</span>
                        {day.revenue > 0 && (
                          <span>({((day.profit / day.revenue) * 100).toFixed(0)}%)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent orders */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted">🧾 Đơn hàng gần đây</h3>
              {orders.length === 0 ? (
                <div className="text-center py-10 text-muted text-sm">
                  Chưa có đơn hàng nào trong khoảng thời gian này
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 20).map((order) => {
                    const items = orderItems.filter((i) => i.order_id === order.id)
                    const profit = items.reduce(
                      (s, i) => s + (i.price_at_sale - i.cost_at_sale) * i.quantity,
                      0
                    )
                    return (
                      <div
                        key={order.id}
                        className="bg-surface border border-border rounded-xl p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{formatVND(order.total_amount)}</p>
                            <p className="text-xs text-muted mt-0.5">
                              {formatDateTime(order.created_at)} · {items.length} mặt hàng
                            </p>
                          </div>
                          <span className={`text-sm font-bold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                            {profit >= 0 ? '+' : ''}{formatVND(profit)}
                          </span>
                        </div>
                        {/* Item details */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {items.map((item) => (
                            <span
                              key={item.id}
                              className="text-[10px] bg-surface-hover text-muted px-2 py-0.5 rounded-md"
                            >
                              {(item as unknown as { products: { name: string } }).products?.name || '??'} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

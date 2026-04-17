import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/lib/types'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*, products(count)')
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    staleTime: Infinity,
  })
}

export function useProducts(activeOnly = false) {
  return useQuery({
    queryKey: ['products', activeOnly],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase.from('products').select('*, categories(*)').order('name')
      if (activeOnly) {
        query = query.eq('is_active', true)
      }
      const { data, error } = await query
      
      if (error) throw error
      return (data || []) as Product[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useStockImports() {
  return useQuery({
    queryKey: ['stock_imports'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('stock_imports')
        .select('*, products(name)')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useStockExports() {
  return useQuery({
    queryKey: ['stock_exports'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('stock_exports')
        .select('*, products(name)')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useOrdersReport(dateRange: string) {
  return useQuery({
    queryKey: ['orders_report', dateRange],
    queryFn: async () => {
      const supabase = createClient()
      let fromDate: string | null = null
      const now = new Date()

      if (dateRange === 'today') {
        const start = new Date(now)
        start.setHours(0, 0, 0, 0)
        fromDate = start.toISOString()
      } else if (dateRange === '7days') {
        const start = new Date(now)
        start.setDate(start.getDate() - 7)
        fromDate = start.toISOString()
      } else if (dateRange === '30days') {
        const start = new Date(now)
        start.setDate(start.getDate() - 30)
        fromDate = start.toISOString()
      }

      let ordersQuery = supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (fromDate) {
        ordersQuery = ordersQuery.gte('created_at', fromDate)
      }

      const { data: ordersData, error: ordersError } = await ordersQuery
      if (ordersError) throw ordersError

      const orderIds = (ordersData || []).map((o: any) => o.id)

      let itemsData: any[] = []
      if (orderIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from('order_items')
          .select('*, products(name)')
          .in('order_id', orderIds)
        if (itemsError) throw itemsError
        itemsData = data || []
      }

      return { orders: ordersData || [], orderItems: itemsData }
    },
    staleTime: 5 * 60 * 1000,
  })
}

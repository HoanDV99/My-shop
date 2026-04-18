'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { href: '/pos', icon: '🛒', label: 'Bán hàng' },
  { href: '/products', icon: '📋', label: 'Sản phẩm' },
  { href: '/categories', icon: '🏷️', label: 'Danh mục' },
  { href: '/inventory', icon: '📦', label: 'Nhập hàng' },
  { href: '/reports', icon: '📊', label: 'Báo cáo' },
  { href: '/settings', icon: '⚙️', label: 'Cài đặt' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-[220px] h-full bg-surface border-r border-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <span className="text-2xl">🏪</span>
        <span className="font-bold text-lg gradient-text">My Shop</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 p-3 mt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent/15 text-accent-hover shadow-sm shadow-accent/10'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-1 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin</p>
            <p className="text-xs text-muted truncate">my-shop.pos</p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}

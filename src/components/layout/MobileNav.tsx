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
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border" style={{ paddingBottom: 'var(--sab)' }}>
      <div className="flex items-center justify-around h-20 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1.5 rounded-xl transition-all duration-200 flex-1 min-w-[48px] max-w-[70px] ${
                isActive
                  ? 'text-accent-hover'
                  : 'text-muted'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0 w-5 h-0.5 rounded-full bg-accent" />
              )}
            </Link>
          )
        })}
        <div className="flex items-center justify-center min-w-[50px] shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}

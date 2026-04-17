import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { ThemeProvider } from '@/components/ThemeProvider'
import QueryProvider from '@/lib/providers/QueryProvider'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'My Shop — Quản lý bán hàng',
  description: 'Hệ thống POS quản lý bán hàng tạp hóa thông minh, nhanh gọn, dễ dùng.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full flex bg-background text-foreground font-sans antialiased">
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {/* Sidebar — desktop only */}
            <Sidebar />

            {/* Main content area */}
            <main className="flex-1 flex flex-col min-h-full overflow-hidden pb-16 lg:pb-0 relative z-0">
              {children}
            </main>

            {/* Bottom navigation — mobile only */}
            <MobileNav />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

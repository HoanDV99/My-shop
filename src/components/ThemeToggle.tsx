'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-10 h-10 shrink-0" />

  const currentTheme = theme === 'system' ? resolvedTheme : theme

  return (
    <button
      onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
      className="btn-press flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-surface-hover text-muted hover:text-foreground transition-colors shadow-sm"
      title="Giao diện Sáng / Tối"
    >
      {currentTheme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

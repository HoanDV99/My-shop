'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-lg">🔍</span>
      <input
        id="pos-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm nhanh... (tên hoặc mã SP)"
        className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all duration-200"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-lg transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}

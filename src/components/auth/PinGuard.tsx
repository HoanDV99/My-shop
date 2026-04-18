'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/useAuthStore'

export function PinGuard({ children }: { children: React.ReactNode }) {
  const { isUnlocked, unlock } = useAuthStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Avoid hydration flicker
  useEffect(() => {
    setIsLoading(false)
  }, [])

  const handleKeyPress = (num: string) => {
    if (error) setError(false)
    if (pin.length < 5) {
      const newPin = pin + num
      setPin(newPin)
      
      // Auto-submit when 5 digits are reached
      if (newPin.length === 5) {
        if (unlock(newPin)) {
          // Success!
        } else {
          setError(true)
          setTimeout(() => setPin(''), 500)
        }
      }
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  if (isLoading) return null

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-12 text-center animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center text-4xl animate-bounce">
            🔒
          </div>
          <h1 className="text-3xl font-black tracking-tight">Access Locked</h1>
          <p className="text-muted text-sm font-medium">Nhập mã PIN 5 chữ số để tiếp tục</p>
        </div>

        {/* PIN Indicators */}
        <div className={`flex justify-center gap-4 ${error ? 'animate-shake' : ''}`}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < pin.length 
                  ? 'bg-accent border-accent scale-125 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                  : 'bg-transparent border-border'
              } ${error ? 'border-danger bg-danger' : ''}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="btn-press flex items-center justify-center h-16 rounded-2xl bg-surface border border-border text-2xl font-bold hover:bg-surface-hover active:bg-accent active:text-white transition-all"
            >
              {num}
            </button>
          ))}
          <div /> {/* Spacer */}
          <button
            onClick={() => handleKeyPress('0')}
            className="btn-press flex items-center justify-center h-16 rounded-2xl bg-surface border border-border text-2xl font-bold hover:bg-surface-hover active:bg-accent active:text-white transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="btn-press flex items-center justify-center h-16 rounded-2xl bg-surface/50 text-xl font-bold hover:text-danger transition-colors text-muted"
          >
            ⌫
          </button>
        </div>

        {error && (
          <p className="text-danger font-bold text-sm animate-fade-in">
            ❌ Mã PIN không chính xác. Thử lại!
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  )
}

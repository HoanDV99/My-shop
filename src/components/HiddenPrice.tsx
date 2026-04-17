'use client'

import { useState } from 'react'

interface HiddenPriceProps {
  value: React.ReactNode;
  className?: string;
}

export function HiddenPrice({ value, className = '' }: HiddenPriceProps) {
  const [show, setShow] = useState(false)
  
  return (
    <span 
      onClick={(e) => { 
        e.stopPropagation(); 
        e.preventDefault();
        setShow(!show);
      }}
      className={`cursor-pointer transition-all duration-300 inline-block ${!show ? 'blur-[5px] select-none opacity-70' : ''} ${className}`}
      title={show ? "Nhấn để che lại" : "Nhấn để xem"}
    >
      {value}
    </span>
  )
}

"use client"

import { useEffect, useState } from "react"

interface UserCursorProps {
  userName: string
  color: string
  position: { x: number; y: number }
}

export function UserCursor({ userName, color, position }: UserCursorProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => setIsVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [position])

  if (!isVisible) return null

  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-1px, -2px)",
      }}
    >
      {/* Cursor line */}
      <div className="w-0.5 h-5 animate-pulse" style={{ backgroundColor: color }} />
      {/* User label */}
      <div
        className="absolute top-0 left-2 px-2 py-1 rounded text-xs text-white whitespace-nowrap text-balance"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </div>
  )
}

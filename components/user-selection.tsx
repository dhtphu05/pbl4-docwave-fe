"use client"

import type React from "react"

interface UserSelectionProps {
  userName: string
  color: string
  children: React.ReactNode
}

export function UserSelection({ userName, color, children }: UserSelectionProps) {
  return (
    <span
      className="relative"
      style={{
        backgroundColor: `${color}20`,
        borderRadius: "2px",
      }}
    >
      {children}
      <span
        className="absolute -top-6 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap text-balance z-10"
        style={{ backgroundColor: color }}
      >
        {userName}
      </span>
    </span>
  )
}

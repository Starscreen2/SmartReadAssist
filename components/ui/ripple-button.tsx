"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type RippleType = {
  x: number
  y: number
  size: number
  id: number
}

interface RippleButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  color?: string
  duration?: number
}

export function RippleButton({
  children,
  className,
  color = "rgba(255, 255, 255, 0.7)",
  duration = 850,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<RippleType[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const nextId = useRef(0)

  const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2

    // Calculate ripple position relative to the button
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const newRipple: RippleType = {
      x,
      y,
      size,
      id: nextId.current,
    }

    nextId.current += 1
    setRipples((prevRipples) => [...prevRipples, newRipple])
  }

  // Remove ripples after animation completes
  useEffect(() => {
    if (ripples.length === 0) return

    const timeoutId = setTimeout(() => {
      setRipples((prevRipples) => prevRipples.slice(1))
    }, duration)

    return () => clearTimeout(timeoutId)
  }, [ripples, duration])

  return (
    <Button ref={buttonRef} className={cn("relative overflow-hidden", className)} onClick={addRipple} {...props}>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
      {children}
    </Button>
  )
}


"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return

    // Function to check if device is mobile based on screen width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Function to check if device has touch capability
    const checkTouch = () => {
      setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)
    }

    // Initial checks
    checkMobile()
    checkTouch()

    // Add resize listener for responsive updates
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return { isMobile, isTouch }
}


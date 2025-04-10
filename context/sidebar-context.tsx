"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type SidebarContextType = {
  isExpanded: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Load sidebar state from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-expanded")
    if (savedState !== null) {
      setIsExpanded(savedState === "true")
    }
  }, [])

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("sidebar-expanded", isExpanded.toString())
  }, [isExpanded])

  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev)
  }

  return <SidebarContext.Provider value={{ isExpanded, toggleSidebar }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}


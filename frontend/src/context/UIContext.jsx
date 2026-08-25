import { createContext, useContext, useState, useMemo, useCallback } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((prev) => !prev),
    []
  )

  const openMobileNav = useCallback(() => setMobileNavOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      mobileNavOpen,
      openMobileNav,
      closeMobileNav,
    }),
    [sidebarCollapsed, mobileNavOpen, toggleSidebar, openMobileNav, closeMobileNav]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return ctx
}

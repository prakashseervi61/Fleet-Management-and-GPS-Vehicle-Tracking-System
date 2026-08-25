import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { TOAST_DURATION_MS } from '../constants/businessRules'

const NotificationContext = createContext(null)

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random()}`
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const pushNotification = useCallback(
    ({ type, title, message }) => {
      const id = generateId()
      const notification = {
        id,
        type,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      }
      setNotifications((prev) => [notification, ...prev])

      setTimeout(() => {
        dismiss(id)
      }, TOAST_DURATION_MS)

      return id
    },
    [dismiss]
  )

  const success = useCallback(
    (title, message) => pushNotification({ type: 'success', title, message }),
    [pushNotification]
  )

  const error = useCallback(
    (title, message) => pushNotification({ type: 'error', title, message }),
    [pushNotification]
  )

  const info = useCallback(
    (title, message) => pushNotification({ type: 'info', title, message }),
    [pushNotification]
  )

  const warning = useCallback(
    (title, message) => pushNotification({ type: 'warning', title, message }),
    [pushNotification]
  )

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clear = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      success,
      error,
      info,
      warning,
      dismiss,
      markAllRead,
      clear,
    }),
    [notifications, unreadCount, success, error, info, warning, dismiss, markAllRead, clear]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return ctx
}

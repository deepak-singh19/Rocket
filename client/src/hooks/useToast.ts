import { useState, useCallback } from 'react'
import { ToastProps } from '../components/Toast'

interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  timestamp?: Date
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastProps = {
      id,
      type: options.type || 'info',
      message,
      timestamp: options.timestamp || new Date(),
      duration: options.duration || 4000,
      onClose: () => {} // Will be set by ToastContainer
    }

    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    return addToast(message, { ...options, type: 'success' })
  }, [addToast])

  const showError = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    return addToast(message, { ...options, type: 'error' })
  }, [addToast])

  const showInfo = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    return addToast(message, { ...options, type: 'info' })
  }, [addToast])

  const showWarning = useCallback((message: string, options: Omit<ToastOptions, 'type'> = {}) => {
    return addToast(message, { ...options, type: 'warning' })
  }, [addToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll
  }
}

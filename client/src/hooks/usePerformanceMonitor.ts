import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  memoryUsage: number
  frameRate: number
}

interface PerformanceMonitorOptions {
  enabled?: boolean
  logToConsole?: boolean
  reportInterval?: number
  trackMemory?: boolean
  trackFrameRate?: boolean
}

export const usePerformanceMonitor = (
  componentName: string,
  options: PerformanceMonitorOptions = {}
) => {
  const {
    enabled = true,
    logToConsole = false,
    reportInterval = 5000,
    trackMemory = true,
    trackFrameRate = true
  } = options

  const renderCountRef = useRef(0)
  const renderTimesRef = useRef<number[]>([])
  const lastRenderTimeRef = useRef(0)
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(performance.now())
  const memoryRef = useRef<number[]>([])

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    memoryUsage: 0,
    frameRate: 0
  })

  // Track render performance
  useEffect(() => {
    if (!enabled) return

    const startTime = performance.now()
    renderCountRef.current += 1

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      renderTimesRef.current.push(renderTime)
      lastRenderTimeRef.current = renderTime

      // Keep only last 100 render times for average calculation
      if (renderTimesRef.current.length > 100) {
        renderTimesRef.current.shift()
      }

      // Update metrics
      const averageRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
      
      setMetrics(prev => ({
        ...prev,
        renderCount: renderCountRef.current,
        averageRenderTime,
        lastRenderTime: renderTime
      }))

      if (logToConsole) {

      }
    }
  })

  // Track memory usage
  useEffect(() => {
    if (!enabled || !trackMemory) return

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
        memoryRef.current.push(memoryUsage)
        
        // Keep only last 50 memory readings
        if (memoryRef.current.length > 50) {
          memoryRef.current.shift()
        }

        setMetrics(prev => ({
          ...prev,
          memoryUsage
        }))
      }
    }

    updateMemoryUsage()
    const interval = setInterval(updateMemoryUsage, 1000)
    return () => clearInterval(interval)
  }, [enabled, trackMemory])

  // Track frame rate
  useEffect(() => {
    if (!enabled || !trackFrameRate) return

    const updateFrameRate = () => {
      const now = performance.now()
      frameCountRef.current += 1
      
      if (now - lastFrameTimeRef.current >= 1000) {
        const frameRate = Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current))
        frameCountRef.current = 0
        lastFrameTimeRef.current = now

        setMetrics(prev => ({
          ...prev,
          frameRate
        }))
      }

      requestAnimationFrame(updateFrameRate)
    }

    requestAnimationFrame(updateFrameRate)
  }, [enabled, trackFrameRate])

  // Periodic reporting
  useEffect(() => {
    if (!enabled || !logToConsole) return

    const interval = setInterval(() => {
      const currentMetrics = {
        renderCount: renderCountRef.current,
        averageRenderTime: renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length || 0,
        lastRenderTime: lastRenderTimeRef.current,
        memoryUsage: memoryRef.current[memoryRef.current.length - 1] || 0,
        frameRate: metrics.frameRate
      }

    }, reportInterval)

    return () => clearInterval(interval)
  }, [enabled, logToConsole, reportInterval, metrics.frameRate])

  // Performance warnings
  useEffect(() => {
    if (!enabled) return

    if (metrics.averageRenderTime > 16) {
      console.warn(`[${componentName}] Slow renders detected: ${metrics.averageRenderTime.toFixed(2)}ms average`)
    }

    if (metrics.frameRate < 30 && metrics.frameRate > 0) {
      console.warn(`[${componentName}] Low frame rate detected: ${metrics.frameRate}fps`)
    }

    if (metrics.memoryUsage > 100) {
      console.warn(`[${componentName}] High memory usage: ${metrics.memoryUsage.toFixed(2)}MB`)
    }
  }, [enabled, componentName, metrics])

  return {
    metrics,
    resetMetrics: () => {
      renderCountRef.current = 0
      renderTimesRef.current = []
      lastRenderTimeRef.current = 0
      frameCountRef.current = 0
      lastFrameTimeRef.current = performance.now()
      memoryRef.current = []
      setMetrics({
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        memoryUsage: 0,
        frameRate: 0
      })
    }
  }
}

// Hook for measuring specific operations
export const useOperationTimer = (operationName: string) => {
  const startTimeRef = useRef<number>(0)
  const operationCountRef = useRef(0)
  const totalTimeRef = useRef(0)

  const startTimer = () => {
    startTimeRef.current = performance.now()
  }

  const endTimer = () => {
    if (startTimeRef.current === 0) return 0
    
    const duration = performance.now() - startTimeRef.current
    operationCountRef.current += 1
    totalTimeRef.current += duration
    startTimeRef.current = 0
    
    return duration
  }

  const getStats = () => {
    return {
      count: operationCountRef.current,
      totalTime: totalTimeRef.current,
      averageTime: operationCountRef.current > 0 ? totalTimeRef.current / operationCountRef.current : 0
    }
  }

  const resetStats = () => {
    operationCountRef.current = 0
    totalTimeRef.current = 0
    startTimeRef.current = 0
  }

  return {
    startTimer,
    endTimer,
    getStats,
    resetStats
  }
}

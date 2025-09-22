import { useRef, useCallback } from 'react'

interface PerformanceMetrics {
  saveCount: number
  totalSaveTime: number
  averageSaveTime: number
  lastSaveTime: number
  batchSizes: number[]
  averageBatchSize: number
  errorCount: number
  successRate: number
}

interface SaveEvent {
  timestamp: number
  duration: number
  batchSize: number
  success: boolean
  error?: string
}

export const useAutosavePerformance = () => {
  const metricsRef = useRef<PerformanceMetrics>({
    saveCount: 0,
    totalSaveTime: 0,
    averageSaveTime: 0,
    lastSaveTime: 0,
    batchSizes: [],
    averageBatchSize: 0,
    errorCount: 0,
    successRate: 100
  })

  const eventsRef = useRef<SaveEvent[]>([])
  const maxEvents = 100 

  const recordSaveEvent = useCallback((event: Omit<SaveEvent, 'timestamp'>) => {
    const timestamp = Date.now()
    const eventWithTimestamp = { ...event, timestamp }
    
  
    eventsRef.current.push(eventWithTimestamp)
    
  
    if (eventsRef.current.length > maxEvents) {
      eventsRef.current = eventsRef.current.slice(-maxEvents)
    }

   
    const metrics = metricsRef.current
    metrics.saveCount++
    metrics.totalSaveTime += event.duration
    metrics.averageSaveTime = metrics.totalSaveTime / metrics.saveCount
    metrics.lastSaveTime = event.duration
    
    if (event.batchSize > 0) {
      metrics.batchSizes.push(event.batchSize)
      metrics.averageBatchSize = metrics.batchSizes.reduce((a, b) => a + b, 0) / metrics.batchSizes.length
    }
    
    if (!event.success) {
      metrics.errorCount++
    }
    
    metrics.successRate = ((metrics.saveCount - metrics.errorCount) / metrics.saveCount) * 100
  }, [])

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current }
  }, [])

  const getRecentEvents = useCallback((count: number = 10) => {
    return eventsRef.current.slice(-count)
  }, [])

  const getPerformanceSummary = useCallback(() => {
    const metrics = metricsRef.current
    const recentEvents = getRecentEvents(10)
    
    return {
      ...metrics,
      recentEvents,
      performanceGrade: getPerformanceGrade(metrics),
      recommendations: getRecommendations(metrics, recentEvents)
    }
  }, [getRecentEvents])

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      saveCount: 0,
      totalSaveTime: 0,
      averageSaveTime: 0,
      lastSaveTime: 0,
      batchSizes: [],
      averageBatchSize: 0,
      errorCount: 0,
      successRate: 100
    }
    eventsRef.current = []
  }, [])

  return {
    recordSaveEvent,
    getMetrics,
    getRecentEvents,
    getPerformanceSummary,
    resetMetrics
  }
}

function getPerformanceGrade(metrics: PerformanceMetrics): 'A' | 'B' | 'C' | 'D' | 'F' {
  const { averageSaveTime, successRate, averageBatchSize } = metrics
  
 
  let score = 0
  
 
  if (successRate >= 95) score += 40
  else if (successRate >= 90) score += 30
  else if (successRate >= 80) score += 20
  else if (successRate >= 70) score += 10
  
  
  if (averageSaveTime <= 500) score += 30
  else if (averageSaveTime <= 1000) score += 25
  else if (averageSaveTime <= 2000) score += 20
  else if (averageSaveTime <= 3000) score += 15
  else if (averageSaveTime <= 5000) score += 10
  

  if (averageBatchSize >= 5) score += 30
  else if (averageBatchSize >= 3) score += 25
  else if (averageBatchSize >= 2) score += 20
  else if (averageBatchSize >= 1) score += 15
  
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function getRecommendations(metrics: PerformanceMetrics, recentEvents: SaveEvent[]): string[] {
  const recommendations: string[] = []
  
  if (metrics.successRate < 90) {
    recommendations.push('Consider reducing debounce time to improve reliability')
  }
  
  if (metrics.averageSaveTime > 2000) {
    recommendations.push('Save operations are slow - check network connection')
  }
  
  if (metrics.averageBatchSize < 2) {
    recommendations.push('Consider enabling change batching for better performance')
  }
  
  if (recentEvents.length > 0) {
    const recentErrors = recentEvents.filter(e => !e.success).length
    if (recentErrors > recentEvents.length * 0.2) {
      recommendations.push('High error rate detected - check server connectivity')
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Autosave performance is optimal!')
  }
  
  return recommendations
}

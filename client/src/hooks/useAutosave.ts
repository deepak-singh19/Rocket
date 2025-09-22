import { useCallback, useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { refreshDesign } from '../store/designsSlice'
import { useToast } from './useToast'
import { useAutosavePerformance } from './useAutosavePerformance'
import { useThumbnailGenerator } from './useThumbnailGenerator'

interface AutosaveOptions {
  enabled: boolean
  debounceMs: number
  onSave: (data: any) => Promise<void>
  batchChanges?: boolean
  maxBatchSize?: number
  showProgress?: boolean
  generateThumbnail?: boolean
  thumbnailOptions?: {
    width?: number
    height?: number
    pixelRatio?: number
    quality?: number
  }
  collaboration?: {
    isConnected: boolean
    broadcastRefreshSignal: () => void
  }
}

interface PendingChange {
  id: string
  type: 'element_added' | 'element_updated' | 'element_deleted' | 'element_moved' | 'canvas_resized'
  timestamp: number
  data?: any
}

export const useAutosave = ({ 
  enabled, 
  debounceMs, 
  onSave, 
  batchChanges = true, 
  maxBatchSize = 10, 
  showProgress = true,
  generateThumbnail = false,
  thumbnailOptions = {
    width: 300,
    height: 200,
    pixelRatio: 0.5,
    quality: 0.8
  },
  collaboration
}: AutosaveOptions) => {
  const dispatch = useDispatch<AppDispatch>()
  const { elements, canvasSize } = useSelector((state: RootState) => state.canvas)
  const { selectedDesign } = useSelector((state: RootState) => state.designs)
  const { showSuccess, showError } = useToast()
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef(false)
  const changeCounterRef = useRef(0)
  
 
  const { recordSaveEvent, getPerformanceSummary } = useAutosavePerformance()
  

  const { generateSmartThumbnail, uploadThumbnail } = useThumbnailGenerator()
  
 
  const [isSaving, setIsSaving] = useState(false)
  const [savingProgress, setSavingProgress] = useState(0)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveCount, setSaveCount] = useState(0)

 
  const createStateHash = useCallback(() => {
    return JSON.stringify({
      elements: elements.map(el => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        radius: el.radius,
        rotation: el.rotation,
        text: el.text,
        fontSize: el.fontSize,
        fontFamily: el.fontFamily,
        fontWeight: el.fontWeight,
        fill: el.fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth,
        opacity: el.opacity,
        visible: el.visible,
        src: el.src,
        borderRadius: el.borderRadius,
        data: el.data,
       
        pathData: el.pathData,
        tool: el.tool,
        zIndex: el.zIndex
      })),
      canvasSize
    })
  }, [elements, canvasSize])

 
  const trackChange = useCallback((change: Omit<PendingChange, 'timestamp'>) => {
    if (!batchChanges) return

    setPendingChanges(prev => {
      const newChanges = [...prev, { ...change, timestamp: Date.now() }]
    
      return newChanges
        .filter(c => Date.now() - c.timestamp < 30000)
        .slice(-maxBatchSize)
    })
  }, [batchChanges, maxBatchSize])

  const performSave = useCallback(async () => {
    if (!selectedDesign || isSavingRef.current) return

    const currentHash = createStateHash()
    if (currentHash === lastSavedRef.current) return

    // Track the change before saving
    changeCounterRef.current += 1
    trackChange({
      id: `change_${changeCounterRef.current}`,
      type: 'element_updated',
      data: { elementCount: elements.length, canvasSize }
    })

    isSavingRef.current = true
    setIsSaving(true)
    setSavingProgress(0)
    setSaveError(null)

    const startTime = Date.now()
    const batchSize = pendingChanges.length

    try {
      
      const progressInterval = showProgress ? setInterval(() => {
        setSavingProgress(prev => Math.min(prev + 15, 85))
      }, 100) : null

      const saveData = {
        elements: {
          canvas: {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: '#ffffff'
          },
          objects: elements
        },
        // Include batch information if batching is enabled
        ...(batchChanges && pendingChanges.length > 0 && {
          batchInfo: {
            changeCount: pendingChanges.length,
            lastChangeTime: Math.max(...pendingChanges.map(c => c.timestamp)),
            changeTypes: [...new Set(pendingChanges.map(c => c.type))]
          }
        })
      }

      await onSave(saveData)
      
     
      const newHash = createStateHash()
      lastSavedRef.current = newHash

      
      if (collaboration?.isConnected && collaboration.broadcastRefreshSignal) {

        collaboration.broadcastRefreshSignal()
      }
      
    
      if (selectedDesign?._id) {

        dispatch(refreshDesign(selectedDesign._id)).catch((error) => {
          console.warn('Failed to refresh design in store:', error)
          
        })
      }
      
      
      if (generateThumbnail && selectedDesign?._id) {
        try {
          const thumbnail = await generateSmartThumbnail(thumbnailOptions)
          if (thumbnail) {
            await uploadThumbnail(selectedDesign._id, thumbnail)
          }
        } catch (thumbnailError) {
          console.warn('Thumbnail generation failed:', thumbnailError)
          // Don't fail the entire save operation if thumbnail fails
        }
      }
      
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      
      setSavingProgress(100)
      lastSavedRef.current = currentHash
      setLastSaved(new Date())
      setSaveCount(prev => prev + 1)
      
      
      setPendingChanges([])
      
      showSuccess('Design saved automatically', { 
        timestamp: new Date(),
        duration: 1500 
      })

      
      const duration = Date.now() - startTime
      recordSaveEvent({
        duration,
        batchSize,
        success: true
      })

     
      setTimeout(() => {
        setSavingProgress(0)
        setIsSaving(false)
      }, 300)

    } catch (error) {
      console.error('Autosave failed:', error)
      setSaveError(error instanceof Error ? error.message : 'Save failed')
      
      showError('Failed to save design automatically', { 
        timestamp: new Date(),
        duration: 3000
      })
      
     
      const duration = Date.now() - startTime
      recordSaveEvent({
        duration,
        batchSize,
        success: false,
        error: error instanceof Error ? error.message : 'Save failed'
      })

     
      lastSavedRef.current = ''
      setIsSaving(false)
      setSavingProgress(0)
    } finally {
      isSavingRef.current = false
    }
  }, [selectedDesign, elements, canvasSize, createStateHash, onSave, showSuccess, showError, batchChanges, pendingChanges, showProgress, trackChange])

  const debouncedSave = useCallback(() => {

    if (!enabled || !selectedDesign) {

      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {

      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {

      performSave()
    }, debounceMs)
  }, [enabled, selectedDesign, debounceMs, performSave])

  // Enhanced change detection with batching
  useEffect(() => {

    if (!enabled || !selectedDesign) {

      return
    }

    const currentHash = createStateHash()

    // Initialize lastSavedRef if it's empty (first load)
    if (!lastSavedRef.current) {
      lastSavedRef.current = currentHash

      return
    }
    
    if (currentHash === lastSavedRef.current) {

      return
    }

    // Schedule autosave
    debouncedSave()
  }, [elements, canvasSize, enabled, selectedDesign, debouncedSave, createStateHash])


  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

 
  useEffect(() => {
    lastSavedRef.current = ''
  }, [selectedDesign?._id])

 
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    await performSave()
  }, [performSave])

  
  const getSaveStats = useCallback(() => {
    return {
      pendingChanges: pendingChanges.length,
      lastSaved,
      isSaving,
      saveError,
      savingProgress,
      saveCount,
      batchEnabled: batchChanges,
      maxBatchSize
    }
  }, [pendingChanges.length, lastSaved, isSaving, saveError, savingProgress, saveCount, batchChanges, maxBatchSize])

  return {
    performSave,
    forceSave,
    isSaving,
    savingProgress,
    lastSaved,
    saveError,
    pendingChanges: pendingChanges.length,
    saveCount,
    getSaveStats,
    trackChange,
    getPerformanceSummary
  }
}

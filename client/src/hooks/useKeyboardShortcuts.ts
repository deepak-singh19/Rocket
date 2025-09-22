import { useEffect, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '../store'
import { 
  undo, 
  redo, 
  selectCanUndo, 
  selectCanRedo,
  removeElement,
  addElement,
  updateElement,
  selectSelectedElementId,
  selectElements,
  bringToFront,
  sendToBack,
  bringForward,
  sendBackward
} from '../store/canvasSlice'
import { CollaborationHookReturn } from './useCollaboration'

interface UseKeyboardShortcutsProps {
  collaboration?: CollaborationHookReturn
}

export const useKeyboardShortcuts = ({ collaboration }: UseKeyboardShortcutsProps = {}) => {
  const dispatch = useDispatch<AppDispatch>()
  const canUndo = useSelector(selectCanUndo)
  const canRedo = useSelector(selectCanRedo)
  const selectedElementId = useSelector(selectSelectedElementId)
  const elements = useSelector(selectElements)
  
  // Store everything in refs to avoid stale closures
  const collaborationRef = useRef(collaboration)
  const selectedElementIdRef = useRef(selectedElementId)
  const elementsRef = useRef(elements)
  const clipboardRef = useRef<any>(null)
  
  // Always update refs on every render
  collaborationRef.current = collaboration
  selectedElementIdRef.current = selectedElementId
  elementsRef.current = elements

  // Helper function to safely notify collaborators
  const notifyCollaborators = useCallback(() => {
    const currentCollaboration = collaborationRef.current

    if (currentCollaboration?.isConnected && 
        typeof currentCollaboration.broadcastRefreshSignal === 'function') {

      currentCollaboration.broadcastRefreshSignal()

    } else {
      console.warn('⚠️ Cannot notify collaborators:', {
        hasCollaboration: !!currentCollaboration,
        isConnected: currentCollaboration?.isConnected,
        hasBroadcastFunction: typeof currentCollaboration?.broadcastRefreshSignal === 'function'
      })
    }
  }, []) // No dependencies needed since we use refs

  const copyElement = useCallback(() => {
    const currentSelectedId = selectedElementIdRef.current
    if (!currentSelectedId) return
    
    const currentElements = elementsRef.current
    const element = currentElements.find(el => el.id === currentSelectedId)
    if (!element) return
    
    const copiedElement = {
      ...element,
      id: `${element.type}_${Date.now()}`,
      x: element.x + 10,
      y: element.y + 10
    }
    
    clipboardRef.current = copiedElement

  }, [])

  const pasteElement = useCallback(() => {
    if (!clipboardRef.current) return
    
    const elementToPaste = {
      ...clipboardRef.current,
      id: `${clipboardRef.current.type}_${Date.now()}`,
      x: clipboardRef.current.x + 10,
      y: clipboardRef.current.y + 10
    }

    dispatch(addElement(elementToPaste))
    notifyCollaborators()
  }, [dispatch, notifyCollaborators])

  const deleteElement = useCallback(() => {
    const currentSelectedId = selectedElementIdRef.current
    if (!currentSelectedId) return

    dispatch(removeElement(currentSelectedId))
    notifyCollaborators()
  }, [dispatch, notifyCollaborators])

  const nudgeElement = useCallback((direction: 'up' | 'down' | 'left' | 'right', distance: number) => {
    const currentSelectedId = selectedElementIdRef.current
    if (!currentSelectedId) return
    
    const currentElements = elementsRef.current
    const element = currentElements.find(el => el.id === currentSelectedId)
    if (!element) return
    
    let newX = element.x
    let newY = element.y
    
    switch (direction) {
      case 'up':
        newY -= distance
        break
      case 'down':
        newY += distance
        break
      case 'left':
        newX -= distance
        break
      case 'right':
        newX += distance
        break
    }
    
    const updates = { x: newX, y: newY }

    dispatch(updateElement({ id: currentSelectedId, updates }))
    notifyCollaborators()
  }, [dispatch, notifyCollaborators])

  // Create a single, stable event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      
      if (isInputField) return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey

      // Undo: Ctrl/Cmd + Z
      if (ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        if (canUndo) {
          dispatch(undo())
          notifyCollaborators()
        }
        return
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (ctrlKey && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault()
        if (canRedo) {
          dispatch(redo())
          notifyCollaborators()
        }
        return
      }

      // Copy: Ctrl/Cmd + C
      if (ctrlKey && event.key === 'c') {
        event.preventDefault()
        copyElement()
        return
      }

      // Paste: Ctrl/Cmd + V
      if (ctrlKey && event.key === 'v') {

        event.preventDefault()
        pasteElement()
        return
      }

      // Delete: Delete key or Backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {

        event.preventDefault()
        deleteElement()
        return
      }

      // Arrow key nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        const distance = event.shiftKey ? 10 : 1
        
        switch (event.key) {
          case 'ArrowUp':
            nudgeElement('up', distance)
            break
          case 'ArrowDown':
            nudgeElement('down', distance)
            break
          case 'ArrowLeft':
            nudgeElement('left', distance)
            break
          case 'ArrowRight':
            nudgeElement('right', distance)
            break
        }
        return
      }

      // Layer order shortcuts
      if (selectedElementIdRef.current && ctrlKey) {
        switch (event.key) {
          case ']':
            event.preventDefault()
            dispatch(bringForward(selectedElementIdRef.current))
            notifyCollaborators()
            return
          case '[':
            event.preventDefault()
            dispatch(sendBackward(selectedElementIdRef.current))
            notifyCollaborators()
            return
          case '}':
            event.preventDefault()
            dispatch(bringToFront(selectedElementIdRef.current))
            notifyCollaborators()
            return
          case '{':
            event.preventDefault()
            dispatch(sendToBack(selectedElementIdRef.current))
            notifyCollaborators()
            return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, canUndo, canRedo, copyElement, pasteElement, deleteElement, nudgeElement, notifyCollaborators])

  return {
    canUndo,
    canRedo,
    selectedElementId,
    clipboardHasContent: !!clipboardRef.current,
    copyElement,
    pasteElement,
    deleteElement,
    nudgeElement
  }
}
import { describe, it, expect, beforeEach } from 'vitest'
import canvasReducer, { 
  addElement, 
  updateElement, 
  removeElement, 
  moveElementToFront, 
  moveElementToBack, 
  moveElementForward, 
  moveElementBackward,
  undo,
  redo,
  addTextElement,
  addImageElement,
  addRectElement,
  addCircleElement,
  renameElement,
  rotateElement,
  scaleElement,
  clearCanvas,
  loadElements,
  setCanvasSize,
  selectCanUndo,
  selectCanRedo
} from '../canvasSlice'
import { CanvasElement } from '../../types'

describe('canvasSlice', () => {
  const mockElement: CanvasElement = {
    id: 'test-element-1',
    type: 'rect',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    locked: false,
    version: 1,
    lastModified: '2024-01-01T00:00:00.000Z'
  }

  const mockTextElement: CanvasElement = {
    id: 'test-text-1',
    type: 'text',
    x: 50,
    y: 50,
    text: 'Hello World',
    fontSize: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fill: '#000000',
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    locked: false,
    version: 1,
    lastModified: '2024-01-01T00:00:00.000Z'
  }

  const initialState = {
    elements: [],
    selectedElementId: null,
    canvasSize: { width: 1080, height: 1080 },
    history: [],
    historyIndex: -1,
    maxHistorySize: 50
  }

  beforeEach(() => {
    // Reset state before each test
  })

  describe('addElement', () => {
    it('should add an element to the canvas', () => {
      const action = addElement(mockElement)
      const newState = canvasReducer(initialState, action)

      expect(newState.elements).toHaveLength(1)
      expect(newState.elements[0]).toEqual(mockElement)
      expect(newState.history).toHaveLength(1)
      expect(newState.historyIndex).toBe(0)
    })

    it('should add multiple elements', () => {
      const action1 = addElement(mockElement)
      const action2 = addElement(mockTextElement)
      
      let state = canvasReducer(initialState, action1)
      state = canvasReducer(state, action2)

      expect(state.elements).toHaveLength(2)
      expect(state.elements[0]).toEqual(mockElement)
      expect(state.elements[1]).toEqual(mockTextElement)
    })

    it('should assign version and lastModified to new elements', () => {
      const elementWithoutVersion = { ...mockElement }
      delete elementWithoutVersion.version
      delete elementWithoutVersion.lastModified

      const action = addElement(elementWithoutVersion)
      const newState = canvasReducer(initialState, action)

      expect(newState.elements[0].version).toBe(1)
      expect(newState.elements[0].lastModified).toBeDefined()
    })
  })

  describe('updateElement', () => {
    it('should update an existing element', () => {
      const stateWithElement = {
        ...initialState,
        elements: [mockElement]
      }

      const updates = { fill: '#00ff00', width: 300 }
      const action = updateElement({ id: mockElement.id, updates })
      const newState = canvasReducer(stateWithElement, action)

      expect(newState.elements[0].fill).toBe('#00ff00')
      expect(newState.elements[0].width).toBe(300)
      expect(newState.elements[0].version).toBe(2) // Incremented
      expect(newState.elements[0].lastModified).toBeDefined()
    })

    it('should not update non-existent element', () => {
      const updates = { fill: '#00ff00' }
      const action = updateElement({ id: 'non-existent', updates })
      const newState = canvasReducer(initialState, action)

      expect(newState.elements).toHaveLength(0)
    })

    it('should increment version on update', () => {
      const stateWithElement = {
        ...initialState,
        elements: [{ ...mockElement, version: 5 }]
      }

      const updates = { fill: '#00ff00' }
      const action = updateElement({ id: mockElement.id, updates })
      const newState = canvasReducer(stateWithElement, action)

      expect(newState.elements[0].version).toBe(6)
    })
  })

  describe('removeElement', () => {
    it('should remove an element by id', () => {
      const stateWithElements = {
        ...initialState,
        elements: [mockElement, mockTextElement]
      }

      const action = removeElement(mockElement.id)
      const newState = canvasReducer(stateWithElements, action)

      expect(newState.elements).toHaveLength(1)
      expect(newState.elements[0]).toEqual(mockTextElement)
    })

    it('should not remove non-existent element', () => {
      const stateWithElement = {
        ...initialState,
        elements: [mockElement]
      }

      const action = removeElement('non-existent')
      const newState = canvasReducer(stateWithElement, action)

      expect(newState.elements).toHaveLength(1)
    })
  })

  describe('element reordering', () => {
    const stateWithElements = {
      ...initialState,
      elements: [
        { ...mockElement, id: 'element-1' },
        { ...mockTextElement, id: 'element-2' },
        { ...mockElement, id: 'element-3' }
      ]
    }

    describe('moveElementToFront', () => {
      it('should move element to the front (last in array)', () => {
        const action = moveElementToFront('element-1')
        const newState = canvasReducer(stateWithElements, action)

        expect(newState.elements[2].id).toBe('element-1')
        expect(newState.elements[0].id).toBe('element-2')
        expect(newState.elements[1].id).toBe('element-3')
      })
    })

    describe('moveElementToBack', () => {
      it('should move element to the back (first in array)', () => {
        const action = moveElementToBack('element-3')
        const newState = canvasReducer(stateWithElements, action)

        expect(newState.elements[0].id).toBe('element-3')
        expect(newState.elements[1].id).toBe('element-1')
        expect(newState.elements[2].id).toBe('element-2')
      })
    })

    describe('moveElementForward', () => {
      it('should move element one position forward', () => {
        const action = moveElementForward('element-1')
        const newState = canvasReducer(stateWithElements, action)

        expect(newState.elements[0].id).toBe('element-2')
        expect(newState.elements[1].id).toBe('element-1')
        expect(newState.elements[2].id).toBe('element-3')
      })

      it('should not move element if already at front', () => {
        const action = moveElementForward('element-3')
        const newState = canvasReducer(stateWithElements, action)

        expect(newState.elements).toEqual(stateWithElements.elements)
      })
    })

    describe('moveElementBackward', () => {
      it('should move element one position backward', () => {
        const action = moveElementBackward('element-3')
        const newState = canvasReducer(stateWithElements, action)

        expect(newState.elements[0].id).toBe('element-1')
        expect(newState.elements[1].id).toBe('element-3')
        expect(newState.elements[2].id).toBe('element-2')
      })

      it('should not move element if already at back', () => {
        const action = moveElementBackward('element-1')
        const newState = canvasReducer(stateWithElements, action)

        expect(newState.elements).toEqual(stateWithElements.elements)
      })
    })
  })

  describe('undo/redo functionality', () => {
    it('should save state to history on element operations', () => {
      const action1 = addElement(mockElement)
      const action2 = addElement(mockTextElement)
      
      let state = canvasReducer(initialState, action1)
      state = canvasReducer(state, action2)

      expect(state.history).toHaveLength(2)
      expect(state.historyIndex).toBe(1)
    })

    it('should undo the last operation', () => {
      const stateWithHistory = {
        ...initialState,
        elements: [mockElement, mockTextElement],
        history: [
          [],
          [mockElement]
        ],
        historyIndex: 1
      }

      const action = undo()
      const newState = canvasReducer(stateWithHistory, action)

      expect(newState.elements).toHaveLength(1)
      expect(newState.elements[0]).toEqual(mockElement)
      expect(newState.historyIndex).toBe(0)
    })

    it('should redo the next operation', () => {
      const stateWithHistory = {
        ...initialState,
        elements: [mockElement],
        history: [
          [],
          [mockElement],
          [mockElement, mockTextElement]
        ],
        historyIndex: 0
      }

      const action = redo()
      const newState = canvasReducer(stateWithHistory, action)

      expect(newState.elements).toHaveLength(2)
      expect(newState.elements[0]).toEqual(mockElement)
      expect(newState.elements[1]).toEqual(mockTextElement)
      expect(newState.historyIndex).toBe(1)
    })

    it('should not undo when at beginning of history', () => {
      const stateWithHistory = {
        ...initialState,
        elements: [mockElement],
        history: [[mockElement]],
        historyIndex: 0
      }

      const action = undo()
      const newState = canvasReducer(stateWithHistory, action)

      expect(newState.elements).toEqual(stateWithHistory.elements)
      expect(newState.historyIndex).toBe(0)
    })

    it('should not redo when at end of history', () => {
      const stateWithHistory = {
        ...initialState,
        elements: [mockElement],
        history: [[mockElement]],
        historyIndex: 0
      }

      const action = redo()
      const newState = canvasReducer(stateWithHistory, action)

      expect(newState.elements).toEqual(stateWithHistory.elements)
      expect(newState.historyIndex).toBe(0)
    })

    it('should limit history size to maxHistorySize', () => {
      const stateWithLargeHistory = {
        ...initialState,
        elements: [mockElement],
        history: Array(60).fill(null).map((_, i) => [{ ...mockElement, id: `element-${i}` }]),
        historyIndex: 59,
        maxHistorySize: 50
      }

      const action = addElement({ ...mockElement, id: 'new-element' })
      const newState = canvasReducer(stateWithLargeHistory, action)

      expect(newState.history).toHaveLength(50)
      expect(newState.historyIndex).toBe(49)
    })
  })

  describe('element creation actions', () => {
    describe('addTextElement', () => {
      it('should create a text element with default properties', () => {
        const action = addTextElement({ x: 100, y: 100, text: 'Test Text' })
        const newState = canvasReducer(initialState, action)

        expect(newState.elements).toHaveLength(1)
        expect(newState.elements[0].type).toBe('text')
        expect(newState.elements[0].text).toBe('Test Text')
        expect(newState.elements[0].x).toBe(100)
        expect(newState.elements[0].y).toBe(100)
        expect(newState.elements[0].version).toBe(1)
        expect(newState.elements[0].lastModified).toBeDefined()
      })
    })

    describe('addImageElement', () => {
      it('should create an image element with default properties', () => {
        const action = addImageElement({ x: 200, y: 200, src: 'https://example.com/image.jpg' })
        const newState = canvasReducer(initialState, action)

        expect(newState.elements).toHaveLength(1)
        expect(newState.elements[0].type).toBe('image')
        expect(newState.elements[0].src).toBe('https://example.com/image.jpg')
        expect(newState.elements[0].x).toBe(200)
        expect(newState.elements[0].y).toBe(200)
        expect(newState.elements[0].version).toBe(1)
      })
    })

    describe('addRectElement', () => {
      it('should create a rectangle element with default properties', () => {
        const action = addRectElement({ x: 300, y: 300 })
        const newState = canvasReducer(initialState, action)

        expect(newState.elements).toHaveLength(1)
        expect(newState.elements[0].type).toBe('rect')
        expect(newState.elements[0].x).toBe(300)
        expect(newState.elements[0].y).toBe(300)
        expect(newState.elements[0].width).toBe(100)
        expect(newState.elements[0].height).toBe(100)
        expect(newState.elements[0].version).toBe(1)
      })
    })

    describe('addCircleElement', () => {
      it('should create a circle element with default properties', () => {
        const action = addCircleElement({ x: 400, y: 400 })
        const newState = canvasReducer(initialState, action)

        expect(newState.elements).toHaveLength(1)
        expect(newState.elements[0].type).toBe('circle')
        expect(newState.elements[0].x).toBe(400)
        expect(newState.elements[0].y).toBe(400)
        expect(newState.elements[0].radius).toBe(50)
        expect(newState.elements[0].version).toBe(1)
      })
    })
  })

  describe('element transformations', () => {
    const stateWithElement = {
      ...initialState,
      elements: [{ ...mockElement }]
    }

    describe('renameElement', () => {
      it('should rename an element', () => {
        const action = renameElement({ id: mockElement.id, name: 'New Name' })
        const newState = canvasReducer(stateWithElement, action)

        expect(newState.elements[0].name).toBe('New Name')
        expect(newState.elements[0].version).toBe(2)
      })
    })

    describe('rotateElement', () => {
      it('should rotate an element', () => {
        const action = rotateElement({ id: mockElement.id, rotation: 45 })
        const newState = canvasReducer(stateWithElement, action)

        expect(newState.elements[0].rotation).toBe(45)
        expect(newState.elements[0].version).toBe(2)
      })
    })

    describe('scaleElement', () => {
      it('should scale an element', () => {
        const action = scaleElement({ id: mockElement.id, scaleX: 2, scaleY: 1.5 })
        const newState = canvasReducer(stateWithElement, action)

        expect(newState.elements[0].scaleX).toBe(2)
        expect(newState.elements[0].scaleY).toBe(1.5)
        expect(newState.elements[0].version).toBe(2)
      })
    })
  })

  describe('canvas management', () => {
    describe('clearCanvas', () => {
      it('should clear all elements from canvas', () => {
        const stateWithElements = {
          ...initialState,
          elements: [mockElement, mockTextElement]
        }

        const action = clearCanvas()
        const newState = canvasReducer(stateWithElements, action)

        expect(newState.elements).toHaveLength(0)
        expect(newState.history).toHaveLength(1)
      })
    })

    describe('loadElements', () => {
      it('should load elements and clear history', () => {
        const elementsToLoad = [mockElement, mockTextElement]
        const action = loadElements(elementsToLoad)
        const newState = canvasReducer(initialState, action)

        expect(newState.elements).toEqual(elementsToLoad)
        expect(newState.history).toHaveLength(0)
        expect(newState.historyIndex).toBe(-1)
      })
    })

    describe('setCanvasSize', () => {
      it('should update canvas size', () => {
        const action = setCanvasSize({ width: 1920, height: 1080 })
        const newState = canvasReducer(initialState, action)

        expect(newState.canvasSize.width).toBe(1920)
        expect(newState.canvasSize.height).toBe(1080)
      })
    })
  })

  describe('selectors', () => {
    describe('selectCanUndo', () => {
      it('should return true when undo is possible', () => {
        const state = {
          ...initialState,
          historyIndex: 1
        }
        expect(selectCanUndo(state)).toBe(true)
      })

      it('should return false when undo is not possible', () => {
        const state = {
          ...initialState,
          historyIndex: 0
        }
        expect(selectCanUndo(state)).toBe(false)
      })
    })

    describe('selectCanRedo', () => {
      it('should return true when redo is possible', () => {
        const state = {
          ...initialState,
          history: [[], [mockElement]],
          historyIndex: 0
        }
        expect(selectCanRedo(state)).toBe(true)
      })

      it('should return false when redo is not possible', () => {
        const state = {
          ...initialState,
          history: [[mockElement]],
          historyIndex: 0
        }
        expect(selectCanRedo(state)).toBe(false)
      })
    })
  })
})

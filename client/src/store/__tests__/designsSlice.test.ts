import { describe, it, expect, beforeEach } from 'vitest'
import designsReducer, {
  fetchDesigns,
  fetchDesignById,
  createDesign,
  updateDesign,
  deleteDesign,
  addComment,
  deleteComment,
  saveDesign,
  setSelectedDesign,
  clearSelectedDesign,
  clearError
} from '../designsSlice'
import { Design, Comment } from '../../types'

describe('designsSlice', () => {
  const mockDesign: Design = {
    _id: 'design-1',
    name: 'Test Design',
    width: 1080,
    height: 1080,
    createdBy: 'user-1',
    updatedAt: '2024-01-01T00:00:00.000Z',
    elements: {
      canvas: { width: 1080, height: 1080, backgroundColor: '#ffffff' },
      objects: []
    },
    layers: [],
    comments: [],
    thumbnail: undefined
  }

  const mockComment: Comment = {
    _id: 'comment-1',
    author: 'user-1',
    text: 'Great design!',
    mentions: [],
    elementId: undefined,
    createdAt: '2024-01-01T00:00:00.000Z'
  }

  const initialState = {
    designs: [],
    selectedDesign: null,
    loading: false,
    error: null
  }

  beforeEach(() => {
    // Reset state before each test
  })

  describe('fetchDesigns', () => {
    it('should handle pending state', () => {
      const action = { type: fetchDesigns.pending.type }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(true)
      expect(newState.error).toBe(null)
    })

    it('should handle fulfilled state', () => {
      const designs = [mockDesign]
      const action = { 
        type: fetchDesigns.fulfilled.type, 
        payload: designs 
      }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(false)
      expect(newState.designs).toEqual(designs)
      expect(newState.error).toBe(null)
    })

    it('should handle rejected state', () => {
      const error = 'Failed to fetch designs'
      const action = { 
        type: fetchDesigns.rejected.type, 
        error: { message: error } 
      }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(false)
      expect(newState.error).toBe(error)
    })
  })

  describe('fetchDesignById', () => {
    it('should handle pending state', () => {
      const action = { type: fetchDesignById.pending.type }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(true)
      expect(newState.error).toBe(null)
    })

    it('should handle fulfilled state', () => {
      const action = { 
        type: fetchDesignById.fulfilled.type, 
        payload: mockDesign 
      }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(false)
      expect(newState.selectedDesign).toEqual(mockDesign)
      expect(newState.error).toBe(null)
    })

    it('should handle rejected state', () => {
      const error = 'Design not found'
      const action = { 
        type: fetchDesignById.rejected.type, 
        error: { message: error } 
      }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(false)
      expect(newState.error).toBe(error)
    })
  })

  describe('createDesign', () => {
    it('should handle pending state', () => {
      const action = { type: createDesign.pending.type }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(true)
      expect(newState.error).toBe(null)
    })

    it('should handle fulfilled state', () => {
      const action = { 
        type: createDesign.fulfilled.type, 
        payload: mockDesign 
      }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(false)
      expect(newState.designs).toContain(mockDesign)
      expect(newState.selectedDesign).toEqual(mockDesign)
      expect(newState.error).toBe(null)
    })

    it('should handle rejected state', () => {
      const error = 'Failed to create design'
      const action = { 
        type: createDesign.rejected.type, 
        error: { message: error } 
      }
      const newState = designsReducer(initialState, action)

      expect(newState.loading).toBe(false)
      expect(newState.error).toBe(error)
    })
  })

  describe('updateDesign', () => {
    const stateWithDesign = {
      ...initialState,
      designs: [mockDesign],
      selectedDesign: mockDesign
    }

    it('should handle pending state', () => {
      const action = { type: updateDesign.pending.type }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(true)
      expect(newState.error).toBe(null)
    })

    it('should handle fulfilled state', () => {
      const updatedDesign = { ...mockDesign, name: 'Updated Design' }
      const action = { 
        type: updateDesign.fulfilled.type, 
        payload: updatedDesign 
      }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(false)
      expect(newState.designs[0].name).toBe('Updated Design')
      expect(newState.selectedDesign?.name).toBe('Updated Design')
      expect(newState.error).toBe(null)
    })

    it('should handle rejected state', () => {
      const error = 'Failed to update design'
      const action = { 
        type: updateDesign.rejected.type, 
        error: { message: error } 
      }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(false)
      expect(newState.error).toBe(error)
    })
  })

  describe('deleteDesign', () => {
    const stateWithDesign = {
      ...initialState,
      designs: [mockDesign],
      selectedDesign: mockDesign
    }

    it('should handle pending state', () => {
      const action = { type: deleteDesign.pending.type }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(true)
      expect(newState.error).toBe(null)
    })

    it('should handle fulfilled state', () => {
      const action = { 
        type: deleteDesign.fulfilled.type, 
        payload: mockDesign._id 
      }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(false)
      expect(newState.designs).toHaveLength(0)
      expect(newState.selectedDesign).toBe(null)
      expect(newState.error).toBe(null)
    })

    it('should handle rejected state', () => {
      const error = 'Failed to delete design'
      const action = { 
        type: deleteDesign.rejected.type, 
        error: { message: error } 
      }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(false)
      expect(newState.error).toBe(error)
    })
  })

  describe('addComment', () => {
    const stateWithDesign = {
      ...initialState,
      selectedDesign: mockDesign
    }

    it('should handle pending state', () => {
      const action = { type: addComment.pending.type }
      const newState = designsReducer(stateWithDesign, action)

      // Should not set loading to true for comments
      expect(newState.loading).toBe(false)
    })

    it('should handle fulfilled state', () => {
      const action = { 
        type: addComment.fulfilled.type, 
        payload: mockComment 
      }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.selectedDesign?.comments).toContain(mockComment)
    })

    it('should handle rejected state', () => {
      const error = 'Failed to add comment'
      const action = { 
        type: addComment.rejected.type, 
        error: { message: error } 
      }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.error).toBe(error)
    })
  })

  describe('deleteComment', () => {
    const stateWithDesignAndComment = {
      ...initialState,
      selectedDesign: {
        ...mockDesign,
        comments: [mockComment]
      }
    }

    it('should handle pending state', () => {
      const action = { type: deleteComment.pending.type }
      const newState = designsReducer(stateWithDesignAndComment, action)

      // Should not set loading to true for comments
      expect(newState.loading).toBe(false)
    })

    it('should handle fulfilled state', () => {
      const action = { 
        type: deleteComment.fulfilled.type, 
        payload: mockComment._id 
      }
      const newState = designsReducer(stateWithDesignAndComment, action)

      expect(newState.selectedDesign?.comments).toHaveLength(0)
    })

    it('should handle rejected state', () => {
      const error = 'Failed to delete comment'
      const action = { 
        type: deleteComment.rejected.type, 
        error: { message: error } 
      }
      const newState = designsReducer(stateWithDesignAndComment, action)

      expect(newState.error).toBe(error)
    })
  })

  describe('saveDesign', () => {
    const stateWithDesign = {
      ...initialState,
      selectedDesign: mockDesign
    }

    it('should handle pending state', () => {
      const action = { type: saveDesign.pending.type }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(true)
      expect(newState.error).toBe(null)
    })

    it('should handle fulfilled state', () => {
      const saveResponse = {
        success: true,
        message: 'Design saved successfully',
        data: {
          id: mockDesign._id,
          updatedAt: '2024-01-01T01:00:00.000Z',
          elementsCount: 5
        }
      }
      const action = { 
        type: saveDesign.fulfilled.type, 
        payload: saveResponse 
      }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(false)
      expect(newState.selectedDesign?.updatedAt).toBe('2024-01-01T01:00:00.000Z')
      expect(newState.error).toBe(null)
    })

    it('should handle rejected state', () => {
      const error = 'Failed to save design'
      const action = { 
        type: saveDesign.rejected.type, 
        error: { message: error } 
      }
      const newState = designsReducer(stateWithDesign, action)

      expect(newState.loading).toBe(false)
      expect(newState.error).toBe(error)
    })
  })

  describe('synchronous actions', () => {
    describe('setSelectedDesign', () => {
      it('should set the selected design', () => {
        const action = setSelectedDesign(mockDesign)
        const newState = designsReducer(initialState, action)

        expect(newState.selectedDesign).toEqual(mockDesign)
      })
    })

    describe('clearSelectedDesign', () => {
      it('should clear the selected design', () => {
        const stateWithDesign = {
          ...initialState,
          selectedDesign: mockDesign
        }
        const action = clearSelectedDesign()
        const newState = designsReducer(stateWithDesign, action)

        expect(newState.selectedDesign).toBe(null)
      })
    })

    describe('clearError', () => {
      it('should clear the error', () => {
        const stateWithError = {
          ...initialState,
          error: 'Some error'
        }
        const action = clearError()
        const newState = designsReducer(stateWithError, action)

        expect(newState.error).toBe(null)
      })
    })
  })
})

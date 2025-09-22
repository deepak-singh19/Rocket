import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { Design, DesignState, CreateDesignRequest, UpdateDesignRequest, PaginatedResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : 'http://localhost:4000/api'

// Async thunks
export const fetchDesigns = createAsyncThunk(
  'designs/fetchDesigns',
  async (params: { page?: number; limit?: number; search?: string; createdBy?: string } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.search) queryParams.append('search', params.search)
      if (params.createdBy) queryParams.append('createdBy', params.createdBy)
      
      const response = await axios.get<PaginatedResponse<Design>>(`${API_BASE_URL}/designs?${queryParams}`, {
        timeout: 10000 // 10 second timeout
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching designs:', error)
      if (error.code === 'ECONNABORTED') {
        return rejectWithValue('Request timeout - server may be slow to respond')
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch designs')
    }
  }
)

export const fetchDesignById = createAsyncThunk(
  'designs/fetchDesignById',
  async (id: string, { rejectWithValue }) => {
    try {

      const response = await axios.get<{ success: boolean; data: Design }>(`${API_BASE_URL}/designs/${id}`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      
      return response.data.data
    } catch (error: any) {
      console.error('Error fetching design:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch design')
    }
  }
)

export const createDesign = createAsyncThunk(
  'designs/createDesign',
  async (designData: CreateDesignRequest, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ success: boolean; data: Design }>(`${API_BASE_URL}/designs`, designData)
      return response.data.data
    } catch (error: any) {
      console.error('Error creating design:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to create design')
    }
  }
)

export const refreshDesign = createAsyncThunk(
  'designs/refreshDesign',
  async (id: string, { rejectWithValue }) => {
    try {

      const response = await axios.get<{ success: boolean; data: Design }>(`${API_BASE_URL}/designs/${id}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      
      return response.data.data
    } catch (error: any) {
      console.error(' designsSlice: Error refreshing design:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh design')
    }
  }
)

export const updateDesign = createAsyncThunk(
  'designs/updateDesign',
  async ({ id, data }: { id: string; data: UpdateDesignRequest }, { rejectWithValue }) => {
    try {
      const response = await axios.put<{ success: boolean; data: Design }>(`${API_BASE_URL}/designs/${id}`, data)
      return response.data.data
    } catch (error: any) {
      console.error('Error updating design:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to update design')
    }
  }
)

export const saveDesign = createAsyncThunk(
  'designs/saveDesign',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {

      const response = await axios.put<{ success: boolean; message: string; data: any }>(`${API_BASE_URL}/designs/${id}/save`, data)

      return response.data
    } catch (error: any) {
      console.error(' designsSlice: Error saving design:', error)
      console.error(' designsSlice: Error response:', error.response?.data)
      console.error(' designsSlice: Error status:', error.response?.status)
      return rejectWithValue(error.response?.data?.message || 'Failed to save design')
    }
  }
)

export const deleteDesign = createAsyncThunk(
  'designs/deleteDesign',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/designs/${id}`)
      return id
    } catch (error: any) {
      console.error('Error deleting design:', error)
      return rejectWithValue(error.response?.data?.message || 'Failed to delete design')
    }
  }
)

export const addComment = createAsyncThunk(
  'designs/addComment',
  async ({ designId, comment }: { designId: string; comment: any }) => {
    const response = await axios.post(`${API_BASE_URL}/designs/${designId}/comments`, {
      author: 'Current User', // TODO: Get actual user name
      text: comment.text,
      mentions: comment.mentions,
      elementId: comment.elementId
    })
    return response.data.data.comment
  }
)

export const deleteComment = createAsyncThunk(
  'designs/deleteComment',
  async ({ designId, commentId }: { designId: string; commentId: string }) => {
    await axios.delete(`${API_BASE_URL}/designs/${designId}/comments/${commentId}`)
    return commentId
  }
)

// Initial state
const initialState: DesignState = {
  designs: [],
  selectedDesign: null,
  loading: false,
  error: null
}

// Slice
const designsSlice = createSlice({
  name: 'designs',
  initialState,
  reducers: {
    clearSelectedDesign: (state) => {
      state.selectedDesign = null
    },
    clearError: (state) => {
      state.error = null
    },
    setSelectedDesign: (state, action: PayloadAction<Design>) => {
      state.selectedDesign = action.payload
    },
    switchToDesign: (state, action: PayloadAction<string>) => {
      const designId = action.payload
      const design = state.designs.find(d => d._id === designId)
      if (design) {
        state.selectedDesign = design
      } else {

      }
    },
    refreshDesignInCache: (state, action: PayloadAction<Design>) => {
      const updatedDesign = action.payload
      const index = state.designs.findIndex(d => d._id === updatedDesign._id)
      if (index !== -1) {
        state.designs[index] = updatedDesign
        
        // Update selectedDesign if it's the same design
        if (state.selectedDesign?._id === updatedDesign._id) {
          state.selectedDesign = updatedDesign

        }
      } else {

      }
    }
  },
  extraReducers: (builder) => {
    // Fetch designs
    builder
      .addCase(fetchDesigns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDesigns.fulfilled, (state, action) => {
        state.loading = false
        state.designs = action.payload.data
      })
      .addCase(fetchDesigns.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch designs'
      })

    // Fetch design by ID
    builder
      .addCase(fetchDesignById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDesignById.fulfilled, (state, action) => {
        state.loading = false
        state.selectedDesign = action.payload


      })
      .addCase(fetchDesignById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch design'
      })

    // Create design
    builder
      .addCase(createDesign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createDesign.fulfilled, (state, action) => {
        state.loading = false
        state.designs.unshift(action.payload)
        state.selectedDesign = action.payload
      })
      .addCase(createDesign.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to create design'
      })

    // Refresh design
    builder
      .addCase(refreshDesign.pending, (state) => {
        // Don't set loading to true to avoid UI flicker

      })
      .addCase(refreshDesign.fulfilled, (state, action) => {

        const refreshedDesign = action.payload
        const index = state.designs.findIndex(design => design._id === refreshedDesign._id)
        if (index !== -1) {
          state.designs[index] = refreshedDesign

        }
        if (state.selectedDesign?._id === refreshedDesign._id) {
          state.selectedDesign = refreshedDesign

        }
      })
      .addCase(refreshDesign.rejected, (state, action) => {

        state.error = action.error.message || 'Failed to refresh design'
      })

    // Update design
    builder
      .addCase(updateDesign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateDesign.fulfilled, (state, action) => {
        state.loading = false
        const index = state.designs.findIndex(design => design._id === action.payload._id)
        if (index !== -1) {
          state.designs[index] = action.payload
        }
        if (state.selectedDesign?._id === action.payload._id) {
          state.selectedDesign = action.payload
        }
      })
      .addCase(updateDesign.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update design'
      })

    // Save design
    builder
      .addCase(saveDesign.pending, (state) => {

        // Don't set loading to true for autosave to avoid UI flicker
      })
      .addCase(saveDesign.fulfilled, (state, action) => {

        // Update the selected design's updatedAt timestamp
        if (state.selectedDesign?._id === action.payload.data.id) {
          state.selectedDesign.updatedAt = action.payload.data.updatedAt

        }
      })
      .addCase(saveDesign.rejected, (state, action) => {

        state.error = action.error.message || 'Failed to save design'
      })

    // Delete design
    builder
      .addCase(deleteDesign.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteDesign.fulfilled, (state, action) => {
        state.loading = false
        state.designs = state.designs.filter(design => design._id !== action.payload)
        if (state.selectedDesign?._id === action.payload) {
          state.selectedDesign = null
        }
      })
      .addCase(deleteDesign.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete design'
      })

    // Add comment
    builder
      .addCase(addComment.pending, (state) => {
        // Don't set loading to true for comments to avoid UI flicker
      })
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.selectedDesign) {
          state.selectedDesign.comments.push(action.payload)
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add comment'
      })

    // Delete comment
    builder
      .addCase(deleteComment.pending, (state) => {
        // Don't set loading to true for comments to avoid UI flicker
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        if (state.selectedDesign) {
          state.selectedDesign.comments = state.selectedDesign.comments.filter(
            comment => comment._id !== action.payload
          )
        }
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete comment'
      })
  }
})

export const { clearSelectedDesign, clearError, setSelectedDesign, switchToDesign, refreshDesignInCache } = designsSlice.actions
export default designsSlice.reducer

import axios, { AxiosResponse } from 'axios'
import { 
  Comment, 
  CreateCommentRequest, 
  UpdateCommentRequest, 
  CommentFilters, 
  User,
  PaginatedResponse,
  ApiResponse 
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const commentService = {
  // Get comments for a design
  async getComments(designId: string, filters: CommentFilters = {}): Promise<PaginatedResponse<Comment>> {
    const params = new URLSearchParams()
    
    if (filters.resolved !== undefined) {
      params.append('resolved', filters.resolved.toString())
    }
    if (filters.elementId) {
      params.append('elementId', filters.elementId)
    }
    if (filters.parentId) {
      params.append('parentId', filters.parentId)
    }
    if (filters.page) {
      params.append('page', filters.page.toString())
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString())
    }

    const response: AxiosResponse<{
      success: boolean
      comments: Comment[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }> = await api.get(`/comments/design/${designId}?${params.toString()}`)

    return {
      success: response.data.success,
      data: response.data.comments,
      pagination: response.data.pagination
    }
  },

  // Get replies for a comment
  async getCommentReplies(commentId: string, page = 1, limit = 20): Promise<PaginatedResponse<Comment>> {
    const response: AxiosResponse<{
      success: boolean
      replies: Comment[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }> = await api.get(`/comments/${commentId}/replies?page=${page}&limit=${limit}`)

    return {
      success: response.data.success,
      data: response.data.replies,
      pagination: response.data.pagination
    }
  },

  // Create a new comment
  async createComment(commentData: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    const response: AxiosResponse<{
      success: boolean
      comment: Comment
    }> = await api.post('/comments', commentData)

    return {
      success: response.data.success,
      data: response.data.comment
    }
  },

  // Update a comment
  async updateComment(commentId: string, commentData: UpdateCommentRequest): Promise<ApiResponse<Comment>> {
    const response: AxiosResponse<{
      success: boolean
      comment: Comment
    }> = await api.put(`/comments/${commentId}`, commentData)

    return {
      success: response.data.success,
      data: response.data.comment
    }
  },

  // Delete a comment
  async deleteComment(commentId: string): Promise<ApiResponse<null>> {
    const response: AxiosResponse<{
      success: boolean
      message: string
    }> = await api.delete(`/comments/${commentId}`)

    return {
      success: response.data.success,
      data: null,
      message: response.data.message
    }
  },

  // Resolve/unresolve a comment
  async resolveComment(commentId: string, isResolved: boolean): Promise<ApiResponse<Comment>> {
    const response: AxiosResponse<{
      success: boolean
      comment: Comment
    }> = await api.patch(`/comments/${commentId}/resolve`, { isResolved })

    return {
      success: response.data.success,
      data: response.data.comment
    }
  },

  // Get users for @mention autocomplete
  async getDesignUsers(designId: string, query = ''): Promise<ApiResponse<User[]>> {
    const params = query ? `?query=${encodeURIComponent(query)}` : ''
    const response: AxiosResponse<{
      success: boolean
      users: User[]
    }> = await api.get(`/comments/design/${designId}/users${params}`)

    return {
      success: response.data.success,
      data: response.data.users
    }
  }
}

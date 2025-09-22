import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export interface SaveDesignData {
  elements: {
    canvas: {
      width: number
      height: number
      backgroundColor: string
    }
    objects: any[]
  }
  layers?: any[]
  thumbnail?: string
}

export interface SaveDesignResponse {
  success: boolean
  message: string
  data: {
    id: string
    updatedAt: string
    elementsCount: number
  }
}

export interface ApiError {
  code: string
  message: string
  details: string | any[]
}

export const designService = {
  async saveDesign(designId: string, data: SaveDesignData): Promise<SaveDesignResponse> {
    try {
      const response = await axios.put(`${API_BASE_URL}/designs/${designId}/save`, data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      })

      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        // Server returned structured error
        throw new Error(JSON.stringify(error.response.data))
      } else if (error.request) {
        // Network error
        throw new Error('Network error: Unable to connect to server')
      } else {
        // Other error
        throw new Error(error.message || 'Unknown error occurred')
      }
    }
  },

  async updateDesign(designId: string, data: Partial<SaveDesignData>): Promise<SaveDesignResponse> {
    try {
      const response = await axios.put(`${API_BASE_URL}/designs/${designId}`, data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(JSON.stringify(error.response.data))
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server')
      } else {
        throw new Error(error.message || 'Unknown error occurred')
      }
    }
  },

  async getDesign(designId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/designs/${designId}`, {
        timeout: 10000
      })

      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(JSON.stringify(error.response.data))
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server')
      } else {
        throw new Error(error.message || 'Unknown error occurred')
      }
    }
  }
}

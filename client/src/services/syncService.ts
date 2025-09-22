import axios from 'axios'
import { SyncRequest, SyncResponse, ElementVersion, CanvasElement } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export interface SyncConflict {
  elementId: string
  localElement: CanvasElement
  serverElement: CanvasElement
  localVersion: number
  serverVersion: number
  resolution: 'server' | 'local' | 'merge'
}

export interface SyncResult {
  needsFullSync: boolean
  conflicts: SyncConflict[]
  reconciledElements: CanvasElement[]
  serverVersion: number
  lastSyncAt: string
}

export const syncService = {
  async syncDesign(designId: string, request: SyncRequest = {}): Promise<SyncResponse> {
    try {
      const params = new URLSearchParams()
      if (request.clientVersion) params.append('clientVersion', request.clientVersion.toString())
      if (request.lastSyncAt) params.append('lastSyncAt', request.lastSyncAt)

      const response = await axios.get(`${API_BASE_URL}/designs/${designId}/sync?${params}`, {
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

  reconcileElements(
    localElements: CanvasElement[],
    serverElements: CanvasElement[],
    serverElementVersions: ElementVersion[]
  ): SyncResult {
    const conflicts: SyncConflict[] = []
    const reconciledElements: CanvasElement[] = []
    const serverElementMap = new Map(serverElements.map(el => [el.id, el]))
    const serverVersionMap = new Map(serverElementVersions.map(ver => [ver.id, ver]))

    // Process each local element
    for (const localElement of localElements) {
      const serverElement = serverElementMap.get(localElement.id)
      const serverVersion = serverVersionMap.get(localElement.id)

      if (!serverElement) {
        // Local element doesn't exist on server - keep it
        reconciledElements.push({
          ...localElement,
          version: (localElement.version || 1),
          lastModified: new Date().toISOString()
        })
      } else if (!serverVersion) {
        // Server element exists but no version info - prefer server
        reconciledElements.push({
          ...serverElement,
          version: (serverElement.version || 1),
          lastModified: new Date().toISOString()
        })
      } else {
        // Both exist - check for conflicts
        const localVersion = localElement.version || 1
        const serverElementVersion = serverVersion.version

        if (localVersion < serverElementVersion) {
          // Server is newer - prefer server
          reconciledElements.push({
            ...serverElement,
            version: serverElementVersion,
            lastModified: serverVersion.lastModified
          })
        } else if (localVersion > serverElementVersion) {
          // Local is newer - prefer local
          reconciledElements.push({
            ...localElement,
            version: localVersion,
            lastModified: new Date().toISOString()
          })
        } else {
          // Same version - check timestamps
          const localModified = new Date(localElement.lastModified || 0)
          const serverModified = new Date(serverVersion.lastModified)

          if (localModified > serverModified) {
            // Local is newer by timestamp
            reconciledElements.push({
              ...localElement,
              version: localVersion,
              lastModified: localElement.lastModified || new Date().toISOString()
            })
          } else {
            // Server is newer or same - prefer server
            reconciledElements.push({
              ...serverElement,
              version: serverElementVersion,
              lastModified: serverVersion.lastModified
            })
          }
        }
      }
    }

    // Add server elements that don't exist locally
    for (const serverElement of serverElements) {
      const existsLocally = localElements.some(el => el.id === serverElement.id)
      if (!existsLocally) {
        reconciledElements.push({
          ...serverElement,
          version: (serverElement.version || 1),
          lastModified: new Date().toISOString()
        })
      }
    }

    return {
      needsFullSync: false, // Will be set by caller
      conflicts,
      reconciledElements,
      serverVersion: 0, // Will be set by caller
      lastSyncAt: new Date().toISOString() // Will be set by caller
    }
  },

  // Helper to detect if elements have conflicts
  detectConflicts(
    localElements: CanvasElement[],
    serverElements: CanvasElement[],
    serverElementVersions: ElementVersion[]
  ): SyncConflict[] {
    const conflicts: SyncConflict[] = []
    const serverElementMap = new Map(serverElements.map(el => [el.id, el]))
    const serverVersionMap = new Map(serverElementVersions.map(ver => [ver.id, ver]))

    for (const localElement of localElements) {
      const serverElement = serverElementMap.get(localElement.id)
      const serverVersion = serverVersionMap.get(localElement.id)

      if (serverElement && serverVersion) {
        const localVersion = localElement.version || 1
        const serverElementVersion = serverVersion.version

        // Check if there's a conflict (both modified since last sync)
        if (localVersion === serverElementVersion) {
          const localModified = new Date(localElement.lastModified || 0)
          const serverModified = new Date(serverVersion.lastModified)

          // If timestamps are very close (within 1 second), consider it a conflict
          const timeDiff = Math.abs(localModified.getTime() - serverModified.getTime())
          if (timeDiff < 1000) {
            conflicts.push({
              elementId: localElement.id,
              localElement,
              serverElement,
              localVersion,
              serverVersion: serverElementVersion,
              resolution: 'server' // Default to server wins
            })
          }
        }
      }
    }

    return conflicts
  }
}

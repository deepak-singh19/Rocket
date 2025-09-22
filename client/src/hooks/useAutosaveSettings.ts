import { useState, useEffect } from 'react'
import { AutosaveSettingsData } from '../components/AutosaveSettings'

const AUTOSAVE_SETTINGS_KEY = 'canvas-studio-autosave-settings'

const defaultSettings: AutosaveSettingsData = {
  enabled: true,
  debounceMs: 500,
  batchChanges: true,
  maxBatchSize: 10,
  showProgress: true
}

export const useAutosaveSettings = () => {
  const [settings, setSettings] = useState<AutosaveSettingsData>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(AUTOSAVE_SETTINGS_KEY)
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        // Validate and merge with defaults
        const validatedSettings: AutosaveSettingsData = {
          enabled: typeof parsedSettings.enabled === 'boolean' ? parsedSettings.enabled : defaultSettings.enabled,
          debounceMs: typeof parsedSettings.debounceMs === 'number' && parsedSettings.debounceMs >= 250 && parsedSettings.debounceMs <= 10000 
            ? parsedSettings.debounceMs 
            : defaultSettings.debounceMs,
          batchChanges: typeof parsedSettings.batchChanges === 'boolean' ? parsedSettings.batchChanges : defaultSettings.batchChanges,
          maxBatchSize: typeof parsedSettings.maxBatchSize === 'number' && parsedSettings.maxBatchSize >= 1 && parsedSettings.maxBatchSize <= 50 
            ? parsedSettings.maxBatchSize 
            : defaultSettings.maxBatchSize,
          showProgress: typeof parsedSettings.showProgress === 'boolean' ? parsedSettings.showProgress : defaultSettings.showProgress
        }
        setSettings(validatedSettings)
      }
    } catch (error) {
      console.error('Failed to load autosave settings:', error)
      // Use default settings if loading fails
      setSettings(defaultSettings)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings: AutosaveSettingsData) => {
    try {
      setSettings(newSettings)
      localStorage.setItem(AUTOSAVE_SETTINGS_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.error('Failed to save autosave settings:', error)
    }
  }

  // Reset to default settings
  const resetSettings = () => {
    try {
      setSettings(defaultSettings)
      localStorage.removeItem(AUTOSAVE_SETTINGS_KEY)
    } catch (error) {
      console.error('Failed to reset autosave settings:', error)
    }
  }

  // Get setting value with fallback
  const getSetting = <K extends keyof AutosaveSettingsData>(key: K): AutosaveSettingsData[K] => {
    return settings[key] ?? defaultSettings[key]
  }

  // Check if autosave is enabled
  const isAutosaveEnabled = () => {
    return getSetting('enabled')
  }

  // Get debounce time in milliseconds
  const getDebounceMs = () => {
    return getSetting('debounceMs')
  }

  // Check if batching is enabled
  const isBatchingEnabled = () => {
    return getSetting('batchChanges')
  }

  // Get max batch size
  const getMaxBatchSize = () => {
    return getSetting('maxBatchSize')
  }

  // Check if progress should be shown
  const shouldShowProgress = () => {
    return getSetting('showProgress')
  }

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
    getSetting,
    isAutosaveEnabled,
    getDebounceMs,
    isBatchingEnabled,
    getMaxBatchSize,
    shouldShowProgress
  }
}

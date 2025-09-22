import React, { useState } from 'react'

interface AutosaveSettingsProps {
  enabled: boolean
  debounceMs: number
  batchChanges: boolean
  maxBatchSize: number
  showProgress: boolean
  onSettingsChange: (settings: AutosaveSettingsData) => void
  onClose: () => void
}

export interface AutosaveSettingsData {
  enabled: boolean
  debounceMs: number
  batchChanges: boolean
  maxBatchSize: number
  showProgress: boolean
}

const AutosaveSettings: React.FC<AutosaveSettingsProps> = ({
  enabled,
  debounceMs,
  batchChanges,
  maxBatchSize,
  showProgress,
  onSettingsChange,
  onClose
}) => {
  const [localSettings, setLocalSettings] = useState<AutosaveSettingsData>({
    enabled,
    debounceMs,
    batchChanges,
    maxBatchSize,
    showProgress
  })

  const handleSave = () => {
    onSettingsChange(localSettings)
    onClose()
  }

  const handleReset = () => {
    setLocalSettings({
      enabled: true,
      debounceMs: 500,
      batchChanges: true,
      maxBatchSize: 10,
      showProgress: true
    })
  }

  const debounceOptions = [
    { value: 250, label: '250ms (Very Fast)' },
    { value: 500, label: '500ms (Fast)' },
    { value: 1000, label: '1s (Normal)' },
    { value: 2000, label: '2s (Slow)' },
    { value: 5000, label: '5s (Very Slow)' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Autosave Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Form */}
        <div className="p-4 space-y-6">
          {/* Enable Autosave */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Autosave
              </label>
              <p className="text-xs text-gray-500">
                Automatically save changes as you work
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Debounce Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Save Delay
            </label>
            <select
              value={localSettings.debounceMs}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, debounceMs: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {debounceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How long to wait after changes before saving
            </p>
          </div>

          {/* Batch Changes */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Batch Changes
              </label>
              <p className="text-xs text-gray-500">
                Group multiple changes into single save
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.batchChanges}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, batchChanges: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Max Batch Size */}
          {localSettings.batchChanges && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={localSettings.maxBatchSize}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, maxBatchSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of changes to batch together
              </p>
            </div>
          )}

          {/* Show Progress */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Show Progress
              </label>
              <p className="text-xs text-gray-500">
                Display saving progress indicator
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.showProgress}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, showProgress: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutosaveSettings

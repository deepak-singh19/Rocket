import React from 'react'

interface AutosaveIndicatorProps {
  isSaving: boolean
  savingProgress: number
  lastSaved: Date | null
  saveError: string | null
  pendingChanges: number
  saveCount: number
  onForceSave?: () => void
  showDetails?: boolean
}

const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  isSaving,
  savingProgress,
  lastSaved,
  saveError,
  pendingChanges,
  saveCount,
  onForceSave,
  showDetails = false
}) => {
  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never saved'
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    
    return date.toLocaleDateString()
  }

  const getStatusColor = () => {
    if (saveError) return 'text-red-500'
    if (isSaving) return 'text-blue-500'
    if (pendingChanges > 0) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (saveError) return '❌'
    if (isSaving) return '💾'
    if (pendingChanges > 0) return '⏳'
    return '✅'
  }

  const getStatusText = () => {
    if (saveError) return 'Save failed'
    if (isSaving) return 'Saving...'
    if (pendingChanges > 0) return `${pendingChanges} pending changes`
    return 'All changes saved'
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Main Status Indicator */}
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        <span className="text-lg">{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
      </div>

      {/* Progress Bar (when saving) */}
      {isSaving && savingProgress > 0 && (
        <div className="flex items-center space-x-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-200 ease-out"
              style={{ width: `${savingProgress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{savingProgress}%</span>
        </div>
      )}

      {/* Last Saved Time */}
      {lastSaved && !isSaving && (
        <span className="text-xs text-gray-500">
          {formatLastSaved(lastSaved)}
        </span>
      )}

      {/* Force Save Button */}
      {pendingChanges > 0 && onForceSave && (
        <button
          onClick={onForceSave}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Save now"
        >
          Save Now
        </button>
      )}

      {/* Detailed Stats (when showDetails is true) */}
      {showDetails && (
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span>Saved {saveCount} times</span>
          {pendingChanges > 0 && (
            <span>{pendingChanges} changes pending</span>
          )}
        </div>
      )}

      {/* Error Message */}
      {saveError && (
        <div className="text-xs text-red-500 max-w-xs truncate" title={saveError}>
          {saveError}
        </div>
      )}
    </div>
  )
}

export default AutosaveIndicator

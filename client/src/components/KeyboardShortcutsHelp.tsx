import React from 'react'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: Array<{
    keys: string[]
    description: string
    category?: string
  }>
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Edit Operations',
      shortcuts: [
        {
          keys: ['Ctrl', 'Z'],
          description: 'Undo last action'
        },
        {
          keys: ['Ctrl', 'Y'],
          description: 'Redo last undone action'
        },
        {
          keys: ['Ctrl', 'Shift', 'Z'],
          description: 'Redo (alternative)'
        },
        {
          keys: ['Ctrl', 'C'],
          description: 'Copy selected element'
        },
        {
          keys: ['Ctrl', 'V'],
          description: 'Paste copied element'
        },
        {
          keys: ['Delete'],
          description: 'Delete selected element'
        },
        {
          keys: ['Backspace'],
          description: 'Delete selected element (alternative)'
        }
      ]
    },
    {
      title: 'Element Movement',
      shortcuts: [
        {
          keys: ['↑'],
          description: 'Move element up 1px'
        },
        {
          keys: ['↓'],
          description: 'Move element down 1px'
        },
        {
          keys: ['←'],
          description: 'Move element left 1px'
        },
        {
          keys: ['→'],
          description: 'Move element right 1px'
        },
        {
          keys: ['Shift', '↑'],
          description: 'Move element up 10px'
        },
        {
          keys: ['Shift', '↓'],
          description: 'Move element down 10px'
        },
        {
          keys: ['Shift', '←'],
          description: 'Move element left 10px'
        },
        {
          keys: ['Shift', '→'],
          description: 'Move element right 10px'
        }
      ]
    },
    {
      title: 'Canvas Navigation',
      shortcuts: [
        {
          keys: ['Space', '+', 'Drag'],
          description: 'Pan canvas'
        },
        {
          keys: ['Ctrl', '+'],
          description: 'Zoom in'
        },
        {
          keys: ['Ctrl', '-'],
          description: 'Zoom out'
        },
        {
          keys: ['Ctrl', '0'],
          description: 'Reset zoom to 100%'
        }
      ]
    },
    {
      title: 'Element Selection',
      shortcuts: [
        {
          keys: ['Click'],
          description: 'Select element'
        },
        {
          keys: ['Ctrl', '+', 'Click'],
          description: 'Add to selection'
        },
        {
          keys: ['Ctrl', 'A'],
          description: 'Select all elements'
        },
        {
          keys: ['Escape'],
          description: 'Deselect all elements'
        }
      ]
    }
  ]

  const renderKey = (key: string) => {
    const isModifier = ['Ctrl', 'Shift', 'Alt', 'Cmd'].includes(key)
    const isSpecial = ['Space', 'Delete', 'Backspace', 'Escape'].includes(key)
    
    return (
      <kbd
        key={key}
        className={`
          px-2 py-1 text-xs font-semibold rounded
          ${isModifier || isSpecial 
            ? 'bg-gray-200 text-gray-800 border border-gray-300' 
            : 'bg-white text-gray-800 border border-gray-300 shadow-sm'
          }
        `}
      >
        {key === 'Ctrl' ? (navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl') : key}
      </kbd>
    )
  }

  const renderShortcut = (shortcut: { keys: string[]; description: string }) => (
    <div key={shortcut.description} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
      <div className="flex items-center space-x-2">
        {shortcut.keys.map((key, index) => (
          <React.Fragment key={index}>
            {renderKey(key)}
            {index < shortcut.keys.length - 1 && (
              <span className="text-gray-400 text-sm">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <span className="text-sm text-gray-600 ml-4">{shortcut.description}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Speed up your workflow with these keyboard shortcuts
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-lg font-medium text-gray-900 mb-3">{group.title}</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  {group.shortcuts.map(renderShortcut)}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Shortcuts work when no input fields are focused</li>
              <li>• Hold Shift with arrow keys for 10px movement</li>
              <li>• Copied elements are pasted with a 10px offset</li>
              <li>• Use Ctrl+A to select all elements for bulk operations</li>
              <li>• Press Escape to deselect all elements</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Press <kbd className="px-1 py-0.5 text-xs bg-white border border-gray-300 rounded">?</kbd> to toggle this help
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsHelp

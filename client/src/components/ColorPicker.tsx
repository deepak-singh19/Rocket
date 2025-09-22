import React, { useState } from 'react'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  label?: string
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false)

  const predefinedColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#008000', '#000080'
  ]

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Color preview button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 border-2 border-gray-300 rounded-md shadow-sm hover:border-gray-400 transition-colors"
          style={{ backgroundColor: color }}
          title={`Current color: ${color}`}
        >
          <span className="sr-only">Select color</span>
        </button>

        {/* Color input */}
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          title="Custom color"
        />
      </div>

      {/* Color palette dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="grid grid-cols-5 gap-1">
            {predefinedColors.map((predefinedColor) => (
              <button
                key={predefinedColor}
                onClick={() => {
                  onChange(predefinedColor)
                  setIsOpen(false)
                }}
                className="w-6 h-6 border border-gray-300 rounded hover:border-gray-400 transition-colors"
                style={{ backgroundColor: predefinedColor }}
                title={predefinedColor}
              >
                <span className="sr-only">{predefinedColor}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorPicker

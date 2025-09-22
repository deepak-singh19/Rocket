import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store'
import { createDesign } from '../store/designsSlice'
import { setCanvasSize, clearCanvas } from '../store/canvasSlice'
import TopBar from '../components/TopBar'

const NewDesign: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { loading } = useSelector((state: RootState) => state.designs)
  
  const [formData, setFormData] = useState({
    name: '',
    width: 1080,
    height: 1080,
    createdBy: 'john_doe' 
  })

  const canvasPresets = [
    { name: 'Square (1080×1080)', width: 1080, height: 1080 },
    { name: 'Instagram Post (1080×1080)', width: 1080, height: 1080 },
    { name: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
    { name: 'Facebook Post (1200×630)', width: 1200, height: 630 },
    { name: 'Twitter Post (1200×675)', width: 1200, height: 675 },
    { name: 'LinkedIn Post (1200×627)', width: 1200, height: 627 },
    { name: 'YouTube Thumbnail (1280×720)', width: 1280, height: 720 },
    { name: 'Business Card (400×250)', width: 400, height: 250 },
    { name: 'Custom', width: 0, height: 0 }
  ]

  const handlePresetSelect = (preset: typeof canvasPresets[0]) => {
    if (preset.name === 'Custom') {
      setFormData(prev => ({ ...prev, width: 800, height: 600 }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        width: preset.width, 
        height: preset.height 
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a design name')
      return
    }

    try {
      const newDesign = await dispatch(createDesign({
        name: formData.name,
        width: formData.width,
        height: formData.height,
        createdBy: formData.createdBy,
        elements: {
          canvas: {
            width: formData.width,
            height: formData.height,
            backgroundColor: '#ffffff'
          },
          objects: []
        },
        layers: [
          { name: 'Background', order: 0 },
          { name: 'Shapes', order: 1 },
          { name: 'Text', order: 2 },
          { name: 'Images', order: 3 }
        ]
      })).unwrap()

      // Set canvas size and clear any existing elements
      dispatch(setCanvasSize({ width: formData.width, height: formData.height }))
      dispatch(clearCanvas())
      
      // Navigate to the editor
      navigate(`/design/${newDesign._id}`)
    } catch (error) {
      console.error('Failed to create design:', error)
      alert('Failed to create design. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Design</h1>
            <p className="text-gray-600 mt-2">Choose a canvas size and start designing</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Design Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter design name..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Canvas Size
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {canvasPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      formData.width === preset.width && formData.height === preset.height
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-sm">{preset.name}</div>
                    {preset.name !== 'Custom' && (
                      <div className="text-xs text-gray-600 mt-1">
                        {preset.width} × {preset.height}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  id="width"
                  value={formData.width}
                  onChange={(e) => setFormData(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="100"
                  max="4000"
                  required
                />
              </div>
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  id="height"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="100"
                  max="4000"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Design'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NewDesign

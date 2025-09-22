import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState, AppDispatch } from '../store'
import { fetchDesigns } from '../store/designsSlice'
import TopBar from '../components/TopBar'

const DesignList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { designs, loading, error } = useSelector((state: RootState) => state.designs)

  useEffect(() => {
    dispatch(fetchDesigns({ page: 1, limit: 20 }))
  }, [dispatch])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium">Error loading designs</div>
            <div className="text-gray-600 mt-2">{error}</div>
            <button 
              onClick={() => dispatch(fetchDesigns({ page: 1, limit: 20 }))}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Designs</h1>
            <p className="text-gray-600 mt-2">Create and manage your canvas designs</p>
          </div>
          <Link
            to="/design/new"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Create New Design
          </Link>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No designs yet</h3>
            <p className="text-gray-600 mb-6">Create your first design to get started</p>
            <Link
              to="/design/new"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Create Your First Design
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => (
              <Link
                key={design._id}
                to={`/design/${design._id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {design.thumbnail ? (
                    <img
                      src={design.thumbnail}
                      alt={design.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-4xl">🎨</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">{design.name}</h3>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                    <span>{design.width} × {design.height}</span>
                    <span>{new Date(design.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    by {design.createdBy}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DesignList

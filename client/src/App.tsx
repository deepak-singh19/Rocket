import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from './store'
import { getCurrentUser, setAuthenticated } from './store/authSlice'
import { authService } from './services/authService'
import DesignList from './pages/DesignList'
import DesignEditor from './pages/DesignEditor'
import NewDesign from './pages/NewDesign'
import Login from './pages/Login'
import { CanvasProvider } from './contexts/CanvasContext'
import './App.css'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  // Check for existing token on app load
  useEffect(() => {
    const token = authService.getToken()

    if (token && authService.isAuthenticated()) {
      dispatch(setAuthenticated(true))
      dispatch(getCurrentUser())
    }
  }, [dispatch])

  // Protected route component
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      )
    }
    
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
  }

  return (
    <CanvasProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DesignList />
            </ProtectedRoute>
          } />
          <Route path="/design/new" element={
            <ProtectedRoute>
              <NewDesign />
            </ProtectedRoute>
          } />
          <Route path="/design/:id" element={
            <ProtectedRoute>
              <DesignEditor />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </CanvasProvider>
  )
}

export default App

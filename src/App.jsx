import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import StudentDetails from './pages/StudentDetails'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen bg-pure-black">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route 
          path="/admin/student/:studentId" 
          element={
            <ProtectedRoute requiredRole="admin">
              <StudentDetails />
            </ProtectedRoute>
          } 
        />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Redirecionar rotas não encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App

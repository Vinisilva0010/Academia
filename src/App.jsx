import { Routes, Route, Navigate } from 'react-router-dom'
import Splash from './pages/Splash'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import StudentDetails from './pages/StudentDetails'
import ProtectedRoute from './components/ProtectedRoute'
import { LanguageProvider } from './contexts/LanguageContext'
import LanguageSwitcher from './components/LanguageSwitcher'

function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-pure-black">
        {/* Botão de Idioma Global (Aparece em todas as telas) */}
        <LanguageSwitcher />
        
        <Routes>
          {/* Página inicial com efeitos IMMERSION FIT */}
          <Route path="/" element={<Splash />} />

          {/* Se quiser manter a Home antiga em outra rota */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />

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
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          {/* Redirecionar rotas não encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </LanguageProvider>
  )
}

export default App
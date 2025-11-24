import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Buscar perfil do usuário no Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        const profileData = {
          uid,
          ...userDocSnap.data()
        }
        setUserProfile(profileData)
        return profileData
      } else {
        console.error('Perfil do usuário não encontrado no Firestore')
        setUserProfile(null)
        return null
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      setUserProfile(null)
      return null
    }
  }

  // Função de Login
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Buscar perfil no Firestore após login bem-sucedido
      const profile = await fetchUserProfile(user.uid)
      
      if (!profile) {
        throw new Error('Perfil do usuário não encontrado')
      }

      return { success: true, user, profile }
    } catch (error) {
      console.error('Erro no login:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login. Verifique suas credenciais.' 
      }
    }
  }

  // Função de Logout
  const logout = async () => {
    try {
      await signOut(auth)
      setCurrentUser(null)
      setUserProfile(null)
      return { success: true }
    } catch (error) {
      console.error('Erro no logout:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer logout.' 
      }
    }
  }

  // Observar mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        // Buscar perfil sempre que o usuário mudar
        await fetchUserProfile(user.uid)
      } else {
        setCurrentUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Função para atualizar o perfil manualmente
  const refreshProfile = async () => {
    if (currentUser) {
      await fetchUserProfile(currentUser.uid)
    }
  }

  const value = {
    currentUser,
    userProfile,
    login,
    logout,
    loading,
    refreshProfile,
    isAdmin: userProfile?.role === 'admin',
    isClient: userProfile?.role === 'client',
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}


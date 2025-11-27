import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { createOrUpdateUser } from '../utils/firestore'
import { LogIn, Mail, Lock, Loader2, AlertCircle, UserPlus, User } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login' ou 'signup'
  
  const { login, userProfile, currentUser, refreshProfile } = useAuth()
  const navigate = useNavigate()

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (currentUser && userProfile) {
      if (userProfile.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (userProfile.role === 'client') {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [currentUser, userProfile, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      setLoading(false)
      return
    }

    const result = await login(email, password)

    if (result.success) {
      // Redirecionar baseado na role
      if (result.profile.role === 'admin') {
        navigate('/admin')
      } else if (result.profile.role === 'client') {
        navigate('/dashboard')
      } else {
        setError('Role do usuário inválida')
        setLoading(false)
      }
    } else {
      setError(result.error || 'Erro ao fazer login')
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validações
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setError('Por favor, preencha todos os campos')
      setLoading(false)
      return
    }

    if (firstName.trim().length < 2) {
      setError('O nome deve ter pelo menos 2 caracteres')
      setLoading(false)
      return
    }

    if (lastName.trim().length < 2) {
      setError('O sobrenome deve ter pelo menos 2 caracteres')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      // 1. Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. CRÍTICO: Criar documento no Firestore imediatamente
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const userData = {
        email: email,
        name: fullName,
        role: 'client',
        status: 'new'
      }

      const firestoreResult = await createOrUpdateUser(user.uid, userData)

      if (!firestoreResult.success) {
        // Se falhar ao criar no Firestore, deletar o usuário do Auth
        await user.delete()
        throw new Error(firestoreResult.error || 'Erro ao criar perfil do usuário')
      }

      // 3. Recarregar perfil para pegar os dados atualizados
      await refreshProfile()

      // 4. Aguardar um pouco para garantir que o perfil foi atualizado no contexto
      await new Promise(resolve => setTimeout(resolve, 300))

      // 5. Redirecionar para Dashboard (onde verá a Anamnese)
      navigate('/dashboard')
      
      // Loading será limpo naturalmente após redirecionamento

    } catch (error) {
      console.error('Erro no cadastro:', error)
      
      // Mensagens de erro mais amigáveis
      let errorMessage = 'Erro ao criar conta'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso. Tente fazer login.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A senha é muito fraca'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black text-white px-4">
      {/* Fundo com gradiente animado suave */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-black to-emerald-900/50 bg-[length:320%_320%] animate-gradient" />

      {/* Overlay escuro para contraste */}
      <div className="absolute inset-0 bg-black/85" />

      {/* Conteúdo principal */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
        {/* Lado esquerdo: branding / texto */}
        <div className="space-y-4 md:w-1/2">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Immersion Fit
          </p>
          <h1 className="bg-gradient-to-r from-emerald-400 via-white to-emerald-500 bg-clip-text text-3xl font-extrabold uppercase tracking-wide text-transparent md:text-4xl">
            Sua rotina fitness em modo imersivo
          </h1>
          <p className="text-sm text-gray-300 md:text-base">
            Acesse treinos, avaliações, planos e todo o acompanhamento da consultoria
            em um ambiente feito para foco total.
          </p>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        </div>

        {/* Lado direito: card de login/cadastro (reusa sua lógica atual) */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-emerald-500/20 bg-white/5 p-8 shadow-[0_0_45px_rgba(16,185,129,0.25)] backdrop-blur-xl">
            {/* Cabeçalho (mantendo seu modo login/signup) */}
            <div className="flex items-center justify-center mb-6">
              {mode === 'login' ? (
                <>
                  <LogIn className="w-8 h-8 text-neon-green mr-2" />
                  <h1 className="text-2xl font-black uppercase tracking-wide">
                    Login
                  </h1>
                </>
              ) : (
                <>
                  <UserPlus className="w-8 h-8 text-neon-green mr-2" />
                  <h1 className="text-2xl font-black uppercase tracking-wide">
                    Cadastro
                  </h1>
                </>
              )}
            </div>

            <form
              onSubmit={mode === 'login' ? handleLogin : handleSignUp}
              className="space-y-6"
            >
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-gray-300 text-xs font-bold mb-2 uppercase tracking-wide">
                      Nome
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-zinc-900/70 border border-zinc-700 text-white rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                        placeholder="Seu nome"
                        disabled={loading}
                        required
                        minLength={2}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-xs font-bold mb-2 uppercase tracking-wide">
                      Sobrenome
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-zinc-900/70 border border-zinc-700 text-white rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                        placeholder="Seu sobrenome"
                        disabled={loading}
                        required
                        minLength={2}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-gray-300 text-xs font-bold mb-2 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900/70 border border-zinc-700 text-white rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                    placeholder="seu@email.com"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-bold mb-2 uppercase tracking-wide">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900/70 border border-zinc-700 text-white rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Mínimo de 6 caracteres
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-gray-300 text-xs font-bold mb-2 uppercase tracking-wide">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-900/70 border border-zinc-700 text-white rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green"
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-3 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-wide transition duration-300 ease-out ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-black shadow-[0_0_25px_rgba(16,185,129,0.8)] hover:scale-[1.01] hover:shadow-[0_0_35px_rgba(16,185,129,1)]'
                    : 'bg-zinc-900 border border-emerald-500/60 text-emerald-200 hover:bg-zinc-800'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  <>
                    {mode === 'login' ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        Entrar
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Criar Conta
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            {/* Toggle entre Login e Cadastro */}
            <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
              <p className="text-gray-300 text-sm mb-2">
                {mode === 'login'
                  ? 'Não tem uma conta?'
                  : 'Já tem uma conta?'}
              </p>
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="text-neon-green hover:text-neon-green/80 font-bold uppercase text-xs tracking-wide transition-colors"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Fazer Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Componente Avatar
 * Exibe foto do usuário se disponível, caso contrário mostra iniciais em um círculo colorido
 */
export default function Avatar({ 
  name, 
  photoUrl, 
  size = 'md',
  className = '' 
}) {
  // Função para extrair iniciais do nome
  const getInitials = (fullName) => {
    if (!fullName) return '?'
    
    // Dividir nome em partes (primeiro nome e sobrenome)
    const parts = fullName.trim().split(/\s+/)
    
    if (parts.length === 1) {
      // Apenas um nome: pegar primeira e segunda letra
      return parts[0].substring(0, 2).toUpperCase()
    }
    
    // Múltiplos nomes: primeira letra do primeiro e primeira letra do último
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Tamanhos do avatar
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
    '2xl': 'w-32 h-32 text-4xl'
  }

  const sizeClass = sizeClasses[size] || sizeClasses.md
  const initials = getInitials(name)

  // Se tiver photoUrl, mostrar foto
  if (photoUrl) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={photoUrl}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // Caso contrário, mostrar iniciais em círculo colorido
  return (
    <div 
      className={`
        ${sizeClass} 
        rounded-full 
        flex items-center justify-center 
        bg-neon-green/20 
        border-2 border-neon-green/50
        text-neon-green 
        font-black 
        flex-shrink-0
        ${className}
      `}
      title={name || 'Avatar'}
    >
      {initials}
    </div>
  )
}


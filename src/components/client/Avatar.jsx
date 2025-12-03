import React from 'react';

const Avatar = ({ name, photoUrl, size = 'md', className = '' }) => {
  const getInitials = (name) => {
    if (!name) return 'IF'; // Sigla padrão
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Tamanhos das bolinhas
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const baseClasses = `rounded-full flex items-center justify-center font-black transition-all ${className}`;
  // Estilo padrão: Fundo verde transparente com texto verde
  const colorClasses = 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClasses[size]} ${baseClasses} object-cover border border-zinc-700`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${baseClasses} ${colorClasses}`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
import { createContext, useState, useContext, useEffect } from 'react'
import { translations } from '../utils/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  // Tenta pegar do localStorage ou usa 'pt' como padrão
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('appLanguage')
    return saved || 'pt'
  })

  useEffect(() => {
    localStorage.setItem('appLanguage', language)
  }, [language])

  // Função 't' (translate) que busca o texto
  const t = (section, key) => {
    try {
      return translations[language][section][key] || key
    } catch (e) {
      return key // Se falhar, retorna a chave original
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
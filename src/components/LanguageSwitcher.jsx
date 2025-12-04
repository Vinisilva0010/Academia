import { useLanguage } from '../contexts/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <button
      onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-lg hover:border-neon-blue/50 transition-all group"
    >
      <Globe className="w-4 h-4 text-neon-blue group-hover:rotate-12 transition-transform" />
      <span className="text-xs font-bold text-white uppercase tracking-wider">
        {language === 'pt' ? 'PT' : 'EN'}
      </span>
      <div className="w-px h-3 bg-white/20 mx-1" />
      <span className="text-lg leading-none">
        {language === 'pt' ? '🇧🇷' : '🇺🇸'}
      </span>
    </button>
  )
}
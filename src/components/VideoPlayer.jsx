import { X, ExternalLink, Play, Film } from 'lucide-react'

export default function VideoPlayer({ videoUrl, onClose }) {
  if (!videoUrl) return null

  // --- LÓGICA (MANTIDA ORIGINAL) ---
  const isYouTube = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  const getYouTubeId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[7].length === 11) ? match[7] : null
  }

  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeId(url)
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`
    }
    return null
  }

  const isMP4 = (url) => {
    return url.toLowerCase().endsWith('.mp4') || url.includes('.mp4')
  }

  const renderVideo = () => {
    if (isYouTube(videoUrl)) {
      const embedUrl = getYouTubeEmbedUrl(videoUrl)
      if (embedUrl) {
        return (
          <iframe
            src={embedUrl}
            title="Video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-xl"
          />
        )
      } else {
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
            <div className="p-4 bg-zinc-800 rounded-full mb-2">
                <Film className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-gray-300 font-bold">
              Não foi possível carregar o player integrado.
            </p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Assistir no YouTube
            </a>
          </div>
        )
      }
    } else if (isMP4(videoUrl)) {
      return (
        <video
          src={videoUrl}
          controls
          className="w-full h-full rounded-xl"
          autoPlay
        >
          Seu navegador não suporta a tag de vídeo.
        </video>
      )
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-6 p-8 relative overflow-hidden">
            {/* Background animado para erro */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black z-0" />
            
            <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                    <Play className="w-8 h-8 text-neon-blue ml-1" />
                </div>
                <p className="text-white font-bold text-lg mb-2">Formato de vídeo externo</p>
                <p className="text-zinc-400 text-sm max-w-xs mx-auto mb-6">
                    Este vídeo está hospedado em uma plataforma que requer abertura em nova aba.
                </p>
                <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neon-blue text-black font-black uppercase rounded-xl hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                    <ExternalLink className="w-5 h-5" />
                    Abrir Vídeo
                </a>
            </div>
        </div>
      )
    }
  }

  // --- RENDERIZAÇÃO VISUAL (CINEMA MODE) ---
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
      
      {/* Container Principal */}
      <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 group">
        
        {/* Efeito Glow atrás do container */}
        <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue/20 via-purple-500/20 to-neon-blue/20 blur-xl opacity-50 pointer-events-none" />

        {/* Barra de Título (Flutuante - Aparece no Hover ou sempre visível) */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 to-transparent z-20 flex justify-between items-start pointer-events-none">
          <div>
             {/* Espaço para título se quiser adicionar depois */}
          </div>
          
          <button
            onClick={onClose}
            className="pointer-events-auto p-2 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Área do Vídeo (Aspect Ratio 16:9) */}
        <div className="relative aspect-video w-full bg-zinc-900 z-10">
          {renderVideo()}
        </div>

        {/* Rodapé (Flutuante) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-20 flex justify-end pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/5"
          >
            <ExternalLink className="w-3 h-3" />
            Link Original
          </a>
        </div>
      </div>
      
      {/* Fechar ao clicar fora */}
      <div className="absolute inset-0 -z-10 cursor-pointer" onClick={onClose} />
    </div>
  )
}
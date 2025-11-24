import { X, ExternalLink } from 'lucide-react'

export default function VideoPlayer({ videoUrl, onClose }) {
  if (!videoUrl) return null

  // Função para detectar se é YouTube
  const isYouTube = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  // Função para extrair ID do YouTube
  const getYouTubeId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[7].length === 11) ? match[7] : null
  }

  // Função para converter URL do YouTube em embed
  const getYouTubeEmbedUrl = (url) => {
    const videoId = getYouTubeId(url)
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
    return null
  }

  // Função para verificar se é MP4
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
            className="w-full h-full"
          />
        )
      } else {
        // Se não conseguir extrair ID, abre link externo
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-gray-300 text-center">
              Não foi possível carregar o vídeo do YouTube.
            </p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Abrir no YouTube
            </a>
          </div>
        )
      }
    } else if (isMP4(videoUrl)) {
      return (
        <video
          src={videoUrl}
          controls
          className="w-full h-full"
          autoPlay
        >
          Seu navegador não suporta a tag de vídeo.
        </video>
      )
    } else {
      // Para outros tipos de URL, tentar como vídeo direto
      return (
        <video
          src={videoUrl}
          controls
          className="w-full h-full"
          autoPlay
        >
          <source src={videoUrl} type="video/mp4" />
          <p className="text-gray-300 text-center p-4">
            Seu navegador não suporta este formato de vídeo.{' '}
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-blue hover:underline"
            >
              Abrir em nova aba
            </a>
          </p>
        </video>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col" style={{ height: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
          <h3 className="text-lg font-black uppercase text-white">Player de Vídeo</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Video Player */}
        <div className="flex-1 bg-black relative">
          {renderVideo()}
        </div>

        {/* Footer com link alternativo */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neon-blue hover:underline flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir em nova aba
          </a>
        </div>
      </div>
    </div>
  )
}




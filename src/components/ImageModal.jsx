import { X } from 'lucide-react'

export default function ImageModal({ imageUrl, onClose }) {
  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Imagem */}
        <img
          src={imageUrl}
          alt="Imagem ampliada"
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}


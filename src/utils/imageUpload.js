import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

/**
 * Upload de imagem para Firebase Storage
 * @param {File} file - Arquivo de imagem a ser enviado
 * @param {string} userId - UID do usuário que está enviando
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadChatImage = async (file, userId) => {
  try {
    console.log('[uploadChatImage] Iniciando validação do arquivo...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId
    })

    // Validar se o arquivo existe
    if (!file) {
      return {
        success: false,
        error: 'Nenhum arquivo selecionado'
      }
    }

    // Validar tipo de arquivo
    if (!file.type || !file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'O arquivo deve ser uma imagem (JPG, PNG, GIF, WebP)'
      }
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `A imagem deve ter no máximo 5MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      }
    }

    // Validar se storage está inicializado
    if (!storage) {
      console.error('[uploadChatImage] Storage não inicializado')
      return {
        success: false,
        error: 'Serviço de armazenamento não disponível'
      }
    }

    // Criar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}_${timestamp}_${randomString}.${fileExtension}`
    
    // Caminho no Storage: chat_images/{userId}/{fileName}
    const storageRef = ref(storage, `chat_images/${userId}/${fileName}`)

    console.log('[uploadChatImage] Iniciando upload para:', `chat_images/${userId}/${fileName}`)
    
    // Fazer upload com timeout
    const uploadPromise = uploadBytes(storageRef, file)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout após 60 segundos')), 60000)
    )
    
    const snapshot = await Promise.race([uploadPromise, timeoutPromise])
    
    console.log('[uploadChatImage] Upload concluído, obtendo URL de download...')
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    console.log('[uploadChatImage] Upload concluído com sucesso!', downloadURL)

    return {
      success: true,
      url: downloadURL
    }
  } catch (error) {
    console.error('[uploadChatImage] Erro detalhado no upload:', {
      error,
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    let errorMessage = 'Erro ao fazer upload da imagem'
    
    // Verificar se é erro de CORS
    if (error.message && (error.message.includes('CORS') || error.message.includes('cors') || error.message.includes('ERR_FAILED'))) {
      errorMessage = 'Erro de CORS: Configure as regras do Firebase Storage. Veja FIREBASE_STORAGE_RULES.md'
      console.error('[uploadChatImage] ❌ ERRO DE CORS - Verifique as regras do Firebase Storage:')
      console.error('[uploadChatImage] 1. Acesse Firebase Console > Storage > Rules')
      console.error('[uploadChatImage] 2. Configure as regras conforme FIREBASE_STORAGE_RULES.md')
    } else if (error.message) {
      errorMessage = error.message
    } else if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          errorMessage = 'Sem permissão para fazer upload. Verifique se está autenticado e as regras do Storage.'
          break
        case 'storage/canceled':
          errorMessage = 'Upload cancelado'
          break
        case 'storage/unknown':
          errorMessage = 'Erro desconhecido no upload. Verifique sua conexão e as regras do Storage.'
          break
        case 'storage/unauthenticated':
          errorMessage = 'Usuário não autenticado. Faça login novamente.'
          break
        default:
          errorMessage = `Erro: ${error.code}. Verifique as regras do Firebase Storage.`
      }
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Validar se o arquivo é uma imagem válida
 * @param {File} file - Arquivo a validar
 * @returns {boolean}
 */
export const isValidImageFile = (file) => {
  if (!file) return false
  
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) return false
  
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) return false
  
  return true
}


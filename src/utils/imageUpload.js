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
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'O arquivo deve ser uma imagem'
      }
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'A imagem deve ter no máximo 5MB'
      }
    }

    // Criar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = `${userId}_${timestamp}_${randomString}.${file.name.split('.').pop()}`
    
    // Caminho no Storage: chat_images/{userId}/{fileName}
    const storageRef = ref(storage, `chat_images/${userId}/${fileName}`)

    // Fazer upload
    console.log('[uploadChatImage] Iniciando upload:', fileName)
    const snapshot = await uploadBytes(storageRef, file)
    
    // Obter URL de download
    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log('[uploadChatImage] Upload concluído:', downloadURL)

    return {
      success: true,
      url: downloadURL
    }
  } catch (error) {
    console.error('[uploadChatImage] Erro no upload:', error)
    return {
      success: false,
      error: error.message || 'Erro ao fazer upload da imagem'
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


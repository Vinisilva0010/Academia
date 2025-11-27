/**
 * Cloud Functions for Firebase - Immersion Fit Pro
 * 
 * Esta função é acionada quando uma nova mensagem é criada na coleção 'messages'
 * e envia uma notificação push para o destinatário usando Firebase Cloud Messaging.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
admin.initializeApp();

/**
 * Função acionada quando uma nova mensagem é criada
 * Envia notificação push para o destinatário
 */
exports.onMessageCreated = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const messageData = snap.data();
      const messageId = context.params.messageId;

      console.log('[onMessageCreated] Nova mensagem criada:', messageId);
      console.log('[onMessageCreated] Dados da mensagem:', {
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        hasText: !!messageData.text,
        hasImage: !!messageData.imageUrl
      });

      // Validar dados essenciais
      if (!messageData.senderId || !messageData.receiverId) {
        console.error('[onMessageCreated] ❌ Mensagem sem senderId ou receiverId');
        return null;
      }

      const { senderId, receiverId, text, imageUrl } = messageData;

      // Buscar dados do destinatário (receiver) para obter o FCM token
      const receiverDoc = await admin.firestore()
        .collection('users')
        .doc(receiverId)
        .get();

      if (!receiverDoc.exists) {
        console.warn('[onMessageCreated] ⚠️ Destinatário não encontrado:', receiverId);
        return null;
      }

      const receiverData = receiverDoc.data();
      const fcmToken = receiverData?.fcmToken;

      // Se não há token FCM, não enviar notificação
      if (!fcmToken) {
        console.log('[onMessageCreated] ℹ️ Destinatário não tem FCM token configurado:', receiverId);
        return null;
      }

      // Buscar dados do remetente (sender) para obter o nome
      const senderDoc = await admin.firestore()
        .collection('users')
        .doc(senderId)
        .get();

      let senderName = 'Alguém';
      
      if (senderDoc.exists) {
        const senderData = senderDoc.data();
        senderName = senderData?.name || senderData?.firstName || 'Alguém';
      }

      // Preparar o corpo da notificação
      let notificationBody = '';
      
      if (imageUrl) {
        notificationBody = '📷 Enviou uma imagem';
      } else if (text && text.trim()) {
        // Limitar texto a 100 caracteres
        notificationBody = text.trim().length > 100 
          ? text.trim().substring(0, 100) + '...'
          : text.trim();
      } else {
        notificationBody = 'Nova mensagem';
      }

      // Preparar o título da notificação
      const notificationTitle = `💬 Nova mensagem de ${senderName}`;

      // Payload da notificação
      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: {
          type: 'message',
          messageId: messageId,
          senderId: senderId,
          receiverId: receiverId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK' // Para compatibilidade com PWA
        },
        token: fcmToken,
        webpush: {
          notification: {
            title: notificationTitle,
            body: notificationBody,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            requireInteraction: false,
            vibrate: [200, 100, 200]
          },
          fcmOptions: {
            link: '/' // Link para abrir quando clicar na notificação
          }
        }
      };

      // Enviar notificação
      console.log('[onMessageCreated] 📤 Enviando notificação para:', receiverId);
      const response = await admin.messaging().send(message);
      
      console.log('[onMessageCreated] ✅ Notificação enviada com sucesso:', response);
      return null;

    } catch (error) {
      console.error('[onMessageCreated] ❌ Erro ao processar mensagem:', error);
      console.error('[onMessageCreated] Stack trace:', error.stack);
      
      // Não relançar o erro para evitar que a função seja executada novamente
      // O Firestore já salvou a mensagem, então não queremos quebrar o fluxo
      return null;
    }
  });


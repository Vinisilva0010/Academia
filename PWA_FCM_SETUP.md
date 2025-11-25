# Guia de Configuração PWA + Firebase Cloud Messaging (FCM)

## 📋 Passos para Configuração Completa

### 1. Obter Chave VAPID no Firebase Console

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto `apexfit-pro`
3. Vá em **Project Settings** (ícone de engrenagem) > **Cloud Messaging**
4. Na seção **Web configuration**, procure por **Web Push certificates**
5. Se ainda não tiver uma chave, clique em **Generate key pair**
6. Copie a **chave pública** gerada (formato: `BHx...` ou similar)
7. Adicione no arquivo `.env`:

```env
VITE_FIREBASE_VAPID_KEY=SUA_CHAVE_VAPID_AQUI
```

### 2. Configurar Variáveis de Ambiente

Adicione a VAPID key no arquivo `.env` na raiz do projeto:

```env
# Firebase Config (já existentes)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Nova variável para FCM
VITE_FIREBASE_VAPID_KEY=SUA_CHAVE_VAPID_AQUI
```

### 3. Atualizar Service Worker (firebase-messaging-sw.js)

O service worker precisa das mesmas credenciais do Firebase. Se você usar variáveis de ambiente, você pode:
- Deixar as credenciais hardcoded no service worker (mais simples)
- Ou usar uma abordagem de build que injeta as variáveis

**Nota:** Service Workers não têm acesso direto a variáveis de ambiente em runtime, então as credenciais estão hardcoded. Isso é seguro porque são chaves públicas (não secretas).

### 4. Ícones do PWA (Opcional mas Recomendado)

Os ícones estão usando placeholders. Para produção, substitua no `manifest.json`:

```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Crie os ícones:
- 192x192px para dispositivos Android
- 512x512px para telas de splash e alta qualidade
- Formatos: PNG com fundo transparente

### 5. Testar o PWA

1. Execute o build: `npm run build`
2. Servir localmente: `npm run preview`
3. No navegador (Chrome DevTools):
   - Abra DevTools > Application
   - Verifique se o Service Worker está registrado
   - Verifique se o Manifest está carregado
   - Teste "Add to Home Screen" (mobile) ou "Install" (desktop)

### 6. Testar Notificações Push

#### No Console do Firebase:

1. Vá em **Cloud Messaging** > **Send test message**
2. Cole o **FCM Token** do usuário (está salvo em `users/{uid}/fcmToken`)
3. Configure:
   - **Notification title**: "Teste de Notificação"
   - **Notification text**: "Olá! Esta é uma mensagem de teste"
4. Clique em **Test**

#### Via Código (Enviar Notificação):

Você pode criar uma função no Admin para enviar notificações:

```javascript
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Função para enviar notificação (requer backend ou Cloud Function)
// Por enquanto, use o Console do Firebase ou crie uma Cloud Function
```

### 7. Estrutura de Dados no Firestore

Cada usuário agora tem um campo `fcmToken`:

```javascript
users/{uid} {
  email: string,
  role: 'admin' | 'client',
  status: 'new' | 'pending' | 'active',
  fcmToken: string, // Token FCM do dispositivo
  fcmTokenUpdatedAt: Timestamp
}
```

### 8. Como Enviar Notificações (Próximos Passos)

#### Opção 1: Cloud Functions (Recomendado)

Crie uma Cloud Function que:
- Recebe o `userId` do destinatário
- Busca o `fcmToken` no Firestore
- Envia a notificação via FCM Admin SDK

#### Opção 2: Backend Próprio

Use o FCM Admin SDK em um servidor Node.js/Python para enviar notificações.

#### Opção 3: Console do Firebase (Para Testes)

Use o Console do Firebase > Cloud Messaging para enviar notificações de teste.

---

## ✅ Checklist de Implementação

- [x] Manifest.json criado
- [x] Service Worker configurado
- [x] Firebase Messaging integrado
- [x] Hook useNotification criado
- [x] Componente NotificationPrompt criado
- [x] Componente Toast criado
- [x] Integração nos Dashboards
- [ ] **Você precisa:** Gerar VAPID Key no Firebase Console
- [ ] **Você precisa:** Adicionar VAPID Key no `.env`
- [ ] **Você precisa:** Criar ícones do PWA (opcional)
- [ ] **Você precisa:** Testar notificações via Console ou Cloud Function

---

## 🔧 Troubleshooting

### Notificações não funcionam:
1. Verifique se a VAPID key está correta no `.env`
2. Verifique se o Service Worker está registrado (DevTools > Application)
3. Verifique se o token FCM foi salvo no Firestore (`users/{uid}/fcmToken`)
4. Verifique o console do navegador para erros

### PWA não instala:
1. Verifique se está usando HTTPS (ou localhost)
2. Verifique se o manifest.json está acessível
3. Verifique se o Service Worker está registrado
4. Tente em modo incógnito para descartar cache

### Service Worker não registra:
1. Verifique se o arquivo `firebase-messaging-sw.js` está em `/public`
2. Verifique o caminho no `index.html`: `/firebase-messaging-sw.js`
3. Verifique o console do navegador para erros de sintaxe

---

## 📚 Recursos

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)




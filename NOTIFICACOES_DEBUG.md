# 🔍 Guia de Debug - Notificações Push

## Checklist de Verificação

### 1. ✅ VAPID Key Configurada?

Verifique se a chave VAPID está configurada:

**Local (.env):**
```env
VITE_FIREBASE_VAPID_KEY=SUA_CHAVE_VAPID_AQUI
```

**Vercel:**
- Vá em Settings > Environment Variables
- Adicione: `VITE_FIREBASE_VAPID_KEY` com o valor da chave

**Como obter a VAPID Key:**
1. Firebase Console > Project Settings > Cloud Messaging
2. Na seção "Web Push certificates", clique em "Generate key pair"
3. Copie a chave pública gerada

### 2. ✅ Service Worker Registrado?

1. Abra o DevTools (F12)
2. Vá em **Application** > **Service Workers**
3. Verifique se `firebase-messaging-sw.js` está registrado e ativo
4. Se não estiver, verifique o console para erros

### 3. ✅ Permissão de Notificação Concedida?

**Verificar no console:**
```javascript
Notification.permission
// Deve retornar: "granted"
```

**Se retornar "denied" ou "default":**
- O usuário precisa clicar em "Ativar Notificações" no card
- Ou conceder permissão manualmente nas configurações do navegador

### 4. ✅ Token FCM Gerado e Salvo?

**Verificar no console do navegador:**
- Procure por: `✅ Token FCM obtido:`
- O token deve ser uma string longa

**Verificar no Firestore:**
```
users/{userId} {
  fcmToken: "string-longa-aqui",
  fcmTokenUpdatedAt: Timestamp
}
```

### 5. ✅ Testar Notificação

**Via Firebase Console:**
1. Firebase Console > Cloud Messaging > Send test message
2. Cole o FCM Token do usuário
3. Envie uma mensagem de teste

**Esperado:**
- **App aberto:** Toast aparece no topo da tela
- **App fechado/minimizado:** Notificação nativa aparece

## 🐛 Problemas Comuns

### Problema: "VAPID Key não configurada"

**Solução:**
- Verifique se adicionou `VITE_FIREBASE_VAPID_KEY` no `.env` (local) ou Vercel
- Reinicie o servidor após adicionar a variável
- No Vercel, faça um novo deploy após adicionar a variável

### Problema: "Firebase Messaging não está inicializado"

**Solução:**
- Verifique se está usando HTTPS ou localhost
- Verifique o console para erros de inicialização
- Certifique-se de que o Firebase está configurado corretamente

### Problema: "Não foi possível obter o token FCM"

**Possíveis causas:**
- VAPID Key incorreta ou não configurada
- Service Worker não registrado
- Permissão de notificação negada
- Navegador não suporta notificações push

**Solução:**
- Verifique a VAPID Key no Firebase Console
- Teste em navegadores modernos (Chrome, Firefox, Edge)
- Verifique permissões nas configurações do navegador

### Problema: Notificações não chegam no celular

**Verificações:**
1. ✅ Service Worker está registrado?
2. ✅ Token FCM foi salvo no Firestore?
3. ✅ Permissão de notificação foi concedida?
4. ✅ App está instalado como PWA no celular?

**Importante para Mobile:**
- O app deve estar instalado como PWA
- Use HTTPS (não HTTP)
- Certifique-se de que o Service Worker está ativo

### Problema: Notificações só funcionam quando app está aberto

**Isso é esperado!** O Service Worker lida com notificações em background.

**Para garantir que funciona em background:**
1. Verifique se o Service Worker está registrado
2. Teste fechando completamente o app
3. Envie uma notificação de teste
4. A notificação deve aparecer mesmo com o app fechado

## 📱 Testando no Mobile

### Android (Chrome):

1. **Instalar como PWA:**
   - Abra o app no Chrome
   - Menu (3 pontos) > "Adicionar à tela inicial"

2. **Ativar Notificações:**
   - Abra o app PWA instalado
   - Clique em "Ativar Notificações"
   - Permita quando solicitado

3. **Verificar Token:**
   - Console do DevTools (via USB Debugging ou Chrome Remote)
   - Procure por: `✅ Token FCM obtido:`

### iOS (Safari):

1. **Adicionar à Tela Inicial:**
   - Compartilhar > "Adicionar à Tela de Início"

2. **Ativar Notificações:**
   - Abra o app PWA
   - Clique em "Ativar Notificações"
   - Permita quando solicitado

**Nota:** iOS tem limitações com Push Notifications em PWAs. Funcionalidade completa pode exigir app nativo.

## 🔧 Debug no Console

Adicione estes logs temporariamente para debug:

```javascript
// No console do navegador
console.log('Permission:', Notification.permission)
console.log('Service Worker:', navigator.serviceWorker.controller)

// Verificar token salvo
// No Firestore, verifique: users/{uid}/fcmToken
```

## ✅ Verificação Final

1. [ ] VAPID Key configurada no .env/Vercel
2. [ ] Service Worker registrado e ativo
3. [ ] Permissão de notificação = "granted"
4. [ ] Token FCM gerado e salvo no Firestore
5. [ ] Notificação de teste enviada via Firebase Console
6. [ ] Notificação aparece no dispositivo

Se todos os itens estiverem marcados e ainda não funcionar, verifique:
- Configurações do Firebase Cloud Messaging
- Regras de segurança do Firestore
- Logs de erro no console do navegador


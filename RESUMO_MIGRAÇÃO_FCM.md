# 📱 Resumo da Migração FCM para Cloud Functions

## ✅ O que foi implementado

### 1. **Cloud Functions (Backend V1)**
- ✅ Função `onMessageCreated` criada em `functions/index.js`
- ✅ Trigger: `onDocumentCreated` na coleção `messages/{messageId}`
- ✅ Busca FCM token do destinatário na coleção `users`
- ✅ Busca nome do remetente na coleção `users`
- ✅ Envia notificação push usando `admin.messaging().send()`

### 2. **Lógica da Bolinha Vermelha (Frontend)**
- ✅ `ChatButton` e `AdminChatButton` usam `subscribeToUnreadMessages`
- ✅ Função usa `onSnapshot` para atualização em tempo real
- ✅ Filtra por `receiverId == userId` e `read == false`
- ✅ `ChatWindow` marca mensagens como lidas ao abrir (usando Batch Update)

### 3. **Documentação Completa**
- ✅ `CLOUD_FUNCTIONS_SETUP.md` - Guia completo de configuração
- ✅ `DEPLOY_COMMANDS.md` - Comandos de terminal para deploy
- ✅ `firebase.json` - Configuração do Firebase CLI

---

## 🔧 Estrutura Criada

```
functions/
├── package.json       ✅ Dependências (firebase-admin, firebase-functions)
├── index.js          ✅ Função onMessageCreated
├── .gitignore        ✅ Ignorar node_modules
└── .eslintrc.js      ✅ Configuração ESLint

firebase.json          ✅ Configuração Functions
CLOUD_FUNCTIONS_SETUP.md ✅ Documentação completa
DEPLOY_COMMANDS.md     ✅ Comandos de deploy
```

---

## 🚀 Próximos Passos

### 1. Instalar Firebase CLI (se ainda não tiver)
```bash
npm install -g firebase-tools
```

### 2. Login no Firebase
```bash
firebase login
```

### 3. Selecionar Projeto
```bash
firebase use --add
# Selecione: apexfit-pro (ou o nome do seu projeto)
```

### 4. Instalar Dependências das Functions
```bash
cd functions
npm install
cd ..
```

### 5. Fazer Deploy
```bash
firebase deploy --only functions
```

### 6. Verificar Logs
```bash
firebase functions:log
```

---

## 📋 Como Funciona

### Fluxo de Notificação:

1. **Usuário envia mensagem** → Frontend cria documento em `messages/{messageId}`
2. **Cloud Function acionada** → `onMessageCreated` detecta novo documento
3. **Busca dados do destinatário** → Firestore `users/{receiverId}` → Campo `fcmToken`
4. **Busca nome do remetente** → Firestore `users/{senderId}` → Campo `name`
5. **Envia notificação push** → `admin.messaging().send()` → Dispositivo do destinatário
6. **Destinatário recebe notificação** → PWA mostra notificação push

### Fluxo da Bolinha Vermelha:

1. **Nova mensagem criada** → Campo `read: false` por padrão
2. **Firestore atualiza** → Query `subscribeToUnreadMessages` detecta mudança (via `onSnapshot`)
3. **Contador atualiza** → Bolinha vermelha aparece no `ChatButton`
4. **Usuário abre chat** → `ChatWindow` marca mensagens como lidas (Batch Update)
5. **Firestore atualiza** → Query detecta `read: true` → Contador = 0
6. **Bolinha some** → Atualização em tempo real

---

## 🔍 Verificações Pós-Deploy

### ✅ Checklist:

- [ ] Função aparece no Firebase Console (Functions > onMessageCreated)
- [ ] Logs mostram execução quando mensagem é enviada
- [ ] Notificação push chega no dispositivo do destinatário
- [ ] Bolinha vermelha aparece quando há mensagem não lida
- [ ] Bolinha vermelha some ao abrir o chat

### 📊 Como Verificar:

1. **Ver função no Console**:
   - https://console.firebase.google.com/project/apexfit-pro/functions

2. **Ver logs**:
   ```bash
   firebase functions:log --only onMessageCreated
   ```

3. **Testar**:
   - Enviar mensagem pelo app
   - Verificar se destinatário recebe notificação
   - Verificar se bolinha aparece/some corretamente

---

## 📝 Estrutura de Dados Necessária

### `users/{userId}`:
```javascript
{
  name: "Nome do Usuário",        // ✅ Usado no título da notificação
  fcmToken: "token_fcm_aqui",     // ✅ OBRIGATÓRIO para receber notificações
  fcmTokenUpdatedAt: Timestamp
}
```

### `messages/{messageId}`:
```javascript
{
  senderId: "uid_remetente",      // ✅ OBRIGATÓRIO
  receiverId: "uid_destinatario", // ✅ OBRIGATÓRIO
  text: "Mensagem...",            // Opcional
  imageUrl: "url...",             // Opcional
  timestamp: Timestamp,
  read: false                     // ✅ Usado para bolinha vermelha
}
```

---

## 🐛 Troubleshooting

### Notificações não chegam?
1. Verificar se `fcmToken` está salvo em `users/{userId}`
2. Verificar logs: `firebase functions:log`
3. Verificar permissões de notificação no navegador

### Bolinha não aparece?
1. Verificar índice do Firestore (veja `FIRESTORE_INDEXES.md`)
2. Verificar console do navegador para erros
3. Verificar se `read: false` está sendo salvo corretamente

### Função não aciona?
1. Verificar se função está deployada no Console
2. Verificar estrutura da mensagem (`senderId`, `receiverId`)
3. Verificar logs de erro

---

## 📚 Documentação Adicional

- **Configuração completa**: `CLOUD_FUNCTIONS_SETUP.md`
- **Comandos de deploy**: `DEPLOY_COMMANDS.md`
- **Índices Firestore**: `FIRESTORE_INDEXES.md`

---

**Migração completa! Agora as notificações são enviadas via Cloud Functions (Backend V1) 🎉**


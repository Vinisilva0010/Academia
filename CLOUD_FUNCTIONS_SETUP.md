# 🚀 Configuração de Cloud Functions para Notificações Push

## 📋 Visão Geral

Esta documentação explica como configurar e fazer deploy das Cloud Functions para enviar notificações push automaticamente quando uma nova mensagem é criada no chat.

## 🎯 O que foi implementado

### 1. Função `onMessageCreated`
- **Gatilho**: Quando uma nova mensagem é criada na coleção `messages/{messageId}`
- **Ação**: Envia notificação push para o destinatário usando FCM
- **Dados utilizados**:
  - `receiverId`: Busca FCM token na coleção `users`
  - `senderId`: Busca nome do remetente na coleção `users`
  - `text` ou `imageUrl`: Conteúdo da mensagem

### 2. Payload da Notificação
```javascript
{
  title: "💬 Nova mensagem de [Nome do Remetente]",
  body: "[Texto da mensagem]" ou "📷 Enviou uma imagem",
  icon: "/icons/icon-192x192.png",
  data: {
    type: "message",
    messageId: "...",
    senderId: "...",
    receiverId: "..."
  }
}
```

## 📁 Estrutura Criada

```
functions/
├── package.json       # Dependências e scripts
├── index.js          # Função onMessageCreated
├── .gitignore        # Ignorar node_modules
└── .eslintrc.js      # Configuração ESLint

firebase.json          # Configuração do Firebase CLI
```

## 🔧 Pré-requisitos

1. **Node.js 18+** instalado
2. **Firebase CLI** instalado globalmente:
   ```bash
   npm install -g firebase-tools
   ```
3. **Login no Firebase**:
   ```bash
   firebase login
   ```
4. **Projeto Firebase configurado**:
   ```bash
   firebase use --add
   # Selecione seu projeto (apexfit-pro)
   ```

## 📦 Instalação

### 1. Instalar dependências das Functions

```bash
cd functions
npm install
cd ..
```

### 2. Verificar configuração do Firebase

Certifique-se de que o `firebase.json` está na raiz do projeto com:
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

## 🚀 Deploy

### Deploy completo das Functions

```bash
firebase deploy --only functions
```

### Deploy de uma função específica

```bash
firebase deploy --only functions:onMessageCreated
```

### Ver logs em tempo real

```bash
firebase functions:log
```

### Ver logs de uma função específica

```bash
firebase functions:log --only onMessageCreated
```

## 🧪 Testes Locais (Opcional)

Para testar localmente antes do deploy:

```bash
# Instalar Firebase Emulator
npm install -g firebase-tools

# Iniciar emulador
cd functions
npm run serve
```

## ✅ Verificação Pós-Deploy

1. **Verificar se a função foi criada**:
   - Acesse: https://console.firebase.google.com/project/apexfit-pro/functions
   - Deve aparecer `onMessageCreated`

2. **Testar envio de mensagem**:
   - Envie uma mensagem pelo app
   - Verifique os logs: `firebase functions:log --only onMessageCreated`
   - O destinatário deve receber a notificação push

3. **Verificar logs**:
   ```bash
   firebase functions:log
   ```
   Procure por:
   - `[onMessageCreated] Nova mensagem criada: ...`
   - `[onMessageCreated] ✅ Notificação enviada com sucesso`

## 🔍 Troubleshooting

### Erro: "Permission denied"
```bash
# Fazer login novamente
firebase login

# Verificar projeto atual
firebase use

# Selecionar projeto correto
firebase use apexfit-pro
```

### Erro: "Functions directory does not exist"
```bash
# Certifique-se de estar na raiz do projeto
cd /caminho/para/Apexfit

# Verificar estrutura
ls functions/
```

### Notificações não estão chegando

1. **Verificar se o token FCM está salvo**:
   - Firestore > `users/{userId}` > Verificar campo `fcmToken`

2. **Verificar logs da função**:
   ```bash
   firebase functions:log --only onMessageCreated
   ```

3. **Verificar permissões do Firebase**:
   - Firebase Console > Cloud Messaging > Verificar configurações
   - Certifique-se de que FCM está habilitado

4. **Verificar Service Worker**:
   - O app deve ter permissão de notificações
   - Service Worker deve estar registrado

### Função não está sendo acionada

1. **Verificar triggers**:
   - Firebase Console > Functions > Ver se `onMessageCreated` está ativa

2. **Verificar estrutura da mensagem**:
   - Firestore > `messages/{messageId}` > Verificar campos `senderId` e `receiverId`

## 📝 Estrutura de Dados Necessária

### Coleção `users/{userId}`
```javascript
{
  name: "Nome do Usuário",        // Usado no título da notificação
  fcmToken: "token...",            // OBRIGATÓRIO para receber notificações
  fcmTokenUpdatedAt: Timestamp
}
```

### Coleção `messages/{messageId}`
```javascript
{
  senderId: "uid_remetente",       // OBRIGATÓRIO
  receiverId: "uid_destinatario",  // OBRIGATÓRIO
  text: "Mensagem...",             // Opcional se tiver imageUrl
  imageUrl: "url...",              // Opcional se tiver text
  timestamp: Timestamp,
  read: false
}
```

## 🔒 Segurança

A função usa `firebase-admin` que tem acesso total ao Firestore. Não é necessário configurar credenciais manualmente - o Firebase CLI gerencia isso automaticamente.

## 📊 Monitoramento

### Métricas no Firebase Console
- Acesse: Firebase Console > Functions > Métricas
- Veja: Execuções, erros, latência

### Logs estruturados
A função já inclui logs detalhados:
- `[onMessageCreated] Nova mensagem criada`
- `[onMessageCreated] ✅ Notificação enviada com sucesso`
- `[onMessageCreated] ❌ Erro ao processar mensagem`

## 🔄 Atualização

Para atualizar a função após mudanças:

```bash
# Editar functions/index.js
# Fazer deploy novamente
firebase deploy --only functions:onMessageCreated
```

## 💰 Custos

Cloud Functions tem um tier gratuito generoso:
- **Primeiros 2 milhões de invocações/mês**: Grátis
- **2GB de egresso/mês**: Grátis

Para projetos pequenos/médios, geralmente fica dentro do tier gratuito.

---

## ✅ Checklist de Deploy

- [ ] Node.js 18+ instalado
- [ ] Firebase CLI instalado
- [ ] Login no Firebase feito (`firebase login`)
- [ ] Projeto selecionado (`firebase use apexfit-pro`)
- [ ] Dependências instaladas (`cd functions && npm install`)
- [ ] Deploy executado (`firebase deploy --only functions`)
- [ ] Função aparece no Firebase Console
- [ ] Teste: Enviar mensagem e verificar notificação
- [ ] Logs verificados (`firebase functions:log`)

---

**Pronto! As notificações push agora são enviadas automaticamente via Cloud Functions! 🎉**


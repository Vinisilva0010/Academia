# 🚀 Comandos de Deploy - Cloud Functions

## ⚡ Comandos Rápidos

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

### 5. Deploy das Functions
```bash
firebase deploy --only functions
```

### 6. Ver Logs em Tempo Real
```bash
firebase functions:log
```

### 7. Ver Logs de uma Função Específica
```bash
firebase functions:log --only onMessageCreated
```

---

## 📋 Sequência Completa (Primeira Vez)

Execute estes comandos na ordem:

```bash
# 1. Instalar Firebase CLI globalmente
npm install -g firebase-tools

# 2. Fazer login
firebase login

# 3. Selecionar projeto (na raiz do projeto Apexfit)
firebase use --add
# Selecione: apexfit-pro

# 4. Instalar dependências das functions
cd functions
npm install
cd ..

# 5. Fazer deploy
firebase deploy --only functions

# 6. Verificar logs
firebase functions:log
```

---

## 🔄 Atualizar Functions (Após Mudanças)

```bash
# 1. Editar functions/index.js conforme necessário

# 2. Fazer deploy novamente
firebase deploy --only functions

# Ou deploy de função específica
firebase deploy --only functions:onMessageCreated
```

---

## 🧪 Testar Localmente (Opcional)

```bash
# Na pasta functions
cd functions

# Iniciar emulador
npm run serve

# Em outro terminal, simular criação de mensagem
# (use o Firebase Console ou seu app)
```

---

## ✅ Verificar Status

### Ver funções deployadas
```bash
firebase functions:list
```

### Ver projeto atual
```bash
firebase use
```

### Ver informações do projeto
```bash
firebase projects:list
```

---

## 🐛 Troubleshooting

### Erro: "Permission denied"
```bash
firebase login --reauth
```

### Erro: "Project not found"
```bash
firebase use --add
# Selecione o projeto correto
```

### Erro: "Functions directory does not exist"
```bash
# Certifique-se de estar na raiz do projeto
pwd
# Deve mostrar: .../Apexfit

# Verificar se functions/ existe
ls functions/
```

---

## 📝 Notas Importantes

1. **Primeiro deploy pode demorar** alguns minutos
2. **Verifique os logs** após o deploy para confirmar sucesso
3. **Teste enviando uma mensagem** pelo app após o deploy
4. **O Firebase CLI gerencia credenciais automaticamente** - não precisa configurar chaves manualmente

---

**Pronto para fazer deploy! Execute os comandos na ordem acima.** 🚀


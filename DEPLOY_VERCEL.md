# 🚀 Guia de Deploy no Vercel

Este guia explica como fazer deploy do ApexFit Pro no Vercel com as variáveis de ambiente do Firebase configuradas corretamente.

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Repositório no GitHub (já configurado)
3. Projeto Firebase configurado

## 🔑 Passo 1: Configurar Variáveis de Ambiente no Vercel

### Opção A: Via Dashboard da Vercel (Recomendado)

1. **Acesse o Dashboard da Vercel**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login com sua conta

2. **Importe o Projeto**
   - Clique em "Add New..." → "Project"
   - Conecte seu repositório GitHub `Vinisilva0010/Academia`
   - Clique em "Import"

3. **Configure as Variáveis de Ambiente**
   - Na página de configuração do projeto, vá até a seção **"Environment Variables"**
   - Adicione cada variável uma por uma:

   | Nome da Variável | Valor |
   |-----------------|-------|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyDtX7wRTzktqhYKO1L3_OnO0vgWhV7BUWc` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `apexfit-pro.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `apexfit-pro` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `apexfit-pro.firebasestorage.app` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `83621648258` |
   | `VITE_FIREBASE_APP_ID` | `1:83621648258:web:d56d0600de8e9bfd22a19b` |

   **⚠️ IMPORTANTE:**
   - Certifique-se de que todas as variáveis estão marcadas para **Production**, **Preview** e **Development**
   - Clique em "Add" após cada variável

4. **Configurações de Build**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar
   - Seu site estará disponível em `https://seu-projeto.vercel.app`

### Opção B: Via Vercel CLI (Avançado)

1. **Instale o Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login na Vercel**
   ```bash
   vercel login
   ```

3. **Adicione as Variáveis de Ambiente**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   vercel env add VITE_FIREBASE_APP_ID
   ```
   
   Quando solicitado, insira o valor de cada variável e selecione os ambientes (Production, Preview, Development).

4. **Faça o Deploy**
   ```bash
   vercel --prod
   ```

## 🔒 Passo 2: Configurar Domínio Personalizado (Opcional)

1. No dashboard do projeto Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme as instruções da Vercel

## ✅ Passo 3: Verificar o Deploy

Após o deploy, verifique:

1. ✅ O site carrega corretamente
2. ✅ O Firebase está conectado (verifique no console do navegador)
3. ✅ Autenticação funciona (tente fazer login)
4. ✅ Firestore está funcionando (crie um usuário de teste)

## 🔧 Troubleshooting

### Erro: "Firebase: Error (auth/invalid-api-key)"
- **Solução:** Verifique se todas as variáveis de ambiente foram adicionadas corretamente no Vercel
- Certifique-se de que os valores estão corretos (sem espaços extras)

### Erro: "Environment variables are not defined"
- **Solução:** 
  - Verifique se as variáveis começam com `VITE_` (obrigatório para Vite)
  - Faça um novo deploy após adicionar as variáveis
  - Limpe o cache do build: Settings → Clear Build Cache → Clear

### Build falha
- **Solução:** 
  - Verifique os logs de build no dashboard da Vercel
  - Certifique-se de que o `package.json` tem todas as dependências
  - Execute `npm run build` localmente para verificar erros

## 📝 Notas Importantes

- **Segurança:** As variáveis de ambiente no Vercel são criptografadas e seguras
- **Variáveis VITE_:** Apenas variáveis que começam com `VITE_` são expostas ao cliente no Vite
- **Re-deploy:** Após adicionar/modificar variáveis, é necessário fazer um novo deploy
- **Ambientes:** Configure as variáveis para Production, Preview e Development se quiser que funcionem em todos os ambientes

## 🎯 Próximos Passos

1. Configure regras de segurança no Firebase (Firestore Rules)
2. Configure domínio personalizado (se desejar)
3. Configure analytics (opcional)
4. Configure CI/CD para deploy automático a cada push

---

**Precisa de ajuda?** Consulte a [documentação oficial da Vercel](https://vercel.com/docs)


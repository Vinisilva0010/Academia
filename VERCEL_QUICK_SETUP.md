# ⚡ Configuração Rápida - Vercel

## 📝 Variáveis de Ambiente Necessárias

Quando estiver configurando no Vercel, adicione estas **6 variáveis de ambiente**:

```
VITE_FIREBASE_API_KEY=AIzaSyDtX7wRTzktqhYKO1L3_OnO0vgWhV7BUWc
VITE_FIREBASE_AUTH_DOMAIN=apexfit-pro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=apexfit-pro
VITE_FIREBASE_STORAGE_BUCKET=apexfit-pro.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=83621648258
VITE_FIREBASE_APP_ID=1:83621648258:web:d56d0600de8e9bfd22a19b
```

## 🚀 Passo a Passo no Vercel

1. **Importe o Projeto**
   - Vá em [vercel.com](https://vercel.com)
   - Clique em "Add New Project"
   - Conecte o repositório `Vinisilva0010/Academia`

2. **Configure o Build**
   - Framework Preset: **Vite** (será detectado automaticamente)
   - Build Command: `npm run build` (padrão)
   - Output Directory: `dist` (padrão)

3. **Adicione as Variáveis de Ambiente**
   - Na seção "Environment Variables", clique em "Add"
   - Adicione cada variável acima
   - ✅ Marque para: Production, Preview e Development
   - Clique em "Add" após cada uma

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar (~2 minutos)
   - Pronto! 🎉

## ⚠️ Importante

- Todas as variáveis **DEVEM** começar com `VITE_` (requisito do Vite)
- Após adicionar as variáveis, faça um novo deploy se necessário
- O arquivo `.env` não deve ser commitado no Git (já está no .gitignore)

## 📚 Documentação Completa

Para mais detalhes, consulte [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)


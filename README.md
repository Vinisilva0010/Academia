# ApexFit Pro

Web App de consultoria fitness desenvolvido com React, Tailwind CSS e Firebase.

## 🚀 Tecnologias

- **Vite** - Build tool
- **React** - Biblioteca UI
- **Tailwind CSS** - Framework CSS
- **React Router Dom** - Roteamento
- **Firebase v9** - Backend (Auth, Firestore, Storage)
- **Lucide React** - Ícones

## 📦 Instalação

```bash
npm install
```

## 🔥 Configuração do Firebase

### Desenvolvimento Local

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e adicione suas credenciais do Firebase:
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key_aqui
   VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain_aqui
   VITE_FIREBASE_PROJECT_ID=seu_project_id_aqui
   VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket_aqui
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id_aqui
   VITE_FIREBASE_APP_ID=seu_app_id_aqui
   ```

### Deploy no Vercel

Consulte o guia completo em [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) para instruções detalhadas sobre como configurar as variáveis de ambiente no Vercel.

## 🏃 Executar

```bash
npm run dev
```

## 🎨 Design System

- **Fundo**: Pure Black (#000000)
- **Cards**: Zinc-900 com bordas Zinc-800
- **Cores de Destaque**: Neon Blue (#3b82f6) e Neon Green (#22c55e)
- **Tipografia**: Sans-serif, títulos em uppercase e bold




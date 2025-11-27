# Configuração do Firebase Storage - Regras de Segurança

## ⚠️ ERRO DE CORS NO UPLOAD DE IMAGENS

O erro de CORS está bloqueando o upload de imagens. Isso acontece porque as regras de segurança do Firebase Storage não estão configuradas corretamente.

## 🔧 Como Corrigir

### 1. Acesse o Firebase Console
1. Vá para: https://console.firebase.google.com/
2. Selecione o projeto `apexfit-pro`

### 2. Configure as Regras do Storage
1. No menu lateral, clique em **Storage**
2. Clique na aba **Rules** (Regras)
3. Substitua as regras existentes por:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir upload de imagens de chat para usuários autenticados
    match /chat_images/{userId}/{allPaths=**} {
      // Permitir leitura e escrita apenas para o próprio usuário
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regra padrão: negar acesso não autenticado
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Publique as Regras
1. Clique no botão **Publish** (Publicar)
2. Aguarde a confirmação de que as regras foram atualizadas

### 4. Verifique as Regras
As regras permitem:
- ✅ Usuários autenticados podem ler imagens de chat
- ✅ Usuários autenticados podem fazer upload apenas na sua própria pasta (`chat_images/{userId}/`)
- ✅ Bloqueia acesso não autenticado

## 📋 Regras Explicadas

- `match /chat_images/{userId}/{allPaths=**}`: Define regras para a pasta de imagens de chat
- `allow read: if request.auth != null`: Permite leitura para qualquer usuário autenticado
- `allow write: if request.auth != null && request.auth.uid == userId`: Permite upload apenas na própria pasta do usuário
- `match /{allPaths=**}`: Bloqueia acesso a todas as outras pastas

## ⚠️ Importante

Se você ainda receber erros de CORS após configurar as regras:
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Certifique-se de que o usuário está autenticado
3. Verifique se o Firebase Auth está configurado corretamente




# Configuração do Firestore para ApexFit Pro

## Estrutura da Coleção `users`

Cada documento na coleção `users` deve ter a seguinte estrutura:

```javascript
{
  email: string,           // Email do usuário
  role: 'admin' | 'client', // OBRIGATÓRIO: Role do usuário
  name: string,            // Opcional: Nome do usuário
  createdAt: Timestamp,    // Criado automaticamente
  updatedAt: Timestamp     // Atualizado automaticamente
}
```

## Criando Usuários Manualmente no Firebase Console

### Passo 1: Criar usuário de autenticação
1. Vá para Firebase Console > Authentication
2. Clique em "Adicionar usuário"
3. Crie o usuário com email e senha
4. Anote o **UID** do usuário criado

### Passo 2: Criar documento no Firestore
1. Vá para Firebase Console > Firestore Database
2. Crie uma coleção chamada `users` (se não existir)
3. Crie um documento com o **UID** como ID do documento
4. Adicione os seguintes campos:

**Para um Admin (Personal):**
```json
{
  "email": "personal@apexfit.com",
  "role": "admin",
  "name": "Nome do Personal",
  "createdAt": [Timestamp - use o botão de timestamp]
}
```

**Para um Client (Aluno):**
```json
{
  "email": "aluno@apexfit.com",
  "role": "client",
  "name": "Nome do Aluno",
  "createdAt": [Timestamp - use o botão de timestamp]
}
```

## Regras de Segurança do Firestore (Recomendado)

Adicione estas regras no Firestore para garantir segurança:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para coleção de usuários
    match /users/{userId} {
      // Usuário pode ler apenas seu próprio documento
      allow read: if request.auth != null && request.auth.uid == userId;
      // Apenas admins podem escrever
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Adicione outras regras conforme necessário
  }
}
```

## Exemplo de Criação de Usuário via Código

Você pode usar a função utilitária criada em `src/utils/firestore.js`:

```javascript
import { createOrUpdateUser } from '../utils/firestore'

// Após criar o usuário no Authentication
const result = await createOrUpdateUser(user.uid, {
  email: user.email,
  role: 'admin', // ou 'client'
  name: 'Nome do Usuário'
})
```

## Notas Importantes

⚠️ **IMPORTANTE**: O campo `role` é OBRIGATÓRIO e deve ser exatamente `'admin'` ou `'client'`.

⚠️ Certifique-se de que o documento do usuário no Firestore tenha o mesmo UID que o usuário na Authentication.




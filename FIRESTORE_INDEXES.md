# 🔧 Índices Necessários no Firestore para o Chat

O chat precisa de índices compostos para funcionar corretamente. Se você ver erros no console sobre `failed-precondition`, significa que precisa criar estes índices.

## Como Criar os Índices

### Opção 1: Via Firebase Console (Recomendado)

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Firestore Database** > **Índices**
4. Clique em **Criar Índice**
5. Crie os seguintes índices:

#### Índice 1: Conversas entre Usuários

- **Coleção**: `messages`
- **Campos**:
  - `senderId` (Ascending)
  - `receiverId` (Ascending)
  - `timestamp` (Ascending)
- **Query Scope**: Collection

#### Índice 2: Mensagens Não Lidas

- **Coleção**: `messages`
- **Campos**:
  - `receiverId` (Ascending)
  - `read` (Ascending)
  - `timestamp` (Descending)
- **Query Scope**: Collection

### Opção 2: Via Link de Erro no Console

Quando o chat der erro, o console do navegador mostrará um link direto para criar o índice necessário. Clique no link e ele abrirá a página de criação do índice automaticamente.

## Verificação

Após criar os índices, aguarde alguns minutos para eles serem construídos. Você pode verificar o status na aba **Índices** do Firestore.

## Problemas Comuns

### Erro: "failed-precondition"
- **Causa**: Índice composto não criado
- **Solução**: Crie o índice conforme instruções acima

### Mensagens não aparecem
- Verifique se os IDs estão corretos (admin e client)
- Verifique os logs no console do navegador
- Certifique-se de que os índices foram criados e estão ativos




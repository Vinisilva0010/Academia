# Configuração de Índices do Firestore

## ⚠️ Índice Composto Necessário

O Firestore precisa de um índice composto para buscar mensagens não lidas. O Firebase geralmente cria automaticamente, mas você pode criar manualmente.

## 🔧 Como Criar o Índice

### Opção 1: Link Automático (Recomendado)

1. Quando você receber o erro no console do navegador, procure por um link similar a:
   ```
   https://console.firebase.google.com/v1/r/project/apexfit-pro/firestore/indexes?create_composite=...
   ```
2. Clique no link - ele abrirá o Firebase Console com o índice pré-configurado
3. Clique em **Create Index** (Criar Índice)
4. Aguarde alguns minutos para o índice ser criado

### Opção 2: Criar Manualmente

1. Acesse: https://console.firebase.google.com/project/apexfit-pro/firestore/indexes
2. Clique em **Create Index** (Criar Índice)
3. Configure:
   - **Collection ID**: `messages`
   - **Fields to index**:
     - Campo: `receiverId`
       - Ordem: Ascending
     - Campo: `read`
       - Ordem: Ascending
     - Campo: `timestamp`
       - Ordem: Descending
   - **Query scope**: Collection
4. Clique em **Create** (Criar)

## 📋 Outros Índices Necessários

### Índice para Conversas
Se ainda não criou, também precisa:

**Collection**: `messages`
**Fields**:
- `senderId` (Ascending)
- `receiverId` (Ascending)
- `timestamp` (Ascending)

**Collection**: `messages`
**Fields**:
- `receiverId` (Ascending)
- `read` (Ascending)
- `timestamp` (Descending)

## ⏱️ Tempo de Criação

Os índices geralmente levam de 2 a 5 minutos para serem criados. Você pode continuar usando o app, mas as queries com índices faltantes mostrarão erros até estarem prontos.

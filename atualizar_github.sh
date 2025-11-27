#!/bin/bash

echo "===================================="
echo "Atualizando repositório no GitHub..."
echo "===================================="
echo ""

echo "[1/4] Adicionando todas as mudanças..."
git add -A
echo ""

echo "[2/4] Verificando status..."
git status
echo ""

echo "[3/4] Fazendo commit..."
git commit -m "feat: Melhora logs e tratamento de erros na Cloud Function - Adiciona logs detalhados para debug - Remove tokens inválidos automaticamente - Valida formato do token FCM"
echo ""

echo "[4/4] Enviando para GitHub..."
git push origin main
echo ""

echo "===================================="
echo "Concluído! Verifique no GitHub."
echo "===================================="


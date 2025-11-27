@echo off
chcp 65001 >nul
echo ========================================
echo   ATUALIZANDO REPOSITÓRIO NO GITHUB
echo ========================================
echo.
echo Repositório: https://github.com/Vinisilva0010/Academia.git
echo.

echo [PASSO 1/4] Verificando status atual...
git status
echo.
pause

echo [PASSO 2/4] Adicionando todas as mudanças...
git add -A
echo ✓ Mudanças adicionadas
echo.

echo [PASSO 3/4] Fazendo commit...
git commit -m "feat: Melhora logs e tratamento de erros na Cloud Function de notificacoes push"
echo ✓ Commit realizado
echo.

echo [PASSO 4/4] Enviando para GitHub...
git push origin main
echo.
echo ========================================
echo   VERIFIQUE SE HOUVE ERROS ACIMA
echo ========================================
echo.
echo Se deu erro, verifique:
echo 1. Você está logado no GitHub?
echo 2. Tem permissão para fazer push?
echo 3. O repositório está correto?
echo.
pause


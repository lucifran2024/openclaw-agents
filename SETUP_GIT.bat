@echo off
echo --- SETUP INICIAL DO GIT (RODAR APENAS UMA VEZ) ---
echo.
echo 1. Inicializando repositorio Git...
git init
echo.
echo 2. Conectando com a VPS (187.77.42.107)...
git remote add vps ssh://root@187.77.42.107/docker/openclaw-dr21/data/.openclaw
echo.
echo 3. Baixando arquivos da VPS (Pode pedir senha ou confirmacao 'yes')...
git fetch vps
echo.
echo 4. Sincronizando arquivos locais com o servidor...
git reset --hard vps/master
git branch --set-upstream-to=vps/master master
echo.
echo --- SETUP CONCLUIDO COM SUCESSO! ---
echo Agora voce pode usar os scripts SYNC normalmente.
pause

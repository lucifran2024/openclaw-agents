@echo off
echo --- ENVIANDO (PC PARA VPS) ---
git add .
set /p msg="Mensagem do backup: "
if "%msg%"=="" set msg="Atualizacao automatica"
git commit -m "%msg%"
git push origin master
echo.
echo TUDO ENVIADO PARA O SERVIDOR!
pause

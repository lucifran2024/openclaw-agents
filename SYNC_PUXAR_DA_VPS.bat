@echo off
setlocal
echo --- SINCRONIZANDO (BAIXANDO DA VPS PARA O PC) ---
echo.
git fetch vps
if errorlevel 1 goto :fail
echo.
echo STATUS LOCAL ANTES DO RESET:
git status --short --branch
echo.
set /p confirm="Isto vai sobrescrever alteracoes locais com vps/master. Continuar? (s/N): "
if /I not "%confirm%"=="s" if /I not "%confirm%"=="sim" goto :abort
git reset --hard vps/master
if errorlevel 1 goto :fail
git branch --set-upstream-to=vps/master master
echo.
echo TUDO ATUALIZADO DO SERVIDOR!
goto :end

:abort
echo.
echo Operacao cancelada. Nenhuma alteracao aplicada.
goto :end

:fail
echo.
echo Falha na sincronizacao. Revise o erro acima.

:end
pause
endlocal
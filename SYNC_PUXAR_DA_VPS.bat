@echo off
setlocal
echo --- SINCRONIZANDO (BAIXANDO DA origin PARA O PC) ---
echo.
git fetch origin
if errorlevel 1 goto :fail
echo.
echo STATUS LOCAL ANTES DO RESET:
git status --short --branch
echo.
set /p confirm="Isto vai sobrescrever alteracoes locais com origin/master. Continuar? (s/N): "
if /I not "%confirm%"=="s" if /I not "%confirm%"=="sim" goto :abort
git reset --hard origin/master
if errorlevel 1 goto :fail
git branch --set-upstream-to=origin/master master
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

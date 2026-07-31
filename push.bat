@echo off
cd /d "%~dp0"

echo === Estado ===
git status
echo.

set /p MSG="Mensaje del commit (Enter = update): "
if "%MSG%"=="" set MSG=update

echo.
echo === Add + commit ===
git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo No hay cambios para commit o fallo el commit.
)

echo.
echo === Push origin main ===
git push -u origin main

echo.
echo Listo.
pause

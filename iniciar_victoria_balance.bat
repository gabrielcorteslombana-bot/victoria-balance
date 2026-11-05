@echo off
title Victoria Balance Launcher
color 0D
echo ========================================================
echo          INICIANDO VICTORIA BALANCE v2.0.0
echo ========================================================
echo.
echo [1/2] Iniciando Servidor Backend API (Puerto 5000)...
start "Victoria Balance - Servidor Backend" cmd /k "cd /d C:\Users\jesus.cortes\Downloads\victoria-balance\server && npm run dev"

echo [2/2] Iniciando Aplicacion Web Frontend (Puerto 5173)...
start "Victoria Balance - Frontend Web" cmd /k "cd /d C:\Users\jesus.cortes\Downloads\victoria-balance\client && npx vite --host"

echo.
echo ========================================================
echo   Listo! Abre en tu navegador: http://localhost:5173
echo   (No cierres las ventanas de comando minimizadas)
echo ========================================================
echo.
pause

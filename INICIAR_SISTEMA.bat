@echo off
echo.
echo ===============================================
echo  Sistema ERP Marmoraria
echo ===============================================
echo.
echo [1/3] Iniciando Backend...
cd backend
start cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Iniciando Frontend...
cd ..
start cmd /k "npm run dev"

echo.
echo [3/3] Sistema iniciado!
echo.
echo ===============================================
echo  Aguarde alguns segundos e acesse:
echo  Frontend: http://localhost:5173
echo  Backend: http://localhost:5000
echo ===============================================
echo.
pause


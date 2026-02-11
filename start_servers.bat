@echo off
setlocal

echo ===================================================
echo Starting Project Servers...
echo ===================================================

:: Activate Virtual Environment if available in root
if exist ".venv\Scripts\activate.bat" (
    echo Activating Virtual Environment...
    call .venv\Scripts\activate.bat
)

:: Start Backend
if exist "backend\app.py" (
    echo Starting Backend - Flask on Port 5001...
    start "Backend Server" cmd /k "if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) & python backend/app.py"
) else (
    echo Error: backend/app.py not found!
    pause
    exit /b
)

:: Wait a moment for backend to initialize
timeout /t 5 >nul

:: Start Frontend
if exist "frontend\index.html" (
    echo Starting Frontend - HTTP Server on Port 5500...
    start "Frontend Server" cmd /k "cd frontend & python -m http.server 5500"
    
    :: Open Browser
    echo Opening Application in Browser...
    timeout /t 2 >nul
    start http://localhost:5500/index.html
) else (
    echo Error: frontend/index.html not found!
    pause
    exit /b
)

echo ===================================================
echo Servers are running!
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:5500
echo ===================================================

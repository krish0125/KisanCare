@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo   Starting KisanCare (Frontend + Backend)
echo ===================================================

if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe run.py
) else if exist "Collage Project 2026-27\.venv\Scripts\python.exe" (
    "Collage Project 2026-27\.venv\Scripts\python.exe" run.py
) else (
    python run.py
)

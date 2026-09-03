@echo off
chcp 65001 > nul

start "EduAI Backend (FastAPI)" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 2 > nul


cd frontend
start "EduAI Frontend (Vite)" cmd /k "npm.cmd run dev"

echo.
echo ========================================================
echo   Started Successfully!
echo   Open your browser at: http://localhost:5173
echo ========================================================

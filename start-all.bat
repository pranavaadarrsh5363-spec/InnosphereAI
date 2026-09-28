@echo off
title InnoSphere AI - Unified Launcher
echo ========================================================
echo   🚀 Launching InnoSphere AI Full-Stack Platform
echo ========================================================
echo.
echo [1/2] Launching FastAPI Backend on http://localhost:8000 ...
start "InnoSphere AI Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Launching Next.js Frontend on http://localhost:3000 ...
start "InnoSphere AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   ✅ Both services started in dedicated terminal windows!
echo   👉 Frontend App: http://localhost:3000
echo   👉 Backend Docs: http://localhost:8000/docs
echo ========================================================
pause

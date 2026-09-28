@echo off
title InnoSphere AI - Backend Service
cd backend
echo Starting InnoSphere AI FastAPI Backend on http://localhost:8000 ...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause

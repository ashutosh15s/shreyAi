@echo off
echo ========================================================
echo   Starting Shrey AI Services
echo ========================================================

echo [1/2] Starting Python FastAPI AI Microservice on Port 8000...
start "Shrey AI - Python Engine (Port 8000)" cmd /k "cd /d %~dp0Ai && .\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Spring Boot Gateway on Port 8080...
start "Shrey AI - Spring Boot Gateway (Port 8080)" cmd /k "cd /d %~dp0backend && java -jar target\backend-0.0.1-SNAPSHOT.jar"

echo Services started in separate windows!
pause

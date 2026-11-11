@echo off
echo ========================================================
echo   Starting Shrey AI Services
echo ========================================================

echo [1/2] Starting Python AI Microservice with UV (Port 8000)...
start "Shrey AI - Python Engine (uv)" cmd /k "cd /d %~dp0Ai && uv run main.py"

echo [2/2] Starting Spring Boot Gateway with Java (Port 8080)...
start "Shrey AI - Spring Boot Gateway (java)" cmd /k "cd /d %~dp0backend && java -jar target\backend-0.0.1-SNAPSHOT.jar"

echo Services started in separate windows!
pause

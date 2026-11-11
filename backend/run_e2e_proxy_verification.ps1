$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SHREY AI: STARTING END-TO-END GATEWAY INTEGRATION SUITE  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Pre-clean ports 8000 and 8080
Get-NetTCPConnection -LocalPort 8000, 8080 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# 1. Start FastAPI AI microservice on 8000
Write-Host "[1/3] Starting FastAPI AI Microservice on http://127.0.0.1:8000..." -ForegroundColor Green
$fastApiProcess = Start-Process -FilePath "c:\Users\Dell\Desktop\projects\shrey_Ai\Ai\.venv\Scripts\uvicorn.exe" `
    -ArgumentList "main:app --host 127.0.0.1 --port 8000" `
    -WorkingDirectory "c:\Users\Dell\Desktop\projects\shrey_Ai\Ai" `
    -PassThru

# 2. Start Spring Boot Gateway on 8080 via compiled JAR
Write-Host "[2/3] Starting Spring Boot Gateway on http://127.0.0.1:8080 (via JAR)..." -ForegroundColor Green
$springProcess = Start-Process -FilePath "java.exe" `
    -ArgumentList "-jar target\backend-0.0.1-SNAPSHOT.jar" `
    -WorkingDirectory "c:\Users\Dell\Desktop\projects\shrey_Ai\backend" `
    -PassThru

try {
    # 3. Run the automated Python integration tester
    Write-Host "[3/3] Running Python test runner to verify 7 proxy routes..." -ForegroundColor Green
    Set-Location -Path "c:\Users\Dell\Desktop\projects\shrey_Ai\backend"
    & "c:\Users\Dell\Desktop\projects\shrey_Ai\Ai\.venv\Scripts\python.exe" "test_ai_proxy_integration.py"
}
finally {
    Write-Host "`n[CLEANUP] Stopping background services..." -ForegroundColor Yellow
    if ($fastApiProcess -and -not $fastApiProcess.HasExited) {
        Stop-Process -Id $fastApiProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($springProcess -and -not $springProcess.HasExited) {
        # Spring Boot runs under a Java child process spawned by Maven
        Stop-Process -Id $springProcess.Id -Force -ErrorAction SilentlyContinue
    }
    # Clean up any child processes bound to 8000 or 8080
    Get-NetTCPConnection -LocalPort 8000, 8080 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[CLEANUP] All service processes terminated cleanly." -ForegroundColor Yellow
}


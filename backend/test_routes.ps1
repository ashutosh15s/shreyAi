# ==============================================================
# Shrey AI Backend - Automated Route & Endpoint Testing Script
# ==============================================================

param(
    [string]$BaseUrl = "http://localhost:8080"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Testing Shrey AI Backend API Endpoints at $BaseUrl" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

function Assert-Step([string]$name, [string]$response, [string]$match) {
    if ($response -match $match) {
        Write-Host " [PASS] $name" -ForegroundColor Green
        return $true
    } else {
        Write-Host " [FAIL] $name" -ForegroundColor Red
        Write-Host " Response: $response" -ForegroundColor DarkGray
        return $false
    }
}

# 1. Health Check
Write-Host "`n1. Testing Actuator Health..." -ForegroundColor Yellow
$health = curl.exe -s -X GET "$BaseUrl/actuator/health"
Assert-Step "Health Endpoint" $health '"status":"UP"'

# 2. Register
$randomId = Get-Random -Minimum 1000 -Maximum 9999
$email = "testuser$randomId@shrey.ai"
$password = "Secret123!"

Write-Host "`n2. Testing User Registration ($email)..." -ForegroundColor Yellow
$regPayload = (@{ name = "Test User $randomId"; email = $email; password = $password } | ConvertTo-Json -Compress).Replace('"', '\"')
$regResp = curl.exe -s -X POST "$BaseUrl/api/auth/register" -H "Content-Type: application/json" -d "{`"name`":`"Test User $randomId`",`"email`":`"$email`",`"password`":`"$password`"}"
Assert-Step "Registration" $regResp '"success":true'

# Extract token
$token = ""
$refreshToken = ""
if ($regResp -match '"token":"([^"]+)"') { $token = $matches[1] }
if ($regResp -match '"refreshToken":"([^"]+)"') { $refreshToken = $matches[1] }

# 3. Login
Write-Host "`n3. Testing Login..." -ForegroundColor Yellow
$loginResp = curl.exe -s -X POST "$BaseUrl/api/auth/login" -H "Content-Type: application/json" -d "{`"email`":`"$email`",`"password`":`"$password`"}"
Assert-Step "Login" $loginResp '"success":true'
if ($loginResp -match '"token":"([^"]+)"') { $token = $matches[1] }
if ($loginResp -match '"refreshToken":"([^"]+)"') { $refreshToken = $matches[1] }

# 4. Get Profile (/api/auth/me)
Write-Host "`n4. Testing Get Profile (/api/auth/me)..." -ForegroundColor Yellow
$meResp = curl.exe -s -X GET "$BaseUrl/api/auth/me" -H "Authorization: Bearer $token"
Assert-Step "Get Profile" $meResp "`"email`":`"$email`""

# 5. Update Profile (/api/auth/profile)
Write-Host "`n5. Testing Update Profile..." -ForegroundColor Yellow
$updateResp = curl.exe -s -X PUT "$BaseUrl/api/auth/profile" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d '{\"name\":\"Updated Test User\"}'
Assert-Step "Update Profile" $updateResp '"Updated Test User"'

# 6. Gateway Rate Check
Write-Host "`n6. Testing Gateway Rate Check (Groq)..." -ForegroundColor Yellow
$rateResp = curl.exe -s -X POST "$BaseUrl/api/gateway/rate-check?provider=groq" -H "Authorization: Bearer $token"
Assert-Step "Rate Check" $rateResp '"Rate limit check passed"'

# 7. Gateway Status
Write-Host "`n7. Testing Gateway Status..." -ForegroundColor Yellow
$statusResp = curl.exe -s -X GET "$BaseUrl/api/gateway/status" -H "Authorization: Bearer $token"
Assert-Step "Gateway Status" $statusResp '"gateway":"active"'

# 8. User Audit Logs
Write-Host "`n8. Testing User Audit Logs (/api/audit-logs/my)..." -ForegroundColor Yellow
$logsResp = curl.exe -s -X GET "$BaseUrl/api/audit-logs/my" -H "Authorization: Bearer $token"
Assert-Step "User Audit Logs" $logsResp '"success":true'

# 9. Refresh Token Rotation
Write-Host "`n9. Testing Token Refresh..." -ForegroundColor Yellow
$refreshResp = curl.exe -s -X POST "$BaseUrl/api/auth/refresh" -H "Content-Type: application/json" -d "{`"refreshToken`":`"$refreshToken`"}"
Assert-Step "Token Refresh" $refreshResp '"Token refreshed successfully"'
if ($refreshResp -match '"token":"([^"]+)"') { $token = $matches[1] }

# 10. Logout
Write-Host "`n10. Testing Logout..." -ForegroundColor Yellow
$logoutResp = curl.exe -s -X POST "$BaseUrl/api/auth/logout" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "{`"refreshToken`":`"$refreshToken`"}"
Assert-Step "Logout" $logoutResp '"Logged out successfully"'

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " Route Testing Finished." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan


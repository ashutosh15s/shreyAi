# Comprehensive End-to-End API Test Runner for Shrey AI Backend using native PowerShell

$ErrorActionPreference = "Continue"
$BaseUrl = "http://localhost:8080"
$Results = @()

function Log-Test($id, $name, $passed, $details) {
    $status = if ($passed) { "PASS" } else { "FAIL" }
    $color = if ($passed) { "Green" } else { "Red" }
    Write-Host "[$status] Test $id : $name" -ForegroundColor $color
    if (-not $passed -and $details) {
        Write-Host "       Details: $details" -ForegroundColor DarkYellow
    }
    $global:Results += [PSCustomObject]@{
        Id = $id
        Name = $name
        Status = $status
        Details = $details
    }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   SHREY AI BACKEND — FULL API & ROUTE TEST SUITE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Health
try {
    $h = Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Method Get
    Log-Test 1 "Actuator Health Check" ($h.status -eq "UP") ($h | ConvertTo-Json -Compress)
} catch {
    Log-Test 1 "Actuator Health Check" $false $_.Exception.Message
}

# 2. Register Admin User
$suffix = Get-Random -Minimum 1000 -Maximum 9999
$adminEmail = "admin_$suffix@shrey.ai"
$adminPass = "AdminPass123!"
$adminToken = ""
$adminRefresh = ""
$adminId = ""

try {
    $body = @{ name = "Admin Boss"; email = $adminEmail; password = $adminPass; role = "ROLE_ADMIN" } | ConvertTo-Json
    $regAdmin = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Body $body -ContentType "application/json"
    $adminToken = $regAdmin.data.token
    $adminRefresh = $regAdmin.data.refreshToken
    $adminId = $regAdmin.data.id
    Log-Test 2 "Register Admin User ($adminEmail)" ($regAdmin.success -and $adminToken) ($regAdmin | ConvertTo-Json -Compress)
} catch {
    Log-Test 2 "Register Admin User ($adminEmail)" $false $_.Exception.Message
}

# 3. Login Admin User
try {
    $loginBody = @{ email = $adminEmail; password = $adminPass } | ConvertTo-Json
    $loginAdmin = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $adminToken = $loginAdmin.data.token
    $adminRefresh = $loginAdmin.data.refreshToken
    Log-Test 3 "Login Admin User" ($loginAdmin.success -and $loginAdmin.data.role -eq "ROLE_ADMIN") ($loginAdmin | ConvertTo-Json -Compress)
} catch {
    Log-Test 3 "Login Admin User" $false $_.Exception.Message
}

# 4. Get Current Profile (/api/auth/me)
try {
    $headers = @{ Authorization = "Bearer $adminToken" }
    $meResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method Get -Headers $headers
    Log-Test 4 "Get Admin Profile (/api/auth/me)" ($meResp.data.email -eq $adminEmail) ($meResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 4 "Get Admin Profile (/api/auth/me)" $false $_.Exception.Message
}

# 5. Update Profile Name (/api/auth/profile)
try {
    $upBody = @{ name = "Super Admin User" } | ConvertTo-Json
    $upResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/profile" -Method Put -Headers $headers -Body $upBody -ContentType "application/json"
    Log-Test 5 "Update Profile Name" ($upResp.data.name -eq "Super Admin User") ($upResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 5 "Update Profile Name" $false $_.Exception.Message
}

# 6. Gateway Rate Check
try {
    $rateResp = Invoke-RestMethod -Uri "$BaseUrl/api/gateway/rate-check?provider=groq" -Method Post -Headers $headers
    Log-Test 6 "Gateway Rate Limit Check (Groq)" ($rateResp.success -and $rateResp.data.allowed -eq $true) ($rateResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 6 "Gateway Rate Limit Check (Groq)" $false $_.Exception.Message
}

# 7. Gateway Status
try {
    $gwResp = Invoke-RestMethod -Uri "$BaseUrl/api/gateway/status" -Method Get -Headers $headers
    Log-Test 7 "Gateway Status Inspection" ($gwResp.data.gateway -eq "active") ($gwResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 7 "Gateway Status Inspection" $false $_.Exception.Message
}

# 8. Register 2nd User (Target for Blacklist & Deletion)
$user2Email = "user2_$suffix@shrey.ai"
$user2Pass = "User2Pass123!"
$user2Token = ""
$user2Refresh = ""
$user2Id = ""

try {
    $u2Body = @{ name = "Secondary User"; email = $user2Email; password = $user2Pass } | ConvertTo-Json
    $regUser2 = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Body $u2Body -ContentType "application/json"
    $user2Token = $regUser2.data.token
    $user2Refresh = $regUser2.data.refreshToken
    $user2Id = $regUser2.data.id
    Log-Test 8 "Register Secondary User ($user2Email)" ($regUser2.success -and $user2Id) ($regUser2 | ConvertTo-Json -Compress)
} catch {
    Log-Test 8 "Register Secondary User ($user2Email)" $false $_.Exception.Message
}

# 9. List All Users (Admin endpoint)
try {
    $listResp = Invoke-RestMethod -Uri "$BaseUrl/api/users" -Method Get -Headers $headers
    $foundUser2 = ($listResp.data.content | Where-Object { $_.email -eq $user2Email })
    Log-Test 9 "Admin List Users (/api/users)" ($null -ne $foundUser2) ($listResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 9 "Admin List Users (/api/users)" $false $_.Exception.Message
}

# 10. Admin Update User Name
try {
    $adminUpBody = @{ name = "Modified Secondary User" } | ConvertTo-Json
    $adminUpdateUser = Invoke-RestMethod -Uri "$BaseUrl/api/users/$user2Id" -Method Put -Headers $headers -Body $adminUpBody -ContentType "application/json"
    Log-Test 10 "Admin Update User Details (/api/users/{id})" ($adminUpdateUser.data.name -eq "Modified Secondary User") ($adminUpdateUser | ConvertTo-Json -Compress)
} catch {
    Log-Test 10 "Admin Update User Details (/api/users/{id})" $false $_.Exception.Message
}

# 11. Blacklist Secondary User
try {
    $blBody = @{ blacklisted = $true } | ConvertTo-Json
    $blResp = Invoke-RestMethod -Uri "$BaseUrl/api/users/$user2Id/blacklist" -Method Patch -Headers $headers -Body $blBody -ContentType "application/json"
    Log-Test 11 "Blacklist User via Admin Endpoint" ($blResp.data.blacklisted -eq $true) ($blResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 11 "Blacklist User via Admin Endpoint" $false $_.Exception.Message
}

# 12. Verify Blacklisted User CANNOT Login
try {
    $blLoginBody = @{ email = $user2Email; password = $user2Pass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $blLoginBody -ContentType "application/json"
    Log-Test 12 "Verify Blacklisted User Login Blocked (Expected 401)" $false "Login unexpectedly succeeded"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Log-Test 12 "Verify Blacklisted User Login Blocked (HTTP $statusCode)" ($statusCode -eq 401) $_.Exception.Message
}

# 13. Unblacklist User
try {
    $unblBody = @{ blacklisted = $false } | ConvertTo-Json
    $unblResp = Invoke-RestMethod -Uri "$BaseUrl/api/users/$user2Id/blacklist" -Method Patch -Headers $headers -Body $unblBody -ContentType "application/json"
    Log-Test 13 "Unblacklist User via Admin Endpoint" ($unblResp.data.blacklisted -eq $false) ($unblResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 13 "Unblacklist User via Admin Endpoint" $false $_.Exception.Message
}

# 14. Verify Unblacklisted User CAN Login Again
try {
    $unblLoginBody = @{ email = $user2Email; password = $user2Pass } | ConvertTo-Json
    $unblLogin = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $unblLoginBody -ContentType "application/json"
    $user2Token = $unblLogin.data.token
    $user2Refresh = $unblLogin.data.refreshToken
    Log-Test 14 "Verify Unblacklisted User Can Login" ($unblLogin.success -and $user2Token) ($unblLogin | ConvertTo-Json -Compress)
} catch {
    Log-Test 14 "Verify Unblacklisted User Can Login" $false $_.Exception.Message
}

# 15. Rotate Refresh Token
try {
    $refBody = @{ refreshToken = $user2Refresh } | ConvertTo-Json
    $refResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/refresh" -Method Post -Body $refBody -ContentType "application/json"
    $user2Token = $refResp.data.token
    $user2Refresh = $refResp.data.refreshToken
    Log-Test 15 "Rotate Refresh Token (/api/auth/refresh)" ($refResp.success -and $user2Token) ($refResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 15 "Rotate Refresh Token (/api/auth/refresh)" $false $_.Exception.Message
}

# 16. Logout & Token Blacklist
try {
    $user2Headers = @{ Authorization = "Bearer $user2Token" }
    $logoutBody = @{ refreshToken = $user2Refresh } | ConvertTo-Json
    $logoutResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/logout" -Method Post -Headers $user2Headers -Body $logoutBody -ContentType "application/json"
    Log-Test 16 "Logout and Blacklist Token" ($logoutResp.success -eq $true) ($logoutResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 16 "Logout and Blacklist Token" $false $_.Exception.Message
}

# 17. Verify Blacklisted Token Cannot Be Used Any More
try {
    $badReq = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method Get -Headers $user2Headers
    Log-Test 17 "Verify Blacklisted Token is Rejected (Expected 401)" $false "Call unexpectedly succeeded"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Log-Test 17 "Verify Blacklisted Token is Rejected (HTTP $code)" ($code -eq 401) $_.Exception.Message
}

# 18. Delete Secondary User as Admin
try {
    $delResp = Invoke-RestMethod -Uri "$BaseUrl/api/users/$user2Id" -Method Delete -Headers $headers
    Log-Test 18 "Delete User via Admin (/api/users/{id})" ($delResp.success -eq $true) ($delResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 18 "Delete User via Admin (/api/users/{id})" $false $_.Exception.Message
}

# 19. Verify Deleted User Cannot Be Found (404)
try {
    $getDel = Invoke-RestMethod -Uri "$BaseUrl/api/users/$user2Id" -Method Get -Headers $headers
    Log-Test 19 "Verify User Deletion (Expected 404)" $false "Call unexpectedly succeeded"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Log-Test 19 "Verify User Deletion (HTTP $code Not Found)" ($code -eq 404) $_.Exception.Message
}

# 20. View Audit Trail for Admin
try {
    $auditResp = Invoke-RestMethod -Uri "$BaseUrl/api/audit-logs/my" -Method Get -Headers $headers
    Log-Test 20 "Audit Trail Logged Operations" ($auditResp.success -and $auditResp.data.content.Count -gt 0) ($auditResp | ConvertTo-Json -Compress)
} catch {
    Log-Test 20 "Audit Trail Logged Operations" $false $_.Exception.Message
}

Write-Host "`n================================================================" -ForegroundColor Cyan
$passedCount = ($Results | Where-Object { $_.Status -eq "PASS" }).Count
$totalCount = $Results.Count
Write-Host "   FINAL RESULT: $passedCount / $totalCount TESTS PASSED" -ForegroundColor $(if ($passedCount -eq $totalCount) { "Green" } else { "Yellow" })
Write-Host "================================================================" -ForegroundColor Cyan

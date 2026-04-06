# Deployment Readiness Check Script
# Run this script to verify your project is ready for deployment

Write-Host ""
Write-Host "DEPLOYMENT READINESS CHECK" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# 1. Check if .env.local exists
Write-Host "1. Checking environment files..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    Write-Host "   [OK] .env.local exists" -ForegroundColor Green
} else {
    Write-Host "   [WARN] .env.local not found (needed for local dev, not for Vercel)" -ForegroundColor Yellow
    $warnings++
}

# 2. Check Git status
Write-Host ""
Write-Host "2. Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus -eq "") {
    Write-Host "   [OK] Working tree is clean" -ForegroundColor Green
} else {
    Write-Host "   [WARN] Uncommitted changes found:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    $warnings++
}

# 3. Check if code is pushed
Write-Host ""
Write-Host "3. Checking if code is pushed to GitHub..." -ForegroundColor Yellow
try {
    $localCommit = git rev-parse HEAD
    $remoteCommit = git rev-parse origin/main 2>$null
    if ($LASTEXITCODE -eq 0) {
        if ($localCommit -eq $remoteCommit) {
            Write-Host "   [OK] Local and remote are in sync" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] Local commits not pushed to remote" -ForegroundColor Yellow
            $warnings++
        }
    } else {
        Write-Host "   [WARN] Could not check remote (may not be connected)" -ForegroundColor Yellow
        $warnings++
    }
} catch {
    Write-Host "   [WARN] Could not check Git remote" -ForegroundColor Yellow
    $warnings++
}

# 4. Check for old authOptions imports
Write-Host ""
Write-Host "4. Checking for old authOptions imports..." -ForegroundColor Yellow
$oldImports = Select-String -Path "src\**\*.ts" -Pattern "from.*auth.*nextauth.*route" -ErrorAction SilentlyContinue
if ($oldImports) {
    Write-Host "   [ERROR] Found files with old import paths:" -ForegroundColor Red
    $oldImports | ForEach-Object { Write-Host "      $($_.Path)" -ForegroundColor Gray }
    $errors++
} else {
    Write-Host "   [OK] No old import paths found" -ForegroundColor Green
}

# 5. Check package.json scripts
Write-Host ""
Write-Host "5. Checking package.json scripts..." -ForegroundColor Yellow
if (Test-Path package.json) {
    $packageJson = Get-Content package.json | ConvertFrom-Json
    if ($packageJson.scripts.build) {
        Write-Host "   [OK] Build script exists: $($packageJson.scripts.build)" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] No build script found" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "   [ERROR] package.json not found" -ForegroundColor Red
    $errors++
}

# 6. Check for TypeScript config
Write-Host ""
Write-Host "6. Checking TypeScript configuration..." -ForegroundColor Yellow
if (Test-Path tsconfig.json) {
    Write-Host "   [OK] tsconfig.json exists" -ForegroundColor Green
} else {
    Write-Host "   [WARN] tsconfig.json not found" -ForegroundColor Yellow
    $warnings++
}

# 7. Check Next.js config
Write-Host ""
Write-Host "7. Checking Next.js configuration..." -ForegroundColor Yellow
if (Test-Path next.config.js) {
    Write-Host "   [OK] next.config.js exists" -ForegroundColor Green
    $nextConfig = Get-Content next.config.js -Raw
    if ($nextConfig -match "output.*standalone") {
        Write-Host "   [OK] Standalone output enabled (good for Docker)" -ForegroundColor Green
    }
} else {
    Write-Host "   [WARN] next.config.js not found" -ForegroundColor Yellow
    $warnings++
}

# 8. Check for deployment files
Write-Host ""
Write-Host "8. Checking deployment files..." -ForegroundColor Yellow
$deploymentFiles = @("vercel.json", "Dockerfile", "docker-compose.yml")
foreach ($file in $deploymentFiles) {
    if (Test-Path $file) {
        Write-Host "   [OK] $file exists" -ForegroundColor Green
    } else {
        Write-Host "   [INFO] $file not found (optional)" -ForegroundColor Gray
    }
}

# 9. Check authOptions file exists
Write-Host ""
Write-Host "9. Checking authOptions file..." -ForegroundColor Yellow
if (Test-Path "src\lib\authOptions.ts") {
    Write-Host "   [OK] authOptions.ts exists" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] authOptions.ts not found" -ForegroundColor Red
    $errors++
}

# 10. Test build (optional - takes time)
Write-Host ""
Write-Host "10. Build test (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host "   Do you want to run 'npm run build' to test? (y/n): " -NoNewline -ForegroundColor Cyan
$response = Read-Host
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "   Running build test..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Build successful!" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Build failed!" -ForegroundColor Red
        Write-Host "   Run 'npm run build' manually to see full errors" -ForegroundColor Yellow
        $errors++
    }
} else {
    Write-Host "   [SKIP] Skipping build test" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "--------" -ForegroundColor Cyan
Write-Host ""

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "READY FOR DEPLOYMENT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "All checks passed. You can deploy to Vercel!" -ForegroundColor Green
} elseif ($errors -eq 0) {
    Write-Host "READY WITH WARNINGS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can deploy, but review the warnings above." -ForegroundColor Yellow
} else {
    Write-Host "NOT READY - FIX ERRORS FIRST" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors above before deploying." -ForegroundColor Red
}

Write-Host ""
$color = if ($errors -gt 0) { "Red" } elseif ($warnings -gt 0) { "Yellow" } else { "Green" }
Write-Host "Errors: $errors | Warnings: $warnings" -ForegroundColor $color
Write-Host ""

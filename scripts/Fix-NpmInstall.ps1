# PowerShell script to fix npm install issues with Windows path spaces
Write-Host "Fixing npm install issues with Windows path spaces..." -ForegroundColor Green
Write-Host ""

# Get current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow

# Change to frontend directory
$frontendDir = Join-Path $currentDir "frontend"
Set-Location $frontendDir

Write-Host "Changed to: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Clean npm cache
Write-Host "Cleaning npm cache..." -ForegroundColor Cyan
npm cache clean --force

# Remove node_modules and package-lock.json
Write-Host ""
Write-Host "Removing node_modules..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

Write-Host "Removing package-lock.json..." -ForegroundColor Cyan
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -ErrorAction SilentlyContinue
}

# Try alternative npm install approaches
Write-Host ""
Write-Host "Attempting npm install with workarounds..." -ForegroundColor Cyan

# Method 1: Use --no-optional and --legacy-peer-deps
Write-Host "Method 1: npm install --no-optional --legacy-peer-deps" -ForegroundColor Yellow
npm install --no-optional --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! Dependencies installed." -ForegroundColor Green
    
    # Try to build
    Write-Host ""
    Write-Host "Attempting build..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build successful! Project is ready for deployment." -ForegroundColor Green
    } else {
        Write-Host "Build failed. Check errors above." -ForegroundColor Red
    }
} else {
    Write-Host "Method 1 failed. Trying alternative approaches..." -ForegroundColor Yellow
    
    # Method 2: Use yarn instead of npm
    Write-Host ""
    Write-Host "Method 2: Trying with yarn..." -ForegroundColor Yellow
    if (Get-Command yarn -ErrorAction SilentlyContinue) {
        yarn install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Yarn install successful!" -ForegroundColor Green
            yarn build
        }
    } else {
        Write-Host "Yarn not available. Install yarn globally: npm install -g yarn" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Script completed. Check output above for results." -ForegroundColor Green
Write-Host "If issues persist, consider moving project to a path without spaces." -ForegroundColor Yellow

# Return to original directory
Set-Location $currentDir
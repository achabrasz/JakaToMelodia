# Quick Start Script for Windows PowerShell
# Jaka To Melodia - Automated Setup

Write-Host "🎵 Jaka To Melodia - Quick Start Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check .NET
Write-Host "Checking .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET SDK found: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ .NET 10 SDK not found! Please install from https://dotnet.microsoft.com/download" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setup Steps:" -ForegroundColor Cyan
Write-Host "1. Configure Spotify API credentials" -ForegroundColor White
Write-Host "2. Restore backend packages" -ForegroundColor White
Write-Host "3. Install frontend dependencies" -ForegroundColor White
Write-Host "4. Start both servers" -ForegroundColor White
Write-Host ""

# Check Spotify configuration
Write-Host "Checking Spotify API configuration..." -ForegroundColor Yellow
$appsettingsPath = "JakaToMelodiaBackend\appsettings.Development.json"

if (Test-Path $appsettingsPath) {
    $config = Get-Content $appsettingsPath | ConvertFrom-Json
    if ($config.Spotify.ClientId -eq "YOUR_SPOTIFY_CLIENT_ID" -or 
        $config.Spotify.ClientSecret -eq "YOUR_SPOTIFY_CLIENT_SECRET") {
        Write-Host "⚠ WARNING: Spotify API not configured!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please follow these steps:" -ForegroundColor White
        Write-Host "1. Go to https://developer.spotify.com/dashboard" -ForegroundColor White
        Write-Host "2. Create a new app" -ForegroundColor White
        Write-Host "3. Copy Client ID and Client Secret" -ForegroundColor White
        Write-Host "4. Add Redirect URI: http://localhost:5000/api/spotify/callback" -ForegroundColor White
        Write-Host "5. Update $appsettingsPath with your credentials" -ForegroundColor White
        Write-Host ""
        
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit 0
        }
    } else {
        Write-Host "✓ Spotify API configured" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Creating appsettings.Development.json from example..." -ForegroundColor Yellow
    Copy-Item "JakaToMelodiaBackend\appsettings.Development.json.example" $appsettingsPath
    Write-Host "Please configure your Spotify credentials in $appsettingsPath" -ForegroundColor Yellow
    exit 0
}

# Backend setup
Write-Host ""
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Set-Location JakaToMelodiaBackend
Write-Host "Restoring packages..." -ForegroundColor Yellow
dotnet restore
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend restore failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Backend packages restored" -ForegroundColor Green
Set-Location ..

# Frontend setup
Write-Host ""
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Set-Location Frontend
Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend install failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend (in one terminal):" -ForegroundColor Yellow
Write-Host "  cd JakaToMelodiaBackend" -ForegroundColor White
Write-Host "  dotnet run" -ForegroundColor White
Write-Host "  → http://localhost:5000" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend (in another terminal):" -ForegroundColor Yellow
Write-Host "  cd Frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "  → http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use the provided run scripts:" -ForegroundColor Yellow
Write-Host "  .\run-backend.ps1" -ForegroundColor White
Write-Host "  .\run-frontend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Enjoy the game! 🎵🎉" -ForegroundColor Green

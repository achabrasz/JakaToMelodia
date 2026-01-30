# Run Backend Server
# Jaka To Melodia Backend

Write-Host "🎵 Starting Jaka To Melodia Backend..." -ForegroundColor Cyan
Write-Host ""

Set-Location JakaToMelodiaBackend

Write-Host "Backend will start on: http://localhost:5000" -ForegroundColor Green
Write-Host "Swagger UI: http://localhost:5000/swagger" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

dotnet run

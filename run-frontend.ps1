# Run Frontend Server
# Jaka To Melodia Frontend

Write-Host "🎨 Starting Jaka To Melodia Frontend..." -ForegroundColor Cyan
Write-Host ""

Set-Location Frontend

Write-Host "Frontend will start on: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev

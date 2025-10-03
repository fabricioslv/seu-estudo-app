# Script PowerShell para iniciar ambos os servidores no Windows
Write-Host "=== INICIANDO PROJETO SEU-ESTUDO ===" -ForegroundColor Magenta

# Função para iniciar backend em nova janela
function Start-Backend {
    Write-Host "Iniciando backend em nova janela..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-File", "start-backend.ps1" -WindowStyle Normal
}

# Função para iniciar frontend em nova janela
function Start-Frontend {
    Write-Host "Iniciando frontend em nova janela..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-File", "start-frontend.ps1" -WindowStyle Normal
}

# Aguardar um pouco antes de iniciar o frontend
Write-Host "Aguardando backend inicializar..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Iniciar ambos os servidores
Start-Backend
Start-Frontend

Write-Host "=== SERVIDORES INICIADOS ===" -ForegroundColor Magenta
Write-Host "Backend: http://localhost:6001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

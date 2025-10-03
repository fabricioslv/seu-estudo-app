# Script PowerShell para iniciar o frontend no Windows
Write-Host "Iniciando servidor frontend..." -ForegroundColor Green

# Navegar para o diretório frontend
Set-Location frontend

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "Node.js versão: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO: Node.js não encontrado. Instale Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "NPM versão: $npmVersion" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO: NPM não encontrado." -ForegroundColor Red
    exit 1
}

# Instalar dependências se necessário
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Verificar se arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "ERRO: Arquivo .env não encontrado no diretório frontend" -ForegroundColor Red
    exit 1
}

# Iniciar o servidor
Write-Host "Iniciando servidor na porta 3000..." -ForegroundColor Green
npm start

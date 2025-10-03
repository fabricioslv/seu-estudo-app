# Script PowerShell para iniciar o backend no Windows
Write-Host "Iniciando servidor backend..." -ForegroundColor Green

# Navegar para o diretório backend
Set-Location backend

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
    Write-Host "ERRO: Arquivo .env não encontrado no diretório backend" -ForegroundColor Red
    exit 1
}

# Iniciar o servidor
Write-Host "Iniciando servidor na porta 6001..." -ForegroundColor Green
node index.js

# Script PowerShell para corrigir dependências e iniciar servidores
Write-Host "=== CORRIGINDO DEPENDÊNCIAS E INICIANDO SERVIDORES ===" -ForegroundColor Magenta

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js versão: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "ERRO: Node.js não encontrado. Instale Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Corrigir dependências do backend
Write-Host "Corrigindo dependências do backend..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}
npm install

# Corrigir dependências do frontend
Write-Host "Corrigindo dependências do frontend..." -ForegroundColor Yellow
Set-Location ../frontend
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}
npm install

# Voltar para diretório raiz
Set-Location ..

Write-Host "=== DEPENDÊNCIAS CORRIGIDAS ===" -ForegroundColor Green
Write-Host "Agora execute: .\start-project.ps1" -ForegroundColor Cyan

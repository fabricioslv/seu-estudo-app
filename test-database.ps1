# Script PowerShell para testar conexão com banco de dados
Write-Host "=== TESTANDO CONEXÃO COM BANCO DE DADOS ===" -ForegroundColor Magenta

Set-Location backend

# Verificar se arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "ERRO: Arquivo .env não encontrado" -ForegroundColor Red
    exit 1
}

# Executar teste de conexão
Write-Host "Executando teste de conexão..." -ForegroundColor Yellow
node test-db-connection.js

Set-Location ..
Write-Host "=== TESTE CONCLUÍDO ===" -ForegroundColor Green

#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script de Deploy Azul/Verde para Ambiente Staging do Projeto Seu-Estudo

.DESCRIPTION
    Este script implementa uma estratégia de blue-green deployment para o ambiente de staging,
    permitindo deploy sem downtime e rollback automático em caso de erro.

.PARAMETER Environment
    Ambiente para deploy (staging, production)

.PARAMETER AutoRollback
    Habilita rollback automático em caso de falha

.PARAMETER Timeout
    Timeout em segundos para testes de saúde (padrão: 300)

.EXAMPLE
    .\deploy-staging-blue-green.ps1 -Environment staging -AutoRollback
#>

param(
    [string]$Environment = "staging",
    [switch]$AutoRollback = $true,
    [int]$Timeout = 300
)

class BlueGreenDeployer {
    [string]$Environment
    [string]$CurrentActive = "blue"
    [string]$ProjectName = "seu-estudo"
    [bool]$AutoRollback
    [int]$Timeout

    BlueGreenDeployer([string]$env, [bool]$autoRollback, [int]$timeout) {
        $this.Environment = $env
        $this.AutoRollback = $autoRollback
        $this.Timeout = $timeout
    }

    [bool] Execute() {
        Write-Host "🚀 Iniciando deploy azul/verde para $($this.Environment)" -ForegroundColor Green

        try {
            # 1. Determinar próximo ambiente
            $nextEnvironment = ($this.CurrentActive -eq "blue") ? "green" : "blue"

            # 2. Deploy do novo ambiente
            if (-not $this.DeployNewVersion($nextEnvironment)) {
                throw "Falha no deploy do ambiente $nextEnvironment"
            }

            # 3. Testes de saúde
            $healthCheckPassed = $this.PerformHealthChecks($nextEnvironment)

            if (-not $healthCheckPassed) {
                Write-Host "❌ Testes de saúde falharam" -ForegroundColor Red

                if ($this.AutoRollback) {
                    Write-Host "🔄 Iniciando rollback automático..." -ForegroundColor Yellow
                    return $this.Rollback($nextEnvironment)
                }

                return $false
            }

            # 4. Alternar tráfego
            $this.SwitchTraffic($nextEnvironment)

            Write-Host "✅ Deploy concluído com sucesso. $nextEnvironment está ativo." -ForegroundColor Green
            return $true

        }
        catch {
            Write-Host "❌ Erro durante o deploy: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }

    [bool] DeployNewVersion([string]$environment) {
        Write-Host "📦 Fazendo deploy para ambiente $environment..." -ForegroundColor Cyan

        try {
            # Build do projeto
            Write-Host "🏗️ Fazendo build do projeto..." -ForegroundColor Yellow
            npm run build

            if ($LASTEXITCODE -ne 0) {
                throw "Falha no build do projeto"
            }

            # Deploy para Vercel com ambiente específico
            $deployCommand = "vercel --prod --scope=$($env:Vercel_SCOPE) -e NODE_ENV=$($this.Environment)"

            Write-Host "🚀 Executando deploy no Vercel..." -ForegroundColor Yellow
            Invoke-Expression $deployCommand

            if ($LASTEXITCODE -ne 0) {
                throw "Falha no deploy do Vercel"
            }

            Write-Host "✅ Deploy do ambiente $environment concluído" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "❌ Falha no deploy do ambiente $environment $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }

    [bool] PerformHealthChecks([string]$environment) {
        Write-Host "🔍 Executando testes de saúde no ambiente $environment..." -ForegroundColor Cyan

        $targetUrl = "https://$($this.ProjectName)-$environment.vercel.app"

        try {
            # Teste básico de conectividade
            $healthUrl = "$targetUrl/api/health"

            Write-Host "Verificando health check em: $healthUrl" -ForegroundColor Yellow

            # Para PowerShell, usar Invoke-WebRequest
            $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec $this.Timeout -ErrorAction Stop

            if ($response.StatusCode -ne 200) {
                Write-Host "❌ Teste de saúde falhou: Status $($response.StatusCode)" -ForegroundColor Red
                return $false
            }

            $content = $response.Content | ConvertFrom-Json

            if ($content.status -ne "ok") {
                Write-Host "❌ Teste de saúde falhou: Resposta não indica status OK" -ForegroundColor Red
                return $false
            }

            Write-Host "✅ Testes de saúde passaram" -ForegroundColor Green
            return $true

        }
        catch {
            Write-Host "❌ Erro durante os testes de saúde: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }

    [void] SwitchTraffic([string]$environment) {
        Write-Host "🔄 Alternando tráfego para ambiente $environment..." -ForegroundColor Cyan

        try {
            # Atualizar variável de ambiente que indica ambiente ativo
            $updateCommand = "vercel env add ACTIVE_ENVIRONMENT $environment --scope=$($env:Vercel_SCOPE)"

            Write-Host "Atualizando configuração de ambiente ativo..." -ForegroundColor Yellow
            Invoke-Expression $updateCommand

            $this.CurrentActive = $environment
            Write-Host "✅ Tráfego alternado para $environment" -ForegroundColor Green

        }
        catch {
            Write-Host "❌ Erro ao alternar tráfego: $($_.Exception.Message)" -ForegroundColor Red
            throw
        }
    }

    [bool] Rollback([string]$failedEnvironment) {
        Write-Host "🔄 Executando rollback do ambiente $failedEnvironment..." -ForegroundColor Yellow

        $previousEnvironment = $this.CurrentActive

        try {
            $this.SwitchTraffic($previousEnvironment)
            Write-Host "✅ Rollback concluído. Ambiente $previousEnvironment está ativo." -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "❌ Erro durante o rollback: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
}

# Função principal
function Main {
    # Verificar se Vercel CLI está instalado
    try {
        $vercelVersion = vercel --version 2>$null
        if (-not $vercelVersion) {
            throw "Vercel CLI não encontrado"
        }
    }
    catch {
        Write-Host "❌ Vercel CLI não está instalado. Instale com: npm i -g vercel" -ForegroundColor Red
        exit 1
    }

    # Verificar se está logado no Vercel
    try {
        $whoami = vercel whoami 2>$null
        if (-not $whoami) {
            Write-Host "❌ Não está logado no Vercel. Execute: vercel login" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Não está logado no Vercel. Execute: vercel login" -ForegroundColor Red
        exit 1
    }

    Write-Host "🔐 Usuário logado no Vercel: $whoami" -ForegroundColor Green

    # Executar deployer
    $deployer = [BlueGreenDeployer]::new($Environment, $AutoRollback, $Timeout)
    $success = $deployer.Execute()

    if ($success) {
        Write-Host "🎉 Deploy azul/verde concluído com sucesso!" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "💥 Deploy azul/verde falhou!" -ForegroundColor Red
        exit 1
    }
}

# Executar função principal
Main
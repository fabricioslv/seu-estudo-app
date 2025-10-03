#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script Simplificado de Deploy para Ambiente Staging do Projeto Seu-Estudo

.DESCRIPTION
    Este script facilita o deploy do ambiente de staging no Vercel,
    incluindo configurações específicas e verificações de saúde.

.PARAMETER Environment
    Ambiente para deploy (padrão: staging)

.PARAMETER CheckHealth
    Verificar saúde da aplicação após o deploy

.PARAMETER BuildOnly
    Apenas fazer build, sem deploy

.EXAMPLE
    .\deploy-staging-simple.ps1 -CheckHealth
#>

param(
    [string]$Environment = "staging",
    [switch]$CheckHealth = $true,
    [switch]$BuildOnly = $false
)

class StagingDeployer {
    [string]$Environment
    [bool]$CheckHealth
    [bool]$BuildOnly
    [string]$ProjectName = "seu-estudo"

    StagingDeployer([string]$env, [bool]$checkHealth, [bool]$buildOnly) {
        $this.Environment = $env
        $this.CheckHealth = $checkHealth
        $this.BuildOnly = $buildOnly
    }

    [bool] Execute() {
        Write-Host "🚀 Iniciando deploy para ambiente $($this.Environment)" -ForegroundColor Green

        try {
            # 1. Verificar pré-requisitos
            if (-not $this.CheckPrerequisites()) {
                return $false
            }

            # 2. Preparar ambiente
            $this.PrepareEnvironment()

            # 3. Build da aplicação
            if (-not $this.BuildApplication()) {
                throw "Falha no build da aplicação"
            }

            if ($this.BuildOnly) {
                Write-Host "✅ Build concluído (modo build-only)" -ForegroundColor Green
                return $true
            }

            # 4. Deploy para Vercel
            if (-not $this.DeployToVercel()) {
                throw "Falha no deploy para Vercel"
            }

            # 5. Verificar saúde (se habilitado)
            if ($this.CheckHealth) {
                Start-Sleep -Seconds 10 # Aguardar deploy estabilizar
                if (-not $this.PerformHealthCheck()) {
                    Write-Host "⚠️ Deploy concluído, mas health check falhou" -ForegroundColor Yellow
                    return $false
                }
            }

            Write-Host "🎉 Deploy para $($this.Environment) concluído com sucesso!" -ForegroundColor Green
            return $true

        }
        catch {
            Write-Host "❌ Erro durante o deploy: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }

    [bool] CheckPrerequisites() {
        Write-Host "🔍 Verificando pré-requisitos..." -ForegroundColor Cyan

        # Verificar se Vercel CLI está instalado
        try {
            $vercelVersion = vercel --version 2>$null
            if (-not $vercelVersion) {
                throw "Vercel CLI não encontrado"
            }
            Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Vercel CLI não está instalado. Execute: npm i -g vercel" -ForegroundColor Red
            return $false
        }

        # Verificar se está logado no Vercel
        try {
            $whoami = vercel whoami 2>$null
            if (-not $whoami) {
                Write-Host "❌ Não está logado no Vercel. Execute: vercel login" -ForegroundColor Red
                return $false
            }
            Write-Host "✅ Logado no Vercel como: $whoami" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Não está logado no Vercel. Execute: vercel login" -ForegroundColor Red
            return $false
        }

        # Verificar se Node.js está disponível
        try {
            $nodeVersion = node --version
            Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Node.js não encontrado" -ForegroundColor Red
            return $false
        }

        # Verificar se arquivos de configuração existem
        $configFiles = @("vercel.staging.json", ".env.staging")
        foreach ($file in $configFiles) {
            if (Test-Path $file) {
                Write-Host "✅ $file encontrado" -ForegroundColor Green
            } else {
                Write-Host "⚠️ $file não encontrado" -ForegroundColor Yellow
            }
        }

        return $true
    }

    [void] PrepareEnvironment() {
        Write-Host "🔧 Preparando ambiente $($this.Environment)..." -ForegroundColor Cyan

        # Carregar variáveis de ambiente específicas para staging
        if (Test-Path ".env.staging") {
            Write-Host "📋 Carregando variáveis de ambiente para $($this.Environment)" -ForegroundColor Yellow
            # Para PowerShell, podemos definir variáveis de ambiente
            $envContent = Get-Content ".env.staging" -Raw
            # Parse simples de variáveis de ambiente
            $lines = $envContent -split "`n" | Where-Object { $_ -notmatch '^#' -and $_ -match '=' }
            foreach ($line in $lines) {
                $parts = $line -split '=', 2
                if ($parts.Length -eq 2) {
                    [Environment]::SetEnvironmentVariable($parts[0], $parts[1])
                }
            }
        }

        # Definir variáveis específicas para staging
        [Environment]::SetEnvironmentVariable("NODE_ENV", $this.Environment)
        [Environment]::SetEnvironmentVariable("VERCEL_ENV", $this.Environment)
    }

    [bool] BuildApplication() {
        Write-Host "🏗️ Fazendo build da aplicação..." -ForegroundColor Cyan

        try {
            # Build do backend
            Write-Host "📦 Fazendo build do backend..." -ForegroundColor Yellow
            Set-Location backend
            npm run build

            if ($LASTEXITCODE -ne 0) {
                throw "Falha no build do backend"
            }

            Set-Location ..

            # Build do frontend
            Write-Host "🎨 Fazendo build do frontend..." -ForegroundColor Yellow
            Set-Location frontend
            npm run build

            if ($LASTEXITCODE -ne 0) {
                throw "Falha no build do frontend"
            }

            Set-Location ..

            Write-Host "✅ Build concluído com sucesso" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "❌ Falha no build: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }

    [bool] DeployToVercel() {
        Write-Host "🚀 Fazendo deploy para Vercel..." -ForegroundColor Cyan

        try {
            # Deploy do backend
            Write-Host "🔧 Deploy do backend..." -ForegroundColor Yellow
            Set-Location backend
            $backendUrl = vercel --prod -e NODE_ENV=$($this.Environment) --scope=$($env:Vercel_SCOPE) 2>$null

            if ($LASTEXITCODE -ne 0) {
                throw "Falha no deploy do backend"
            }

            Write-Host "✅ Backend deploy concluído" -ForegroundColor Green
            Set-Location ..

            # Deploy do frontend
            Write-Host "🌐 Deploy do frontend..." -ForegroundColor Yellow
            Set-Location frontend
            $frontendUrl = vercel --prod -e NODE_ENV=$($this.Environment) --scope=$($env:Vercel_SCOPE) 2>$null

            if ($LASTEXITCODE -ne 0) {
                throw "Falha no deploy do frontend"
            }

            Write-Host "✅ Frontend deploy concluído" -ForegroundColor Green
            Set-Location ..

            return $true
        }
        catch {
            Write-Host "❌ Falha no deploy: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }

    [bool] PerformHealthCheck() {
        Write-Host "🔍 Verificando saúde da aplicação..." -ForegroundColor Cyan

        $healthUrls = @(
            "https://$($this.ProjectName)-backend-$($this.Environment).vercel.app/api/health",
            "https://$($this.ProjectName)-$($this.Environment).vercel.app"
        )

        foreach ($url in $healthUrls) {
            try {
                Write-Host "Verificando: $url" -ForegroundColor Yellow
                $response = Invoke-WebRequest -Uri $url -TimeoutSec 30 -ErrorAction Stop

                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ $url - OK" -ForegroundColor Green
                } else {
                    Write-Host "⚠️ $url - Status $($response.StatusCode)" -ForegroundColor Yellow
                }
            }
            catch {
                Write-Host "❌ $url - Erro: $($_.Exception.Message)" -ForegroundColor Red
                return $false
            }
        }

        Write-Host "✅ Todas as verificações de saúde passaram" -ForegroundColor Green
        return $true
    }
}

# Função principal
function Main {
    $deployer = [StagingDeployer]::new($Environment, $CheckHealth, $BuildOnly)
    $success = $deployer.Execute()

    if ($success) {
        Write-Host ""
        Write-Host "🎯 URLs do ambiente $($Environment):" -ForegroundColor Cyan
        Write-Host "   Frontend: https://$($deployer.ProjectName)-$($Environment).vercel.app" -ForegroundColor White
        Write-Host "   Backend:  https://$($deployer.ProjectName)-backend-$($Environment).vercel.app" -ForegroundColor White
        Write-Host "   Health:   https://$($deployer.ProjectName)-backend-$($Environment).vercel.app/api/health" -ForegroundColor White
        Write-Host ""
        exit 0
    }
    else {
        Write-Host ""
        Write-Host "💥 Deploy falhou!" -ForegroundColor Red
        exit 1
    }
}

# Executar função principal
Main
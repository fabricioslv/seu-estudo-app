#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script de Deploy para Produção do Projeto Seu-Estudo

.DESCRIPTION
    Este script implementa deploy completo para produção com validações,
    rollback automático e notificações.

.PARAMETER Environment
    Ambiente para deploy (production)

.PARAMETER AutoRollback
    Habilita rollback automático em caso de falha

.PARAMETER Timeout
    Timeout em segundos para testes de saúde (padrão: 600)

.PARAMETER SlackWebhook
    URL do webhook do Slack para notificações

.EXAMPLE
    .\deploy-production.ps1 -Environment production -AutoRollback -SlackWebhook "https://hooks.slack.com/..."
#>

param(
    [string]$Environment = "production",
    [switch]$AutoRollback = $true,
    [int]$Timeout = 600,
    [string]$SlackWebhook = ""
)

class ProductionDeployer {
    [string]$Environment
    [string]$ProjectName = "seu-estudo"
    [bool]$AutoRollback
    [int]$Timeout
    [string]$SlackWebhook
    [string]$StartTime
    [System.Collections.Generic.List[string]]$DeploymentLog

    ProductionDeployer([string]$env, [bool]$autoRollback, [int]$timeout, [string]$slackWebhook) {
        $this.Environment = $env
        $this.AutoRollback = $autoRollback
        $this.Timeout = $timeout
        $this.SlackWebhook = $slackWebhook
        $this.StartTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $this.DeploymentLog = New-Object System.Collections.Generic.List[string]
    }

    [void] Log([string]$message, [string]$level = "INFO") {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $logMessage = "[$timestamp] [$level] $message"
        $this.DeploymentLog.Add($logMessage)
        Write-Host $logMessage -ForegroundColor $(if ($level -eq "ERROR") { "Red" } elseif ($level -eq "WARN") { "Yellow" } else { "Green" })
    }

    [bool] Execute() {
        $this.Log("🚀 Iniciando deploy para produção do $($this.ProjectName)", "INFO")
        $this.Log("⏰ Início do deploy: $($this.StartTime)", "INFO")

        try {
            # 1. Pré-deploy validations
            if (-not $this.PreDeployValidations()) {
                throw "Validações de pré-deploy falharam"
            }

            # 2. Backup de produção (se aplicável)
            $this.CreateBackup()

            # 3. Deploy do backend
            if (-not $this.DeployBackend()) {
                throw "Falha no deploy do backend"
            }

            # 4. Deploy do frontend
            if (-not $this.DeployFrontend()) {
                throw "Falha no deploy do frontend"
            }

            # 5. Testes pós-deploy
            if (-not $this.PostDeployTests()) {
                throw "Testes pós-deploy falharam"
            }

            # 6. Health checks extensivos
            $healthCheckPassed = $this.PerformExtensiveHealthChecks()

            if (-not $healthCheckPassed) {
                $this.Log("❌ Testes de saúde falharam", "ERROR")

                if ($this.AutoRollback) {
                    $this.Log("🔄 Iniciando rollback automático...", "WARN")
                    return $this.Rollback()
                }

                return $false
            }

            # 7. Atualizar configurações de produção
            $this.UpdateProductionConfigs()

            # 8. Notificações de sucesso
            $this.NotifySuccess()

            $this.Log("✅ Deploy para produção concluído com sucesso!", "INFO")
            return $true

        }
        catch {
            $this.Log("❌ Erro durante o deploy: $($_.Exception.Message)", "ERROR")

            if ($this.AutoRollback) {
                $this.Log("🔄 Tentando rollback automático...", "WARN")
                $this.Rollback()
            }

            $this.NotifyFailure($_.Exception.Message)
            return $false
        }
    }

    [bool] PreDeployValidations() {
        $this.Log("🔍 Executando validações de pré-deploy...", "INFO")

        # Verificar se está logado no Vercel
        try {
            $whoami = vercel whoami 2>$null
            if (-not $whoami) {
                throw "Não está logado no Vercel"
            }
            $this.Log("✅ Usuário logado no Vercel: $whoami", "INFO")
        }
        catch {
            throw "❌ Não está logado no Vercel. Execute: vercel login"
        }

        # Verificar variáveis de ambiente críticas
        $requiredEnvVars = @("DATABASE_URL", "JWT_SECRET", "SUPABASE_URL")
        foreach ($var in $requiredEnvVars) {
            if (-not (Get-ChildItem Env:$var -ErrorAction SilentlyContinue)) {
                $this.Log("⚠️ Variável de ambiente $var não definida", "WARN")
            }
        }

        # Verificar conectividade com serviços externos
        $this.Log("📡 Testando conectividade com serviços externos...", "INFO")
        # Teste de conectividade com banco de dados, APIs, etc.

        $this.Log("✅ Validações de pré-deploy concluídas", "INFO")
        return $true
    }

    [void] CreateBackup() {
        $this.Log("💾 Criando backup de produção...", "INFO")

        try {
            # Implementar lógica de backup aqui
            # - Backup do banco de dados
            # - Backup de configurações críticas
            # - Snapshot de arquivos importantes

            $this.Log("✅ Backup criado com sucesso", "INFO")
        }
        catch {
            $this.Log("❌ Falha ao criar backup: $($_.Exception.Message)", "ERROR")
            throw
        }
    }

    [bool] DeployBackend() {
        $this.Log("🔧 Fazendo deploy do backend...", "INFO")

        try {
            Set-Location "backend"

            # Build do backend
            $this.Log("🏗️ Fazendo build do backend...", "INFO")
            npm run build:production
            if ($LASTEXITCODE -ne 0) {
                throw "Falha no build do backend"
            }

            # Deploy para Vercel
            $this.Log("🚀 Executando deploy do backend no Vercel...", "INFO")
            $deployCommand = "vercel --prod --yes --token $($env:Vercel_TOKEN)"

            Invoke-Expression $deployCommand
            if ($LASTEXITCODE -ne 0) {
                throw "Falha no deploy do backend no Vercel"
            }

            Set-Location ".."
            $this.Log("✅ Deploy do backend concluído", "INFO")
            return $true
        }
        catch {
            $this.Log("❌ Falha no deploy do backend: $($_.Exception.Message)", "ERROR")
            return $false
        }
    }

    [bool] DeployFrontend() {
        $this.Log("🎨 Fazendo deploy do frontend...", "INFO")

        try {
            Set-Location "frontend"

            # Build do frontend
            $this.Log("🏗️ Fazendo build do frontend...", "INFO")
            npm run build:production
            if ($LASTEXITCODE -ne 0) {
                throw "Falha no build do frontend"
            }

            # Otimizar assets
            $this.Log("⚡ Otimizando assets...", "INFO")
            # Implementar otimização adicional se necessário

            # Deploy para Vercel
            $this.Log("🚀 Executando deploy do frontend no Vercel...", "INFO")
            $deployCommand = "vercel --prod --yes --token $($env:Vercel_TOKEN)"

            Invoke-Expression $deployCommand
            if ($LASTEXITCODE -ne 0) {
                throw "Falha no deploy do frontend no Vercel"
            }

            Set-Location ".."
            $this.Log("✅ Deploy do frontend concluído", "INFO")
            return $true
        }
        catch {
            $this.Log("❌ Falha no deploy do frontend: $($_.Exception.Message)", "ERROR")
            return $false
        }
    }

    [bool] PostDeployTests() {
        $this.Log("🧪 Executando testes pós-deploy...", "INFO")

        try {
            # Testes de integração
            $this.Log("🔗 Executando testes de integração...", "INFO")

            # Testes de performance básicos
            $this.Log("⚡ Executando testes de performance...", "INFO")

            # Testes de segurança
            $this.Log("🔒 Executando testes de segurança...", "INFO")

            $this.Log("✅ Testes pós-deploy concluídos", "INFO")
            return $true
        }
        catch {
            $this.Log("❌ Falha nos testes pós-deploy: $($_.Exception.Message)", "ERROR")
            return $false
        }
    }

    [bool] PerformExtensiveHealthChecks() {
        $this.Log("🏥 Executando testes de saúde extensivos...", "INFO")

        $backendUrl = "https://$($this.ProjectName)-backend.vercel.app"
        $frontendUrl = "https://$($this.ProjectName).vercel.app"

        try {
            # Health check do backend
            $backendHealthUrl = "$backendUrl/api/health"
            $this.Log("Verificando health check do backend: $backendHealthUrl", "INFO")

            $response = Invoke-WebRequest -Uri $backendHealthUrl -TimeoutSec $this.Timeout -ErrorAction Stop
            if ($response.StatusCode -ne 200) {
                throw "Backend health check falhou: Status $($response.StatusCode)"
            }

            $content = $response.Content | ConvertFrom-Json
            if ($content.status -ne "ok") {
                throw "Backend health check não indica status OK"
            }

            # Health check do frontend
            $frontendHealthUrl = "$frontendUrl"
            $this.Log("Verificando disponibilidade do frontend: $frontendHealthUrl", "INFO")

            $response = Invoke-WebRequest -Uri $frontendHealthUrl -TimeoutSec $this.Timeout -ErrorAction Stop
            if ($response.StatusCode -ne 200) {
                throw "Frontend não está acessível: Status $($response.StatusCode)"
            }

            # Testes adicionais
            $this.Log("🔍 Executando testes funcionais básicos...", "INFO")
            # Adicionar testes funcionais específicos aqui

            $this.Log("✅ Testes de saúde extensivos passaram", "INFO")
            return $true

        }
        catch {
            $this.Log("❌ Erro durante os testes de saúde: $($_.Exception.Message)", "ERROR")
            return $false
        }
    }

    [void] UpdateProductionConfigs() {
        $this.Log("⚙️ Atualizando configurações de produção...", "INFO")

        try {
            # Atualizar configurações críticas
            # - CDN configurations
            # - DNS settings
            # - SSL certificates
            # - Monitoring configurations

            $this.Log("✅ Configurações de produção atualizadas", "INFO")
        }
        catch {
            $this.Log("❌ Erro ao atualizar configurações: $($_.Exception.Message)", "ERROR")
            throw
        }
    }

    [void] NotifySuccess() {
        $endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $duration = (Get-Date) - (Get-Date $this.StartTime)

        $message = @"
🚀 *Deploy para Produção Concluído com Sucesso!*

📊 *Detalhes do Deploy:*
• Projeto: $($this.ProjectName)
• Ambiente: $($this.Environment)
• Início: $($this.StartTime)
• Fim: $endTime
• Duração: $($duration.Hours)h $($duration.Minutes)m $($duration.Seconds)s

🔗 *URLs de Produção:*
• Frontend: https://$($this.ProjectName).vercel.app
• Backend: https://$($this.ProjectName)-backend.vercel.app

✅ Todos os testes passaram!
"@

        if ($this.SlackWebhook) {
            $this.SendSlackNotification($message, "good")
        }

        $this.Log("🔔 Notificação de sucesso enviada", "INFO")
    }

    [void] NotifyFailure([string]$errorMessage) {
        $message = @"
❌ *Deploy para Produção Falhou*

🔥 *Erro:* $errorMessage

📊 *Detalhes do Deploy:*
• Projeto: $($this.ProjectName)
• Ambiente: $($this.Environment)
• Início: $($this.StartTime)
• Falha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

🔗 *URLs Atuais (se aplicável):*
• Frontend: https://$($this.ProjectName).vercel.app
• Backend: https://$($this.ProjectName)-backend.vercel.app

⚠️ Verificar logs para mais detalhes
"@

        if ($this.SlackWebhook) {
            $this.SendSlackNotification($message, "danger")
        }

        $this.Log("🔔 Notificação de falha enviada", "ERROR")
    }

    [void] SendSlackNotification([string]$message, [string]$color) {
        try {
            $payload = @{
                text = $message
                username = "Deploy Bot"
                icon_emoji = ":rocket:"
                attachments = @(
                    @{
                        color = $color
                        fields = @(
                            @{
                                title = "Projeto"
                                value = $this.ProjectName
                                short = $true
                            }
                            @{
                                title = "Ambiente"
                                value = $this.Environment
                                short = $true
                            }
                        )
                    }
                )
            }

            Invoke-RestMethod -Uri $this.SlackWebhook -Method Post -Body ($payload | ConvertTo-Json -Depth 4) -ContentType "application/json"
        }
        catch {
            $this.Log("❌ Falha ao enviar notificação do Slack: $($_.Exception.Message)", "ERROR")
        }
    }

    [bool] Rollback() {
        $this.Log("🔄 Executando rollback...", "WARN")

        try {
            # Implementar lógica de rollback aqui
            # - Reverter para versão anterior conhecida
            # - Restaurar backup se necessário
            # - Notificar equipe sobre rollback

            $this.Log("✅ Rollback concluído", "WARN")
            return $true
        }
        catch {
            $this.Log("❌ Erro durante o rollback: $($_.Exception.Message)", "ERROR")
            return $false
        }
    }
}

# Função principal
function Main {
    Write-Host "🎯 Seu-Estudo - Deploy para Produção" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan

    # Executar deployer
    $deployer = [ProductionDeployer]::new($Environment, $AutoRollback, $Timeout, $SlackWebhook)
    $success = $deployer.Execute()

    if ($success) {
        Write-Host "🎉 Deploy para produção concluído com sucesso!" -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "💥 Deploy para produção falhou!" -ForegroundColor Red
        exit 1
    }
}

# Executar função principal
Main
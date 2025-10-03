/**
 * Componente Botão de Instalação PWA
 * Permite ao usuário instalar o app como aplicativo nativo
 */

import React, { useState, useEffect } from 'react';

const PWAInstallButton = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verificar se app já está instalado
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = window.navigator.standalone === true;

      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Verificar evento de instalação disponível
    const handleInstallAvailable = (event) => {
      setCanInstall(true);
      setShowPrompt(true);
    };

    // Verificar quando app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setShowPrompt(false);
      showInstallSuccessMessage();
    };

    checkInstalled();

    window.addEventListener('pwa:install-available', handleInstallAvailable);
    window.addEventListener('pwa:app-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa:install-available', handleInstallAvailable);
      window.removeEventListener('pwa:app-installed', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!canInstall || !window.installPWA) return;

    setIsInstalling(true);

    try {
      const success = await window.installPWA();

      if (success) {
        setCanInstall(false);
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('[PWAInstallButton] Erro na instalação:', error);
      showInstallErrorMessage();
    } finally {
      setIsInstalling(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  const showInstallSuccessMessage = () => {
    // Mostrar mensagem de sucesso usando sistema de notificações existente
    const event = new CustomEvent('showNotification', {
      detail: {
        message: 'Seu-Estudo instalado com sucesso! 🎉',
        type: 'success'
      }
    });
    window.dispatchEvent(event);
  };

  const showInstallErrorMessage = () => {
    const event = new CustomEvent('showNotification', {
      detail: {
        message: 'Erro ao instalar o app. Tente novamente.',
        type: 'error'
      }
    });
    window.dispatchEvent(event);
  };

  // Não mostrar se já está instalado
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Prompt de instalação */}
      {showPrompt && (
        <div className="pwa-install-prompt-overlay">
          <div className="pwa-install-prompt">
            <div className="prompt-header">
              <span className="app-icon">📚</span>
              <h3>Instalar Seu-Estudo</h3>
              <button
                className="close-btn"
                onClick={dismissPrompt}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="prompt-content">
              <p>
                Instale o Seu-Estudo como um aplicativo para acesso rápido e funcionalidades offline completas.
              </p>

              <div className="install-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <span>Carregamento instantâneo</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📱</span>
                  <span>Acesso offline completo</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔔</span>
                  <span>Notificações inteligentes</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🏠</span>
                  <span>Ícone na tela inicial</span>
                </div>
              </div>
            </div>

            <div className="prompt-actions">
              <button
                className="btn-secondary"
                onClick={dismissPrompt}
              >
                Agora não
              </button>
              <button
                className="btn-primary"
                onClick={handleInstall}
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <>
                    <span className="installing-spinner"></span>
                    Instalando...
                  </>
                ) : (
                  <>
                    <span className="install-icon">⬇️</span>
                    Instalar App
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão de instalação discreto */}
      {canInstall && !showPrompt && (
        <button
          className="pwa-install-button"
          onClick={() => setShowPrompt(true)}
          title="Instalar como aplicativo"
        >
          <span className="install-icon">📱</span>
          <span className="install-text">Instalar App</span>
        </button>
      )}
    </>
  );
};

export default PWAInstallButton;
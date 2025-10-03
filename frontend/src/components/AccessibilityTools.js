// Componente de Ferramentas de Acessibilidade Avançada
import React, { useState, useEffect } from 'react';
import '../styles/AccessibilityTools.css';

const AccessibilityTools = ({
  onFontSizeChange,
  onHighContrastToggle,
  onScreenReaderToggle,
  onKeyboardNavigationToggle
}) => {
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);

  useEffect(() => {
    // Inicializar reconhecimento de voz se suportado
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
        announceToScreenReader('🎤 Ouvindo comandos de voz...');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        handleVoiceCommand(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
        announceToScreenReader('❌ Erro no reconhecimento de voz');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setSpeechRecognition(recognition);
    }

    // Aplicar configurações salvas
    loadAccessibilitySettings();

    // Anunciar componente para leitores de tela
    announceToScreenReader('🔧 Ferramentas de acessibilidade carregadas');
  }, []);

  const loadAccessibilitySettings = () => {
    try {
      const settings = localStorage.getItem('accessibility-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setFontSize(parsed.fontSize || 'medium');
        setHighContrast(parsed.highContrast || false);
        setScreenReader(parsed.screenReader || false);
        setKeyboardNavigation(parsed.keyboardNavigation !== false);
        setVoiceCommands(parsed.voiceCommands || false);

        // Aplicar configurações
        applyAccessibilitySettings(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de acessibilidade:', error);
    }
  };

  const saveAccessibilitySettings = (settings) => {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));

      // Aplicar configurações
      applyAccessibilitySettings(settings);

      // Anunciar mudanças
      announceToScreenReader('✅ Configurações de acessibilidade salvas');

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      announceToScreenReader('❌ Erro ao salvar configurações');
    }
  };

  const applyAccessibilitySettings = (settings) => {
    const root = document.documentElement;

    // Aplicar tamanho da fonte
    root.style.setProperty('--font-size-multiplier',
      settings.fontSize === 'small' ? '0.9' :
      settings.fontSize === 'large' ? '1.2' :
      settings.fontSize === 'extra-large' ? '1.4' : '1.0'
    );

    // Aplicar alto contraste
    if (settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Aplicar navegação por teclado
    if (settings.keyboardNavigation) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }

    // Notificar callbacks
    if (onFontSizeChange) onFontSizeChange(settings.fontSize);
    if (onHighContrastToggle) onHighContrastToggle(settings.highContrast);
    if (onScreenReaderToggle) onScreenReaderToggle(settings.screenReader);
    if (onKeyboardNavigationToggle) onKeyboardNavigationToggle(settings.keyboardNavigation);
  };

  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    const settings = {
      fontSize: newSize,
      highContrast,
      screenReader,
      keyboardNavigation,
      voiceCommands
    };
    saveAccessibilitySettings(settings);
  };

  const handleHighContrastToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    const settings = {
      fontSize,
      highContrast: newValue,
      screenReader,
      keyboardNavigation,
      voiceCommands
    };
    saveAccessibilitySettings(settings);
  };

  const handleScreenReaderToggle = () => {
    const newValue = !screenReader;
    setScreenReader(newValue);

    if (newValue) {
      announceToScreenReader('🔊 Leitor de tela ativado. Use as ferramentas para melhor experiência.');
    } else {
      announceToScreenReader('🔇 Leitor de tela desativado.');
    }

    const settings = {
      fontSize,
      highContrast,
      screenReader: newValue,
      keyboardNavigation,
      voiceCommands
    };
    saveAccessibilitySettings(settings);
  };

  const handleKeyboardNavigationToggle = () => {
    const newValue = !keyboardNavigation;
    setKeyboardNavigation(newValue);

    if (newValue) {
      announceToScreenReader('⌨️ Navegação por teclado ativada. Use Tab para navegar.');
    } else {
      announceToScreenReader('🖱️ Navegação por teclado desativada.');
    }

    const settings = {
      fontSize,
      highContrast,
      screenReader,
      keyboardNavigation: newValue,
      voiceCommands
    };
    saveAccessibilitySettings(settings);
  };

  const handleVoiceCommandsToggle = () => {
    const newValue = !voiceCommands;
    setVoiceCommands(newValue);

    if (newValue) {
      announceToScreenReader('🎤 Comandos de voz ativados. Clique no microfone para falar.');
    } else {
      announceToScreenReader('🔇 Comandos de voz desativados.');
    }

    const settings = {
      fontSize,
      highContrast,
      screenReader,
      keyboardNavigation,
      voiceCommands: newValue
    };
    saveAccessibilitySettings(settings);
  };

  const startVoiceRecognition = () => {
    if (speechRecognition && !isListening) {
      try {
        speechRecognition.start();
      } catch (error) {
        console.error('Erro ao iniciar reconhecimento de voz:', error);
        announceToScreenReader('❌ Erro ao iniciar reconhecimento de voz');
      }
    }
  };

  const stopVoiceRecognition = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  };

  const handleVoiceCommand = (command) => {
    console.log('🎤 Comando de voz reconhecido:', command);
    announceToScreenReader(`🎤 Comando reconhecido: ${command}`);

    // Processar comandos de voz
    if (command.includes('aumentar fonte') || command.includes('fonte maior')) {
      const sizes = ['small', 'medium', 'large', 'extra-large'];
      const currentIndex = sizes.indexOf(fontSize);
      if (currentIndex < sizes.length - 1) {
        handleFontSizeChange(sizes[currentIndex + 1]);
      }
    }

    else if (command.includes('diminuir fonte') || command.includes('fonte menor')) {
      const sizes = ['small', 'medium', 'large', 'extra-large'];
      const currentIndex = sizes.indexOf(fontSize);
      if (currentIndex > 0) {
        handleFontSizeChange(sizes[currentIndex - 1]);
      }
    }

    else if (command.includes('alto contraste') || command.includes('contraste alto')) {
      handleHighContrastToggle();
    }

    else if (command.includes('leitor de tela') || command.includes('tela leitor')) {
      handleScreenReaderToggle();
    }

    else if (command.includes('ajuda') || command.includes('comandos')) {
      announceToScreenReader(`
        🎤 Comandos disponíveis:
        - "Aumentar fonte" ou "Fonte maior"
        - "Diminuir fonte" ou "Fonte menor"
        - "Alto contraste" ou "Contraste alto"
        - "Leitor de tela" ou "Tela leitor"
        - "Navegação teclado" ou "Teclado navegação"
        - "Ajuda" ou "comandos"
      `);
    }

    else {
      announceToScreenReader(`❓ Comando não reconhecido: ${command}`);
    }
  };

  const announceToScreenReader = (message) => {
    if (screenReader && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const resetAccessibilitySettings = () => {
    const defaultSettings = {
      fontSize: 'medium',
      highContrast: false,
      screenReader: false,
      keyboardNavigation: true,
      voiceCommands: false
    };

    setFontSize('medium');
    setHighContrast(false);
    setScreenReader(false);
    setKeyboardNavigation(true);
    setVoiceCommands(false);

    saveAccessibilitySettings(defaultSettings);
    announceToScreenReader('🔄 Configurações de acessibilidade resetadas');
  };

  return (
    <div className="accessibility-tools">
      <div className="accessibility-panel">
        <h3 className="panel-title">🔧 Ferramentas de Acessibilidade</h3>

        {/* Controle de Tamanho da Fonte */}
        <div className="control-group">
          <label className="control-label">📝 Tamanho da Fonte</label>
          <div className="font-size-controls">
            {['small', 'medium', 'large', 'extra-large'].map(size => (
              <button
                key={size}
                className={`font-size-button ${fontSize === size ? 'active' : ''}`}
                onClick={() => handleFontSizeChange(size)}
                aria-label={`Fonte ${size === 'small' ? 'pequena' : size === 'medium' ? 'média' : size === 'large' ? 'grande' : 'extra grande'}`}
              >
                {size === 'small' ? 'P' : size === 'medium' ? 'M' : size === 'large' ? 'G' : 'GG'}
              </button>
            ))}
          </div>
        </div>

        {/* Alto Contraste */}
        <div className="control-group">
          <label className="control-label">🎨 Alto Contraste</label>
          <button
            className={`toggle-button ${highContrast ? 'active' : ''}`}
            onClick={handleHighContrastToggle}
            aria-pressed={highContrast}
            aria-label="Alternar alto contraste"
          >
            {highContrast ? '✅ Ativado' : '❌ Desativado'}
          </button>
        </div>

        {/* Leitor de Tela */}
        <div className="control-group">
          <label className="control-label">🔊 Leitor de Tela</label>
          <button
            className={`toggle-button ${screenReader ? 'active' : ''}`}
            onClick={handleScreenReaderToggle}
            aria-pressed={screenReader}
            aria-label="Alternar leitor de tela"
          >
            {screenReader ? '✅ Ativado' : '❌ Desativado'}
          </button>
        </div>

        {/* Navegação por Teclado */}
        <div className="control-group">
          <label className="control-label">⌨️ Navegação por Teclado</label>
          <button
            className={`toggle-button ${keyboardNavigation ? 'active' : ''}`}
            onClick={handleKeyboardNavigationToggle}
            aria-pressed={keyboardNavigation}
            aria-label="Alternar navegação por teclado"
          >
            {keyboardNavigation ? '✅ Ativada' : '❌ Desativada'}
          </button>
        </div>

        {/* Comandos de Voz */}
        <div className="control-group">
          <label className="control-label">🎤 Comandos de Voz</label>
          <div className="voice-controls">
            <button
              className={`toggle-button ${voiceCommands ? 'active' : ''}`}
              onClick={handleVoiceCommandsToggle}
              aria-pressed={voiceCommands}
              aria-label="Alternar comandos de voz"
            >
              {voiceCommands ? '✅ Ativado' : '❌ Desativado'}
            </button>

            {voiceCommands && speechRecognition && (
              <button
                className={`voice-button ${isListening ? 'listening' : ''}`}
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                aria-label={isListening ? 'Parar reconhecimento de voz' : 'Iniciar reconhecimento de voz'}
              >
                {isListening ? '🎤🔴 Ouvindo...' : '🎤 Ouvir'}
              </button>
            )}
          </div>
        </div>

        {/* Atalhos de Teclado */}
        <div className="control-group">
          <label className="control-label">⌨️ Atalhos de Teclado</label>
          <div className="keyboard-shortcuts">
            <div className="shortcut-item">
              <kbd className="kbd">Tab</kbd>
              <span>Navegar entre elementos</span>
            </div>
            <div className="shortcut-item">
              <kbd className="kbd">Enter</kbd>
              <span>Ativar botão/focar elemento</span>
            </div>
            <div className="shortcut-item">
              <kbd className="kbd">Esc</kbd>
              <span>Fechar modal/sair</span>
            </div>
            <div className="shortcut-item">
              <kbd className="kbd">Alt + 1</kbd>
              <span>Ir para conteúdo principal</span>
            </div>
            <div className="shortcut-item">
              <kbd className="kbd">Alt + 2</kbd>
              <span>Ir para navegação</span>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="control-group">
          <button
            className="reset-button"
            onClick={resetAccessibilitySettings}
            aria-label="Resetar configurações de acessibilidade"
          >
            🔄 Resetar Configurações
          </button>
        </div>
      </div>

      {/* Indicador de Navegação por Teclado */}
      {keyboardNavigation && (
        <div className="keyboard-indicator" aria-hidden="true">
          ⌨️ Navegação por teclado ativa
        </div>
      )}

      {/* Área de Anúncios para Leitor de Tela */}
      <div className="screen-reader-area" aria-live="polite" aria-atomic="true">
        {/* Área para anúncios dinâmicos */}
      </div>
    </div>
  );
};

export default AccessibilityTools;
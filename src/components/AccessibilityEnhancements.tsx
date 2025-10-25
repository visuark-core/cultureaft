import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Type, 
  Contrast, 
  MousePointer,
  Keyboard,
  Settings,
  RotateCcw,
  Zap
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindFriendly: boolean;
  fontSize: number; // percentage
  lineHeight: number; // multiplier
}

const AccessibilityEnhancements: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicators: true,
    colorBlindFriendly: false,
    fontSize: 100,
    lineHeight: 1.5
  });

  useEffect(() => {
    // Load saved accessibility settings
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }

    // Check for system preferences
    checkSystemPreferences();
  }, []);

  const checkSystemPreferences = () => {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }

    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }

    // Check for color scheme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }
  };

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Apply high contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply large text
    if (newSettings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Apply reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply color blind friendly mode
    if (newSettings.colorBlindFriendly) {
      root.classList.add('color-blind-friendly');
    } else {
      root.classList.remove('color-blind-friendly');
    }

    // Apply enhanced focus indicators
    if (newSettings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Apply font size
    root.style.setProperty('--accessibility-font-size', `${newSettings.fontSize}%`);
    
    // Apply line height
    root.style.setProperty('--accessibility-line-height', newSettings.lineHeight.toString());

    // Save settings
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
  };

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true,
      colorBlindFriendly: false,
      fontSize: 100,
      lineHeight: 1.5
    };
    
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  const announceToScreenReader = (message: string) => {
    if (settings.screenReader) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <Eye className="h-6 w-6" />
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed right-4 bottom-20 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Accessibility</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close accessibility settings"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>

            {/* Settings */}
            <div className="p-4 space-y-4">
              {/* Visual Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Visual
                </h3>
                
                <div className="space-y-3">
                  {/* High Contrast */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">High Contrast</span>
                    <button
                      onClick={() => {
                        updateSetting('highContrast', !settings.highContrast);
                        announceToScreenReader(`High contrast ${!settings.highContrast ? 'enabled' : 'disabled'}`);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      aria-pressed={settings.highContrast}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  {/* Large Text */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Large Text</span>
                    <button
                      onClick={() => {
                        updateSetting('largeText', !settings.largeText);
                        announceToScreenReader(`Large text ${!settings.largeText ? 'enabled' : 'disabled'}`);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        settings.largeText ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      aria-pressed={settings.largeText}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.largeText ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  {/* Font Size Slider */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Font Size: {settings.fontSize}%
                    </label>
                    <input
                      type="range"
                      min="75"
                      max="150"
                      step="5"
                      value={settings.fontSize}
                      onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Font size percentage"
                    />
                  </div>

                  {/* Color Blind Friendly */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Color Blind Friendly</span>
                    <button
                      onClick={() => {
                        updateSetting('colorBlindFriendly', !settings.colorBlindFriendly);
                        announceToScreenReader(`Color blind friendly mode ${!settings.colorBlindFriendly ? 'enabled' : 'disabled'}`);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        settings.colorBlindFriendly ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      aria-pressed={settings.colorBlindFriendly}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.colorBlindFriendly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Motion Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Motion
                </h3>
                
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Reduced Motion</span>
                  <button
                    onClick={() => {
                      updateSetting('reducedMotion', !settings.reducedMotion);
                      announceToScreenReader(`Reduced motion ${!settings.reducedMotion ? 'enabled' : 'disabled'}`);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-pressed={settings.reducedMotion}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Navigation Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <Keyboard className="h-4 w-4 mr-2" />
                  Navigation
                </h3>
                
                <div className="space-y-3">
                  {/* Enhanced Focus Indicators */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Enhanced Focus</span>
                    <button
                      onClick={() => {
                        updateSetting('focusIndicators', !settings.focusIndicators);
                        announceToScreenReader(`Enhanced focus indicators ${!settings.focusIndicators ? 'enabled' : 'disabled'}`);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        settings.focusIndicators ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      aria-pressed={settings.focusIndicators}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  {/* Screen Reader Announcements */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Screen Reader Support</span>
                    <button
                      onClick={() => {
                        updateSetting('screenReader', !settings.screenReader);
                        announceToScreenReader(`Screen reader support ${!settings.screenReader ? 'enabled' : 'disabled'}`);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        settings.screenReader ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      aria-pressed={settings.screenReader}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.screenReader ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    resetSettings();
                    announceToScreenReader('Accessibility settings reset to default');
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset to Default</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Accessibility Styles */}
      <style jsx global>{`
        /* High Contrast Mode */
        .high-contrast {
          --tw-bg-white: #000000;
          --tw-text-gray-900: #ffffff;
          --tw-text-gray-700: #ffffff;
          --tw-text-gray-600: #cccccc;
          --tw-border-gray-200: #ffffff;
          --tw-bg-gray-50: #333333;
        }

        .high-contrast * {
          border-color: #ffffff !important;
        }

        .high-contrast .bg-white {
          background-color: #000000 !important;
          color: #ffffff !important;
        }

        .high-contrast .text-gray-900,
        .high-contrast .text-gray-800,
        .high-contrast .text-gray-700 {
          color: #ffffff !important;
        }

        /* Large Text Mode */
        .large-text {
          font-size: 120% !important;
        }

        .large-text * {
          font-size: inherit !important;
        }

        /* Reduced Motion */
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }

        /* Enhanced Focus Indicators */
        .enhanced-focus *:focus {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 5px #3b82f6 !important;
        }

        /* Color Blind Friendly */
        .color-blind-friendly .text-red-600,
        .color-blind-friendly .bg-red-600 {
          background-color: #0066cc !important;
          color: #ffffff !important;
        }

        .color-blind-friendly .text-green-600,
        .color-blind-friendly .bg-green-600 {
          background-color: #009900 !important;
          color: #ffffff !important;
        }

        /* Font Size and Line Height */
        html {
          font-size: var(--accessibility-font-size, 100%) !important;
          line-height: var(--accessibility-line-height, 1.5) !important;
        }

        /* Screen Reader Only */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </>
  );
};

export default AccessibilityEnhancements;
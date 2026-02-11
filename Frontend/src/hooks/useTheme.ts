import { useEffect } from 'react';

interface AppearanceSettings {
  theme?: 'light' | 'dark' | 'auto';
  customTheme?: boolean;
  primaryColor?: string;
  accentColor?: string;
  fontSize?: number;
  fontFamily?: string;
  reducedMotion?: boolean;
  highContrast?: boolean;
  density?: 'compact' | 'comfortable' | 'spacious';
  compactMode?: boolean;
  customCSS?: string;
  animationsEnabled?: boolean;
  sidebarCollapsed?: boolean;
  showStatusIndicators?: boolean;
  customPresets?: Array<{name: string, colors: any}>;
  activePreset?: string | null;
}

const applyThemeSettings = (settings?: AppearanceSettings) => {
  const root = document.documentElement;
  const body = document.body;
  
  // Get settings from parameter or localStorage
  const themeSettings = settings || JSON.parse(localStorage.getItem('appearance_settings') || '{}');
  
  // Apply theme
  root.classList.remove('light', 'dark');
  if (themeSettings.theme === 'dark') {
    root.classList.add('dark');
  } else if (themeSettings.theme === 'light') {
    root.classList.add('light');
  } else {
    // Auto theme based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  }
  
  // Apply custom colors if enabled
  if (themeSettings.customTheme) {
    root.style.setProperty('--primary-color', themeSettings.primaryColor || '#8b5cf6');
    root.style.setProperty('--accent-color', themeSettings.accentColor || '#3b82f6');
  } else {
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--accent-color');
  }
  
  // Apply font settings
  root.style.setProperty('--font-size-base', `${themeSettings.fontSize || 16}px`);
  root.style.setProperty('--font-family', `${themeSettings.fontFamily || 'Inter'}, system-ui, sans-serif`);
  
  // Apply accessibility settings
  if (themeSettings.reducedMotion) {
    root.style.setProperty('--transition-duration', '0ms');
    body.setAttribute('data-reduced-motion', 'true');
  } else {
    root.style.removeProperty('--transition-duration');
    body.removeAttribute('data-reduced-motion');
  }
  
  if (themeSettings.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  // Apply density settings
  root.setAttribute('data-density', themeSettings.density || 'comfortable');
  if (themeSettings.compactMode) {
    root.setAttribute('data-compact', 'true');
  } else {
    root.removeAttribute('data-compact');
  }
};

export const useTheme = () => {
  useEffect(() => {
    // Apply theme immediately on hook mount
    applyThemeSettings();
    
    // Listen for system theme changes if auto mode is enabled
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const settings = JSON.parse(localStorage.getItem('appearance_settings') || '{}');
      if (settings.theme === 'auto') {
        applyThemeSettings(settings);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
};

export { applyThemeSettings };

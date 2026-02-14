// services/userPreferences.ts
import { authService } from './auth';

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

class UserPreferencesService {
  private readonly APPEARANCE_KEY_PREFIX = 'appearance_settings_';
  private readonly DEFAULT_SETTINGS: AppearanceSettings = {
    theme: 'dark',
    customTheme: false,
    primaryColor: '#8b5cf6',
    accentColor: '#3b82f6',
    fontSize: 16,
    fontFamily: 'Inter',
    reducedMotion: false,
    highContrast: false,
    density: 'comfortable',
    compactMode: false,
    customCSS: '',
    animationsEnabled: true,
    sidebarCollapsed: false,
    showStatusIndicators: true,
    customPresets: [],
    activePreset: null
  };

  // Get current user ID safely
  private getCurrentUserId(): string | null {
    try {
      const user = authService.getCurrentUser();
      return user?._id || user?.id || null;
    } catch {
      return null;
    }
  }

  // Get user-specific storage key
  private getUserStorageKey(): string | null {
    const userId = this.getCurrentUserId();
    return userId ? `${this.APPEARANCE_KEY_PREFIX}${userId}` : null;
  }

  // Safe localStorage operations
  private safeGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeSetItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail - could be localStorage full or disabled
    }
  }

  private safeRemoveItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  }

  // Get user's appearance settings
  getAppearanceSettings(): AppearanceSettings {
    const storageKey = this.getUserStorageKey();
    
    if (!storageKey) {
      // No user logged in, return defaults
      return { ...this.DEFAULT_SETTINGS };
    }

    try {
      const settings = this.safeGetItem(storageKey);
      if (settings) {
        const parsed = JSON.parse(settings);
        return { ...this.DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to parse appearance settings, using defaults');
      // Clear corrupted data
      this.safeRemoveItem(storageKey);
    }

    return { ...this.DEFAULT_SETTINGS };
  }

  // Save user's appearance settings
  saveAppearanceSettings(settings: Partial<AppearanceSettings>): void {
    const storageKey = this.getUserStorageKey();
    
    if (!storageKey) {
      console.warn('Cannot save appearance settings: no user logged in');
      return;
    }

    try {
      const currentSettings = this.getAppearanceSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      this.safeSetItem(storageKey, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save appearance settings:', error);
    }
  }

  // Clear user's appearance settings
  clearAppearanceSettings(): void {
    const storageKey = this.getUserStorageKey();
    
    if (storageKey) {
      this.safeRemoveItem(storageKey);
    }
  }

  // Reset to defaults
  resetAppearanceSettings(): void {
    this.saveAppearanceSettings(this.DEFAULT_SETTINGS);
  }

  // Clean up old appearance settings (for maintenance)
  cleanupOldAppearanceSettings(): void {
    try {
      const keys = Object.keys(localStorage);
      const appearanceKeys = keys.filter(key => 
        key.startsWith(this.APPEARANCE_KEY_PREFIX)
      );

      // Remove settings for users that are no longer logged in
      const currentUserId = this.getCurrentUserId();
      const currentKey = currentUserId ? `${this.APPEARANCE_KEY_PREFIX}${currentUserId}` : null;

      appearanceKeys.forEach(key => {
        if (key !== currentKey) {
          this.safeRemoveItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup old appearance settings:', error);
    }
  }

  // Migrate from old appearance_settings to user-specific
  migrateFromGlobalSettings(): void {
    try {
      const oldSettings = this.safeGetItem('appearance_settings');
      if (oldSettings) {
        const userId = this.getCurrentUserId();
        if (userId) {
          // Migrate to user-specific key
          const newKey = `${this.APPEARANCE_KEY_PREFIX}${userId}`;
          this.safeSetItem(newKey, oldSettings);
          this.safeRemoveItem('appearance_settings');
          console.log('Migrated appearance settings to user-specific storage');
        }
      }
    } catch (error) {
      console.warn('Failed to migrate appearance settings:', error);
    }
  }
}

export const userPreferencesService = new UserPreferencesService();
export type { AppearanceSettings };

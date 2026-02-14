// services/sessionManager.ts
interface SessionData {
  sessionId: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
  isActive: boolean;
}

interface PendingUpgrade {
  userId: string;
  plan: string;
  paymentTxRef: string;
  timestamp?: number;
}

class SessionManager {
  private readonly SESSION_KEY = 'user_sessions';
  private readonly PENDING_UPGRADE_KEY = 'pending_upgrade';
  private readonly SESSION_EXPIRY_HOURS = 24;
  private readonly PAYMENT_EXPIRY_HOURS = 1;

  // Safe localStorage operations with error handling
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

  // Session management
  getSessions(): SessionData[] {
    try {
      const sessions = this.safeGetItem(this.SESSION_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch {
      this.safeRemoveItem(this.SESSION_KEY);
      return [];
    }
  }

  addSession(sessionData: SessionData): void {
    const sessions = this.getSessions();
    sessions.push(sessionData);
    this.safeSetItem(this.SESSION_KEY, JSON.stringify(sessions));
  }

  removeSession(sessionId: string): void {
    const sessions = this.getSessions();
    const filtered = sessions.filter(s => s.sessionId !== sessionId);
    this.safeSetItem(this.SESSION_KEY, JSON.stringify(filtered));
  }

  clearSessions(): void {
    this.safeRemoveItem(this.SESSION_KEY);
  }

  // Clean up stale sessions
  cleanupStaleSessions(): boolean {
    const sessions = this.getSessions();
    if (sessions.length === 0) return false;

    const expiryTime = Date.now() - (this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    const validSessions = sessions.filter(session => {
      try {
        const sessionTime = new Date(session.lastActive).getTime();
        return sessionTime > expiryTime;
      } catch {
        return false;
      }
    });

    if (validSessions.length !== sessions.length) {
      this.safeSetItem(this.SESSION_KEY, JSON.stringify(validSessions));
      return true;
    }
    return false;
  }

  // Pending upgrade management
  getPendingUpgrade(): PendingUpgrade | null {
    try {
      const upgrade = this.safeGetItem(this.PENDING_UPGRADE_KEY);
      return upgrade ? JSON.parse(upgrade) : null;
    } catch {
      this.safeRemoveItem(this.PENDING_UPGRADE_KEY);
      return null;
    }
  }

  setPendingUpgrade(data: PendingUpgrade): void {
    const upgradeWithTimestamp = {
      ...data,
      timestamp: Date.now()
    };
    this.safeSetItem(this.PENDING_UPGRADE_KEY, JSON.stringify(upgradeWithTimestamp));
  }

  clearPendingUpgrade(): void {
    this.safeRemoveItem(this.PENDING_UPGRADE_KEY);
  }

  // Clean up stale pending upgrades
  cleanupStalePendingUpgrades(): boolean {
    const upgrade = this.getPendingUpgrade();
    if (!upgrade) return false;

    const expiryTime = Date.now() - (this.PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
    const timestamp = upgrade.timestamp || 0;

    if (timestamp < expiryTime) {
      this.clearPendingUpgrade();
      return true;
    }
    return false;
  }

  // Comprehensive cleanup
  performCleanup(): { sessionsCleared: boolean; upgradeCleared: boolean } {
    const sessionsCleared = this.cleanupStaleSessions();
    const upgradeCleared = this.cleanupStalePendingUpgrades();
    
    return { sessionsCleared, upgradeCleared };
  }

  // Validate current session state
  validateSessionState(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const authToken = this.safeGetItem('auth_token');
    const userData = this.safeGetItem('user_data');
    const sessions = this.getSessions();

    if (!authToken && sessions.length > 0) {
      issues.push('Sessions exist without auth token');
    }

    if (!userData && sessions.length > 0) {
      issues.push('Sessions exist without user data');
    }

    const upgrade = this.getPendingUpgrade();
    if (upgrade && !authToken) {
      issues.push('Pending upgrade exists without auth token');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

export const sessionManager = new SessionManager();
export type { SessionData, PendingUpgrade };

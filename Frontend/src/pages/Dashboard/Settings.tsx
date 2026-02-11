import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUser } from '../../context/UserContext';
import { applyThemeSettings } from '../../hooks/useTheme';
import { 
  Shield, 
  Palette,
  Save,
  Eye,
  EyeOff,
  LogOut,
  Download,
  Upload,
  Smartphone,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Monitor,
  Moon,
  Sun,
  Zap,
  FileText
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState<'security' | 'appearance'>('security');
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  // Password modal state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });


  // Advanced Appearance State
  const [advancedAppearance, setAdvancedAppearance] = useState<{
    customTheme: boolean;
    primaryColor: string;
    accentColor: string;
    customCSS: string;
    animationsEnabled: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: number;
    fontFamily: string;
    sidebarCollapsed: boolean;
    showStatusIndicators: boolean;
    theme: 'light' | 'dark' | 'auto';
    density: 'compact' | 'comfortable' | 'spacious';
    compactMode: boolean;
    customPresets: Array<{name: string, colors: any}>;
    activePreset: string | null;
  }>({
    customTheme: false,
    primaryColor: '#8b5cf6',
    accentColor: '#3b82f6',
    customCSS: '',
    animationsEnabled: true,
    reducedMotion: false,
    highContrast: false,
    fontSize: 16,
    fontFamily: 'Inter',
    sidebarCollapsed: false,
    showStatusIndicators: true,
    theme: 'dark',
    density: 'comfortable',
    compactMode: false,
    customPresets: [] as Array<{name: string, colors: any}>,
    activePreset: null as string | null
  });

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const handleSaveAppearance = async () => {
    setSaving(true);
    try {
      // Save to localStorage for persistence
      localStorage.setItem('appearance_settings', JSON.stringify(advancedAppearance));
      
      // Apply theme to document using the global function
      applyThemeSettings(advancedAppearance);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(
        <div className="flex items-center gap-3">
          <Save className="w-5 h-5 text-green-400" />
          <div>
            <p className="font-medium">Appearance settings saved!</p>
            <p className="text-sm opacity-90">Your preferences have been applied successfully.</p>
          </div>
        </div>,
        { duration: 4000 }
      );
    } catch (error) {
      toast.error(
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="font-medium">Failed to save settings</p>
            <p className="text-sm opacity-90">Please try again later.</p>
          </div>
        </div>,
        { duration: 4000 }
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetAppearance = () => {
    const defaultSettings: typeof advancedAppearance = {
      customTheme: false,
      primaryColor: '#8b5cf6',
      accentColor: '#3b82f6',
      customCSS: '',
      animationsEnabled: true,
      reducedMotion: false,
      highContrast: false,
      fontSize: 16,
      fontFamily: 'Inter',
      sidebarCollapsed: false,
      showStatusIndicators: true,
      theme: 'dark',
      density: 'comfortable',
      compactMode: false,
      customPresets: [],
      activePreset: null
    };
    setAdvancedAppearance(defaultSettings);
    localStorage.removeItem('appearance_settings');
    applyThemeSettings(defaultSettings);
    toast.success(
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-green-400" />
        <div>
          <p className="font-medium">Settings reset to defaults</p>
          <p className="text-sm opacity-90">All appearance settings have been restored.</p>
        </div>
      </div>,
      { duration: 4000 }
    );
  };

  // Load saved settings on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('appearance_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setAdvancedAppearance(prev => ({ 
          ...prev, 
          ...parsed,
          theme: (parsed.theme as 'light' | 'dark' | 'auto') || 'dark',
          density: (parsed.density as 'compact' | 'comfortable' | 'spacious') || 'comfortable'
        } as typeof prev));
      } catch (error) {
        console.error('Failed to load appearance settings:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fetch real sessions from backend
  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        // Fallback to current session only
        const currentSession = {
          sessionId: 'current',
          device: getDeviceInfo(),
          ip: await getClientIP(),
          location: 'Unknown',
          lastActive: 'Just now',
          current: true
        };
        setActiveSessions([currentSession]);
        setLoadingSessions(false);
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sessions/my-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle different possible data structures
        let sessions = [];
        if (data.data && data.data.sessions) {
          sessions = data.data.sessions;
        } else if (data.sessions) {
          sessions = data.sessions;
        } else if (data.data) {
          sessions = data.data;
        }
        
        // Always add current session if no sessions exist
        if (sessions.length === 0) {
          const currentIP = await getClientIP();
          
          // Try browser geolocation first (most accurate), then IP fallback
          let currentLocation = await getBrowserGeolocation();
          if (currentLocation === 'Unknown') {
            currentLocation = await getAccurateLocation(currentIP);
          }
          
          const currentSession = {
            sessionId: 'current',
            device: getDeviceInfo(),
            ip: currentIP,
            location: currentLocation,
            lastActive: 'Just now',
            current: true,
            isActive: true
          };
          
          sessions = [currentSession];
        }
        
        setActiveSessions(sessions);
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // If unauthorized, clear token and redirect to login
        if (response.status === 401) {
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
          // You might want to redirect to login here
        }
        
        // Fallback to current session only
        const currentSession = {
          sessionId: 'current',
          device: getDeviceInfo(),
          ip: await getClientIP(),
          location: 'Unknown',
          lastActive: 'Just now',
          current: true
        };
        setActiveSessions([currentSession]);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      // Fallback to current session only
      const currentSession = {
        sessionId: 'current',
        device: getDeviceInfo(),
        ip: 'Unknown',
        location: 'Unknown',
        lastActive: 'Just now',
        current: true
      };
      setActiveSessions([currentSession]);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Get device info
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let device = 'Unknown Device';
    
    if (userAgent.includes('Chrome')) device = 'Chrome';
    else if (userAgent.includes('Firefox')) device = 'Firefox';
    else if (userAgent.includes('Safari')) device = 'Safari';
    else if (userAgent.includes('Edge')) device = 'Edge';
    
    let os = 'Unknown OS';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'Mac';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('iPhone')) os = 'iPhone';
    else if (userAgent.includes('Android')) os = 'Android';
    
    return `${device} on ${os}`;
  };

  // Get client IP
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'Unknown';
    }
  };

  // Get browser geolocation (most accurate, requires one-time permission)
  const getBrowserGeolocation = async (): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('Unknown');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocoding with OpenStreetMap (free)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            
            if (data && data.address) {
              const { city, town, village, state, country } = data.address;
              const location = [city || town || village, state, country]
                .filter(Boolean)
                .join(', ');
              resolve(location || 'Unknown');
            } else {
              resolve('Unknown');
            }
          } catch (error) {
            resolve('Unknown');
          }
        },
        (error) => {
          resolve('Unknown');
        },
        {
          timeout: 10000,
          enableHighAccuracy: true
        }
      );
    });
  };

  // Get accurate location from IP using multiple services
  const getAccurateLocation = async (ip: string): Promise<string> => {
    if (ip === 'Unknown') return 'Unknown';
    
    try {
      // Method 1: ip-api.com (very accurate, free)
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,query`);
        const data = await response.json();
        if (data.status === 'success' && data.city) {
          return `${data.city}, ${data.regionName}, ${data.country}`;
        }
      } catch (e) {
        // ip-api.com failed
      }

      // Method 2: ipinfo.io (good accuracy)
      try {
        const response = await fetch(`https://ipinfo.io/${ip}/json?token=free`);
        const data = await response.json();
        if (data.city && data.country) {
          return `${data.city}, ${data.region || data.country}`;
        }
      } catch (e) {
        // ipinfo.io failed
      }

      // Method 3: ipapi.co (reliable)
      try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        if (data.city && data.country_name) {
          return `${data.city}, ${data.region}, ${data.country_name}`;
        }
      } catch (e) {
        // ipapi.co failed
      }

      // Method 4: Use timezone as last resort
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = timezone.split('/')[1]?.replace(/_/g, ' ');
      const country = timezone.split('/')[0]?.replace(/_/g, ' ');
      if (city && city !== 'Unknown') {
        return `${city}, ${country}`;
      }

      return 'Unknown';
    } catch (error) {
      return 'Unknown';
    }
  };


  // Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true; // Invalid token format
  }
};

// Load sessions on component mount
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && isTokenExpired(token)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_sessions');
      window.location.href = '/login';
      return;
    }
    fetchActiveSessions();
  }, []);

  // Also load locally stored sessions for session management
  React.useEffect(() => {
    const localSessions = JSON.parse(localStorage.getItem('user_sessions') || '[]');
    if (localSessions.length > 0) {
      setActiveSessions(localSessions);
    }
  }, []);

  // Real Session Management
  const revokeSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Test the token and validate it
      if (token) {
        if (isTokenExpired(token)) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_sessions');
          window.location.href = '/login';
          return;
        }
      } else {
        toast.error('Please login to revoke sessions');
        return;
      }
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sessions/terminate/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      
      let responseData = {};
      try {
        responseData = await response.json();
      } catch (jsonError) {
        responseData = { message: 'Invalid JSON response' };
      }
      
      if (response.ok) {
        // Remove from backend
        setActiveSessions(activeSessions.filter(session => session.sessionId !== sessionId));
        toast.success('Session revoked successfully');
        
        // Also remove from localStorage
        const localSessions = JSON.parse(localStorage.getItem('user_sessions') || '[]');
        const updatedSessions = localSessions.filter(session => session.sessionId !== sessionId);
        localStorage.setItem('user_sessions', JSON.stringify(updatedSessions));
        
        // Also remove from localStorage
      } else {
        toast.error(`Failed to revoke session: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

  const revokeAllSessions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/sessions/terminate-all-others`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setActiveSessions(activeSessions.filter(session => session.current));
        toast.success('All other sessions revoked successfully');
      } else {
        toast.error('Failed to revoke sessions');
      }
    } catch (error) {
      console.error('Failed to revoke sessions:', error);
      toast.error('Failed to revoke sessions');
    }
  };
  const exportData = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setExportProgress(i);
    }
    
    const userData = {
      profile: user,
      settings: { advancedAppearance },
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codermeet-data-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    setIsExporting(false);
    toast.success('Data exported successfully!');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          toast.success('Data imported successfully!');
          // Handle data import logic here
        } catch (error) {
          toast.error('Invalid data file');
        }
      };
      reader.readAsText(file);
    }
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Settings Navigation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-1">
        <div className="flex space-x-1">
          {[
            { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
            { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
          

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                Active Sessions
              </h3>
              
              <div className="space-y-4">
                {loadingSessions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading sessions...</p>
                  </div>
                ) : activeSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Smartphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No active sessions found</p>
                  </div>
                ) : (
                  activeSessions.map((session) => (
                  <div key={session.sessionId} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor className="w-4 h-4 text-gray-400" />
                          <h4 className="text-white font-medium">{session.device}</h4>
                          {session.current && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          <p>IP: {session.ip}</p>
                          <p>Location: {session.location}</p>
                          <p>Last active: {session.lastActive}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          onClick={() => revokeSession(session.sessionId)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
                )}

                <div className="pt-4 border-t border-gray-700">
                  <Button
                    onClick={revokeAllSessions}
                    variant="outline"
                    className="border-orange-600 text-orange-400 hover:bg-orange-600/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Revoke All Other Sessions
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Theme Selection */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-green-400" />
                Theme Selection
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" />, description: 'Bright and clean' },
                      { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" />, description: 'Easy on the eyes' },
                      { value: 'auto', label: 'Auto', icon: <Monitor className="w-4 h-4" />, description: 'Follow system' }
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => setAdvancedAppearance({...advancedAppearance, theme: theme.value as 'light' | 'dark' | 'auto', customTheme: false})}
                        className={`p-4 rounded-lg border transition-all hover:scale-105 flex flex-col items-center gap-2 ${
                          advancedAppearance.theme === theme.value && !advancedAppearance.customTheme
                            ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        {theme.icon}
                        <span className="text-sm font-medium">{theme.label}</span>
                        <span className="text-xs text-gray-400">{theme.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Preset Themes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: 'Purple', primary: '#8b5cf6', accent: '#3b82f6' },
                      { name: 'Blue', primary: '#3b82f6', accent: '#06b6d4' },
                      { name: 'Green', primary: '#10b981', accent: '#84cc16' },
                      { name: 'Orange', primary: '#f97316', accent: '#f59e0b' },
                      { name: 'Red', primary: '#ef4444', accent: '#f87171' },
                      { name: 'Pink', primary: '#ec4899', accent: '#f472b6' },
                      { name: 'Teal', primary: '#14b8a6', accent: '#06b6d4' },
                      { name: 'Indigo', primary: '#6366f1', accent: '#8b5cf6' }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => setAdvancedAppearance({
                          ...advancedAppearance, 
                          customTheme: true, 
                          primaryColor: preset.primary, 
                          accentColor: preset.accent
                        })}
                        className={`p-3 rounded-lg border transition-all hover:scale-105 ${
                          advancedAppearance.customTheme && 
                          advancedAppearance.primaryColor === preset.primary && 
                          advancedAppearance.accentColor === preset.accent
                            ? 'ring-2 ring-purple-500 border-purple-500'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        <span className="text-xs text-gray-300">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Custom Theme Editor */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Custom Theme Editor
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Enable Custom Theme</p>
                    <p className="text-gray-400 text-sm">Create your own color scheme</p>
                  </div>
                  <button
                    onClick={() => setAdvancedAppearance({...advancedAppearance, customTheme: !advancedAppearance.customTheme})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      advancedAppearance.customTheme ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        advancedAppearance.customTheme ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {advancedAppearance.customTheme && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={advancedAppearance.primaryColor}
                            onChange={(e) => setAdvancedAppearance({...advancedAppearance, primaryColor: e.target.value})}
                            className="w-12 h-12 rounded cursor-pointer border border-gray-600"
                          />
                          <input
                            type="text"
                            value={advancedAppearance.primaryColor}
                            onChange={(e) => setAdvancedAppearance({...advancedAppearance, primaryColor: e.target.value})}
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                            placeholder="#8b5cf6"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Accent Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={advancedAppearance.accentColor}
                            onChange={(e) => setAdvancedAppearance({...advancedAppearance, accentColor: e.target.value})}
                            className="w-12 h-12 rounded cursor-pointer border border-gray-600"
                          />
                          <input
                            type="text"
                            value={advancedAppearance.accentColor}
                            onChange={(e) => setAdvancedAppearance({...advancedAppearance, accentColor: e.target.value})}
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Custom CSS
                      </label>
                      <textarea
                        value={advancedAppearance.customCSS}
                        onChange={(e) => setAdvancedAppearance({...advancedAppearance, customCSS: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        placeholder="/* Add your custom CSS here */&#10;.custom-class {&#10;  color: #your-color;&#10;}"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Typography Settings */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Typography
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Font Size: {advancedAppearance.fontSize}px
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">12px</span>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={advancedAppearance.fontSize}
                      onChange={(e) => setAdvancedAppearance({...advancedAppearance, fontSize: parseInt(e.target.value)})}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-400">20px</span>
                  </div>
                  <div className="mt-2 text-center">
                    <span 
                      className="text-gray-300"
                      style={{ fontSize: `${advancedAppearance.fontSize}px` }}
                    >
                      Preview Text Size
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Font Family
                  </label>
                  <select
                    value={advancedAppearance.fontFamily}
                    onChange={(e) => setAdvancedAppearance({...advancedAppearance, fontFamily: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="Inter">Inter (Default)</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Poppins">Poppins</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="system-ui">System UI</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language & Region
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="en">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Layout & Density */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-400" />
                Layout & Density
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Interface Density
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'compact', label: 'Compact', description: 'More content visible' },
                      { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
                      { value: 'spacious', label: 'Spacious', description: 'More breathing room' }
                    ].map((density) => (
                      <button
                        key={density.value}
                        onClick={() => setAdvancedAppearance({...advancedAppearance, density: density.value as 'compact' | 'comfortable' | 'spacious'})}
                        className={`p-3 rounded-lg border transition-all ${
                          advancedAppearance.density === density.value
                            ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-sm font-medium">{density.label}</span>
                        <span className="text-xs text-gray-400 block mt-1">{density.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Compact Mode</p>
                      <p className="text-gray-400 text-sm">Reduce spacing throughout the interface</p>
                    </div>
                    <button
                      onClick={() => setAdvancedAppearance({...advancedAppearance, compactMode: !advancedAppearance.compactMode})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        advancedAppearance.compactMode ? 'bg-purple-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          advancedAppearance.compactMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Sidebar Collapsed</p>
                      <p className="text-gray-400 text-sm">Keep sidebar collapsed by default</p>
                    </div>
                    <button
                      onClick={() => setAdvancedAppearance({...advancedAppearance, sidebarCollapsed: !advancedAppearance.sidebarCollapsed})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        advancedAppearance.sidebarCollapsed ? 'bg-purple-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          advancedAppearance.sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Status Indicators</p>
                      <p className="text-gray-400 text-sm">Show online status and activity indicators</p>
                    </div>
                    <button
                      onClick={() => setAdvancedAppearance({...advancedAppearance, showStatusIndicators: !advancedAppearance.showStatusIndicators})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        advancedAppearance.showStatusIndicators ? 'bg-purple-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          advancedAppearance.showStatusIndicators ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Accessibility Features */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Accessibility
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Animations</p>
                    <p className="text-gray-400 text-sm">Enable UI animations and transitions</p>
                  </div>
                  <button
                    onClick={() => setAdvancedAppearance({...advancedAppearance, animationsEnabled: !advancedAppearance.animationsEnabled})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      advancedAppearance.animationsEnabled ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        advancedAppearance.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Reduced Motion</p>
                    <p className="text-gray-400 text-sm">Minimize animations for accessibility</p>
                  </div>
                  <button
                    onClick={() => setAdvancedAppearance({...advancedAppearance, reducedMotion: !advancedAppearance.reducedMotion})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      advancedAppearance.reducedMotion ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        advancedAppearance.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">High Contrast</p>
                    <p className="text-gray-400 text-sm">Increase contrast for better visibility</p>
                  </div>
                  <button
                    onClick={() => setAdvancedAppearance({...advancedAppearance, highContrast: !advancedAppearance.highContrast})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      advancedAppearance.highContrast ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        advancedAppearance.highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Preview & Actions Sidebar */}
          <div className="space-y-6">
            {/* Live Preview Card */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Live Preview
              </h3>
              
              <div className="space-y-4">
                <div 
                  className="p-4 rounded-lg border-2 border-dashed border-gray-700"
                  style={{
                    backgroundColor: advancedAppearance.customTheme ? `${advancedAppearance.primaryColor}10` : undefined,
                    borderColor: advancedAppearance.customTheme ? advancedAppearance.primaryColor : undefined
                  }}
                >
                  <h4 
                    className="font-medium mb-2"
                    style={{ 
                      color: advancedAppearance.customTheme ? advancedAppearance.primaryColor : undefined,
                      fontSize: `${advancedAppearance.fontSize + 2}px`,
                      fontFamily: advancedAppearance.fontFamily
                    }}
                  >
                    Sample Heading
                  </h4>
                  <p 
                    className="text-gray-300 text-sm"
                    style={{ 
                      fontSize: `${advancedAppearance.fontSize}px`,
                      fontFamily: advancedAppearance.fontFamily
                    }}
                  >
                    This is how your text will appear with the current settings. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                  <button 
                    className="mt-3 px-4 py-2 rounded text-white text-sm font-medium"
                    style={{
                      backgroundColor: advancedAppearance.customTheme ? advancedAppearance.primaryColor : undefined,
                      fontSize: `${advancedAppearance.fontSize - 2}px`,
                      fontFamily: advancedAppearance.fontFamily
                    }}
                  >
                    Sample Button
                  </button>
                </div>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Theme: {advancedAppearance.theme}</p>
                  <p>Font: {advancedAppearance.fontFamily} ({advancedAppearance.fontSize}px)</p>
                  <p>Density: {advancedAppearance.density}</p>
                  {advancedAppearance.customTheme && (
                    <>
                      <p>Primary: {advancedAppearance.primaryColor}</p>
                      <p>Accent: {advancedAppearance.accentColor}</p>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Actions Card */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              
              <div className="space-y-3">
                <Button
                  onClick={handleSaveAppearance}
                  disabled={saving}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleResetAppearance}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                
                <Button
                  onClick={() => {
                    const dataStr = JSON.stringify(advancedAppearance, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'appearance-settings.json';
                    link.click();
                    toast.success(
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="font-medium">Settings exported successfully!</p>
                          <p className="text-sm opacity-90">Your appearance settings have been downloaded.</p>
                        </div>
                      </div>,
                      { duration: 4000 }
                    );
                  }}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Settings
                </Button>
              </div>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Tips
              </h3>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>Settings are automatically saved to your browser</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>Custom CSS allows for advanced personalization</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>Use reduced motion if you're sensitive to animations</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p>High contrast mode improves readability</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordChange}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

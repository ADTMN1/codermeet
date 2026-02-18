import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUser } from '../../context/UserContext';
import { userPreferencesService, applyThemeSettings } from '../../hooks/useTheme';
import { 
  Settings, 
  Shield, 
  Palette,
  Save,
  Eye,
  EyeOff,
  LogOut,
  Download,
  Upload,
  Database,
  Lock,
  Activity,
  Globe,
  Smartphone,
  Trash2,
  RefreshCw,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  Moon,
  Sun,
  Zap,
  UserX,
  FileText,
  ShieldCheck,
  Fingerprint
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState<'security' | 'appearance' | 'privacy'>('security');
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
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

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    allowMessages: true,
    dataCollection: true,
    analyticsTracking: true,
    marketingCommunications: false,
    cookieConsent: 'necessary',
    dataRetention: '12months',
    twoFactorAuth: false,
    biometricAuth: false,
    loginAlerts: true
  });

  // Advanced Appearance State
  const [advancedAppearance, setAdvancedAppearance] = useState({
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
    theme: 'dark' as 'light' | 'dark' | 'auto'
  });

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = userPreferencesService.getAppearanceSettings();
    setAdvancedAppearance(prev => ({ ...prev, ...savedSettings }));
  }, []);

  // Apply theme changes immediately
  useEffect(() => {
    applyThemeSettings(advancedAppearance);
  }, [advancedAppearance]);

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

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Privacy settings updated!');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fetch real sessions from backend
  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        console.log('No token found in localStorage');
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
      
      console.log('Fetching sessions with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/sessions/my-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Sessions response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sessions data:', data);
        console.log('Sessions array:', data.data.sessions);
        console.log('Sessions length:', data.data.sessions?.length);
        
        // Handle different possible data structures
        let sessions = [];
        if (data.data && data.data.sessions) {
          sessions = data.data.sessions;
        } else if (data.sessions) {
          sessions = data.sessions;
        } else if (data.data) {
          sessions = data.data;
        }
        
        console.log('Final sessions array:', sessions);
        
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
          console.log('Added current session:', currentSession);
        }
        
        setActiveSessions(sessions);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Sessions error:', errorData);
        
        // If unauthorized, clear token and redirect to login
        if (response.status === 401) {
          console.log('Token invalid, clearing and redirecting');
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
            console.log('Got coordinates:', latitude, longitude);
            
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
              console.log('Browser geolocation success:', location);
              resolve(location || 'Unknown');
            } else {
              resolve('Unknown');
            }
          } catch (error) {
            console.log('Reverse geocoding failed:', error);
            resolve('Unknown');
          }
        },
        (error) => {
          console.log('Geolocation denied:', error);
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
          console.log('ip-api.com success:', data);
          return `${data.city}, ${data.regionName}, ${data.country}`;
        }
      } catch (e) {
        console.log('ip-api.com failed');
      }

      // Method 2: ipinfo.io (good accuracy)
      try {
        const response = await fetch(`https://ipinfo.io/${ip}/json?token=free`);
        const data = await response.json();
        if (data.city && data.country) {
          console.log('ipinfo.io success:', data);
          return `${data.city}, ${data.region || data.country}`;
        }
      } catch (e) {
        console.log('ipinfo.io failed');
      }

      // Method 3: ipapi.co (reliable)
      try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        if (data.city && data.country_name) {
          console.log('ipapi.co success:', data);
          return `${data.city}, ${data.region}, ${data.country_name}`;
        }
      } catch (e) {
        console.log('ipapi.co failed');
      }

      // Method 4: Use timezone as last resort
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = timezone.split('/')[1]?.replace(/_/g, ' ');
      const country = timezone.split('/')[0]?.replace(/_/g, ' ');
      if (city && city !== 'Unknown') {
        console.log('timezone fallback:', timezone);
        return `${city}, ${country}`;
      }

      return 'Unknown';
    } catch (error) {
      console.error('All location services failed:', error);
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
      console.log('Token expired, clearing and redirecting');
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
    console.log('=== REVOKE SESSION START ===');
    console.log('Attempting to revoke session:', sessionId);
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Using token:', token ? 'present' : 'missing');
      console.log('Token value:', token?.substring(0, 50) + '...');
      console.log('Token length:', token?.length || 0);
      
      // Test the token and validate it
      if (token) {
        if (isTokenExpired(token)) {
          console.log('ERROR: Token expired!');
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_sessions');
          window.location.href = '/login';
          return;
        }
        console.log('Token is valid, proceeding with revoke...');
      } else {
        console.log('ERROR: No token found!');
        toast.error('Please login to revoke sessions');
        return;
      }
      
      console.log('Making API call to:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/sessions/terminate/${sessionId}`);
      
      const startTime = Date.now();
      console.log('API call started at:', startTime);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/sessions/terminate/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log('API call completed at:', endTime);
      console.log('API call duration:', endTime - startTime, 'ms');
      console.log('Revoke response status:', response.status);
      
      let responseData = {};
      try {
        responseData = await response.json();
        console.log('Revoke response data:', responseData);
      } catch (jsonError) {
        console.log('Failed to parse JSON response:', jsonError);
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
        
        console.log('Session revoked from both backend and localStorage');
      } else {
        console.log('Revoke failed:', responseData);
        toast.error(`Failed to revoke session: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.error('Failed to revoke session');
    }
  };

  const revokeAllSessions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/sessions/terminate-all-others`, {
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
      settings: { privacySettings, advancedAppearance },
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

  // Account Deletion
  const deleteAccount = () => {
    if (deleteConfirmation.toLowerCase() === 'delete my account') {
      toast.success('Account deletion request submitted');
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      // Handle account deletion logic
    } else {
      toast.error('Please type the confirmation text exactly');
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
            { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
            { id: 'privacy', label: 'Privacy', icon: <ShieldCheck className="w-4 h-4" /> }
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
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-green-400" />
                Theme & Display
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
                      { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
                      { value: 'auto', label: 'Auto', icon: <Monitor className="w-4 h-4" /> }
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => {
                          setAdvancedAppearance(prev => ({ ...prev, theme: theme.value as 'light' | 'dark' | 'auto', customTheme: false }));
                          userPreferencesService.saveAppearanceSettings({ theme: theme.value, customTheme: false });
                          toast.success(`Theme changed to ${theme.label}`, 'Your appearance has been updated');
                        }}
                        className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                          !advancedAppearance.customTheme && advancedAppearance.theme === theme.value
                            ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        {theme.icon}
                        <span className="text-sm font-medium">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Font Size: {advancedAppearance.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={advancedAppearance.fontSize}
                    onChange={(e) => {
                    const newFontSize = parseInt(e.target.value);
                    setAdvancedAppearance(prev => ({ ...prev, fontSize: newFontSize }));
                    userPreferencesService.saveAppearanceSettings({ fontSize: newFontSize });
                    toast.success('Font size updated', `Changed to ${newFontSize}px`);
                  }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Font Family
                  </label>
                  <select
                    value={advancedAppearance.fontFamily}
                    onChange={(e) => {
                      const newFontFamily = e.target.value;
                      setAdvancedAppearance(prev => ({ ...prev, fontFamily: newFontFamily }));
                      userPreferencesService.saveAppearanceSettings({ fontFamily: newFontFamily });
                      toast.success('Font family updated', `Changed to ${newFontFamily}`);
                    }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Poppins">Poppins</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Advanced Customization
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-4">Custom Theme</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Enable Custom Theme</p>
                        <p className="text-gray-400 text-sm">Create your own color scheme</p>
                      </div>
                      <button
                        onClick={() => {
                          const newCustomTheme = !advancedAppearance.customTheme;
                          setAdvancedAppearance(prev => ({ ...prev, customTheme: newCustomTheme }));
                          userPreferencesService.saveAppearanceSettings({ customTheme: newCustomTheme });
                          toast.success(
                            newCustomTheme ? 'Custom theme enabled' : 'Custom theme disabled',
                            newCustomTheme ? 'You can now customize colors' : 'Using default theme colors'
                          );
                        }}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Primary Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={advancedAppearance.primaryColor}
                              onChange={(e) => {
                                const newPrimaryColor = e.target.value;
                                setAdvancedAppearance(prev => ({ ...prev, primaryColor: newPrimaryColor }));
                                userPreferencesService.saveAppearanceSettings({ primaryColor: newPrimaryColor });
                                toast.success('Primary color updated', 'Theme color has been changed');
                              }}
                              className="w-12 h-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={advancedAppearance.primaryColor}
                              onChange={(e) => {
                                const newPrimaryColor = e.target.value;
                                setAdvancedAppearance(prev => ({ ...prev, primaryColor: newPrimaryColor }));
                                userPreferencesService.saveAppearanceSettings({ primaryColor: newPrimaryColor });
                                toast.success('Primary color updated', 'Theme color has been changed');
                              }}
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
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
                              onChange={(e) => {
                                const newAccentColor = e.target.value;
                                setAdvancedAppearance(prev => ({ ...prev, accentColor: newAccentColor }));
                                userPreferencesService.saveAppearanceSettings({ accentColor: newAccentColor });
                                toast.success('Accent color updated', 'Theme accent color has been changed');
                              }}
                              className="w-12 h-12 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={advancedAppearance.accentColor}
                              onChange={(e) => {
                                const newAccentColor = e.target.value;
                                setAdvancedAppearance(prev => ({ ...prev, accentColor: newAccentColor }));
                                userPreferencesService.saveAppearanceSettings({ accentColor: newAccentColor });
                                toast.success('Accent color updated', 'Theme accent color has been changed');
                              }}
                              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-4">Custom CSS</h4>
                  <textarea
                    value={advancedAppearance.customCSS}
                    onChange={(e) => {
                      const newCustomCSS = e.target.value;
                      setAdvancedAppearance(prev => ({ ...prev, customCSS: newCustomCSS }));
                      userPreferencesService.saveAppearanceSettings({ customCSS: newCustomCSS });
                    }}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    placeholder="/* Add your custom CSS here */"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Animations</p>
                      <p className="text-gray-400 text-sm">Enable UI animations</p>
                    </div>
                    <button
                      onClick={() => {
                        const newAnimationsEnabled = !advancedAppearance.animationsEnabled;
                        setAdvancedAppearance(prev => ({ ...prev, animationsEnabled: newAnimationsEnabled }));
                        userPreferencesService.saveAppearanceSettings({ animationsEnabled: newAnimationsEnabled });
                        toast.success(
                          newAnimationsEnabled ? 'Animations enabled' : 'Animations disabled',
                          newAnimationsEnabled ? 'UI animations are now active' : 'UI animations are now minimized'
                        );
                      }}
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
                      onClick={() => {
                        const newReducedMotion = !advancedAppearance.reducedMotion;
                        setAdvancedAppearance(prev => ({ ...prev, reducedMotion: newReducedMotion }));
                        userPreferencesService.saveAppearanceSettings({ reducedMotion: newReducedMotion });
                        toast.success(
                          newReducedMotion ? 'Reduced motion enabled' : 'Reduced motion disabled',
                          newReducedMotion ? 'Animations are now minimized for accessibility' : 'Normal animations restored'
                        );
                      }}
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
                      onClick={() => {
                        const newHighContrast = !advancedAppearance.highContrast;
                        setAdvancedAppearance(prev => ({ ...prev, highContrast: newHighContrast }));
                        userPreferencesService.saveAppearanceSettings({ highContrast: newHighContrast });
                        toast.success(
                          newHighContrast ? 'High contrast enabled' : 'High contrast disabled',
                          newHighContrast ? 'Increased contrast for better visibility' : 'Normal contrast restored'
                        );
                      }}
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

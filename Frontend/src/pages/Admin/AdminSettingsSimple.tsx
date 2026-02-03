import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { adminService } from '../../services/adminService';
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Globe, 
  Users,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Key,
  Lock,
  Palette,
  BarChart3,
  Download,
  Upload,
  User,
  LogOut,
  Edit,
  Mail,
  Calendar,
  Award
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const AdminSettingsSimple: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'appearance' | 'data' | 'profile'>('general');
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Password modal state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Profile State
  const [profileSettings, setProfileSettings] = useState({
    fullName: '',
    email: '',
    role: '',
    department: '',
    phone: '',
    location: '',
    bio: '',
    joinedDate: '',
    lastLogin: ''
  });

  // Load admin profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await adminService.getProfile();
        setProfileSettings({
          fullName: profile.fullName || '',
          email: profile.email || '',
          role: profile.role || '',
          department: profile.adminProfile?.department || '',
          phone: '',
          location: profile.location || '',
          bio: profile.bio || '',
          joinedDate: new Date(profile.createdAt).toLocaleDateString(),
          lastLogin: profile.adminProfile?.lastLoginIP ? 'Just now' : 'Unknown'
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);
  
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'CoderMeet',
    siteDescription: 'Professional Coding Platform',
    adminEmail: 'admin@codermeet.com',
    supportEmail: 'support@codermeet.com',
    maxUsers: 10000,
    allowRegistration: true,
    maintenanceMode: false,
    timezone: 'UTC'
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireStrongPassword: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    twoFactorAuth: false
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    systemAlerts: true,
    userRegistration: true,
    newSubmissions: true,
    securityAlerts: true,
    weeklyReports: true
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        fullName: profileSettings.fullName,
        email: profileSettings.email,
        location: profileSettings.location,
        bio: profileSettings.bio,
        // Map department to adminProfile.department
        adminProfile: {
          department: profileSettings.department
        }
      };

      const response = await adminService.updateProfile(updateData);
      
      if (response.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
      const response = await adminService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        toast.success('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_data');
    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Admin Settings</h2>
          <p className="text-gray-400">Configure system settings and preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Settings Navigation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-1">
        <div className="flex space-x-1">
          {[
            { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
            { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
            { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
            { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
            { id: 'data', label: 'Data Management', icon: <Database className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                Site Configuration
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={generalSettings.adminEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, adminEmail: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings({...generalSettings, supportEmail: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Status Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">All systems operational</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Database connected</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">High memory usage</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Profile Information
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{profileSettings.fullName}</h4>
                    <p className="text-red-400 font-medium">{profileSettings.role}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        ● Active
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Online
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileSettings.fullName}
                      onChange={(e) => setProfileSettings({...profileSettings, fullName: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profileSettings.department}
                      onChange={(e) => setProfileSettings({...profileSettings, department: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileSettings.phone}
                      onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileSettings.location}
                    onChange={(e) => setProfileSettings({...profileSettings, location: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileSettings.bio}
                    onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Account Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">Joined Date</p>
                      <p className="text-gray-400 text-sm">When you joined the platform</p>
                    </div>
                  </div>
                  <span className="text-blue-400 font-semibold">{profileSettings.joinedDate}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">Last Login</p>
                      <p className="text-gray-400 text-sm">Your most recent login</p>
                    </div>
                  </div>
                  <span className="text-green-400 font-semibold">{profileSettings.lastLogin}</span>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout from Admin Panel
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Profile Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                  <Button
                    onClick={() => setShowPasswordModal(true)}
                    variant="outline"
                    className="w-full border-blue-600 text-blue-400 hover:bg-blue-600/10"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                <Button
                  variant="outline"
                  className="w-full border-green-600 text-green-400 hover:bg-green-600/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-purple-600 text-purple-400 hover:bg-purple-600/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Preferences
                </Button>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-400" />
                Account Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-400">Total Logins</span>
                  <span className="text-white font-semibold">1,247</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-400">Sessions Today</span>
                  <span className="text-white font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-400">Actions Performed</span>
                  <span className="text-white font-semibold">8,456</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                Security Configuration
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-yellow-400" />
                    Password Policy
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Minimum Length
                        </label>
                        <input
                          type="number"
                          value={securitySettings.passwordMinLength}
                          onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          value={securitySettings.sessionTimeout}
                          onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Require Strong Password</p>
                        <p className="text-gray-400 text-sm">Must include uppercase, lowercase, numbers, and special characters</p>
                      </div>
                      <button
                        onClick={() => setSecuritySettings({...securitySettings, requireStrongPassword: !securitySettings.requireStrongPassword})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          securitySettings.requireStrongPassword ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            securitySettings.requireStrongPassword ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-700">
                    <Button
                      onClick={handlePasswordChange}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Change Admin Password
                    </Button>
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
            <h3 className="text-lg font-semibold text-white mb-4">Change Admin Password</h3>
            
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="Confirm new password"
                  />
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
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

export default AdminSettingsSimple;

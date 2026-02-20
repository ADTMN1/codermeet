import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Target, 
  Settings,
  Menu,
  X,
  Home,
  Shield,
  Lightbulb,
  FileText,
  Server,
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    fullName: 'Admin User',
    email: 'admin@codermeet.com',
    role: 'admin'
  });
  const [loading, setLoading] = useState(true);

  // Load admin profile on mount
  useEffect(() => {
    const loadAdminProfile = async () => {
      // First try to get cached data from localStorage
      const cachedUser = localStorage.getItem('user_data');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setAdminProfile({
            fullName: userData.fullName || 'Admin User',
            email: userData.email || 'admin@codermeet.com',
            role: userData.role || 'admin'
          });
          setLoading(false); // Hide loading immediately with cached data
        } catch (e) {
          console.error('Failed to parse cached user data:', e);
        }
      }

      // Then fetch fresh data from API
      try {
        const profile = await adminService.getProfile();
        setAdminProfile({
          fullName: profile.fullName || 'Admin User',
          email: profile.email || 'admin@codermeet.com',
          role: profile.role || 'admin'
        });
      } catch (error) {
        console.error('Failed to load admin profile:', error);
        // Keep cached/default values on error
      } finally {
        setLoading(false);
      }
    };

    loadAdminProfile();
  }, []);

  // Simple logout function
  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_data');
    // Navigate to login page
    navigate('/login');
  };

  // Admin navigation items
  const adminNavItems = [
    { 
      id: 'overview', 
      label: 'Dashboard Overview', 
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'System overview & metrics',
      path: '/admin'
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: <Users className="w-5 h-5" />,
      description: 'Manage user accounts',
      path: '/admin/users'
    },
    { 
      id: 'challenges', 
      label: 'Challenge Hub', 
      icon: <Trophy className="w-5 h-5" />,
      description: 'Coding challenges',
      path: '/admin/challenges'
    },
    { 
      id: 'submissions', 
      label: 'Code Review', 
      icon: <FileText className="w-5 h-5" />,
      description: 'Review submissions',
      path: '/admin/submissions'
    },
    { 
      id: 'system', 
      label: 'System Health', 
      icon: <Server className="w-5 h-5" />,
      description: 'Monitor performance',
      path: '/admin/system'
    },
    { 
      id: 'daily-challenges', 
      label: 'Daily Challenges', 
      icon: <Calendar className="w-5 h-5" />,
      description: 'Daily coding tasks',
      path: '/admin/daily-challenges'
    },
    { 
      id: 'weekly-challenges', 
      label: 'Weekly Contests', 
      icon: <Award className="w-5 h-5" />,
      description: 'Weekly competitions',
      path: '/admin/weekly-challenges'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Data & insights',
      path: '/admin/analytics'
    },
    { 
      id: 'business-ideas', 
      label: 'Business Ideas', 
      icon: <Lightbulb className="w-5 h-5" />,
      description: 'Review competition entries',
      path: '/admin/business-ideas'
    },
    { 
      id: 'settings', 
      label: 'Admin Settings', 
      icon: <Settings className="w-5 h-5" />,
      description: 'System configuration',
      path: '/admin/settings'
    },
  ];

  return (
    <aside className={`bg-gradient-to-b from-gray-900 to-black border-r border-red-900/30 flex flex-col transition-all duration-300 ${
      sidebarCollapsed ? 'w-20' : 'w-80'
    } min-h-screen sticky top-0`}>
      {/* Profile Section */}
      <div className="p-0.5 border-b border-red-900/20 bg-gradient-to-r from-red-900/10 to-black">
      
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 flex-1">
              
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25 ml-9">
                <span className="text-white font-bold text-lg">
                  {adminProfile.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 text-center">
                {/* <h1 className="text-lg font-bold text-white capitalize">
                  {loading ? 'Loading...' : adminProfile.fullName}
                </h1> */}
                
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400 capitalize">
                    {adminProfile.role.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-red-400">
                  {adminProfile.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-5.5 rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-105"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Admin Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
              }}
              className={`w-full group relative overflow-hidden rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border-l-3 border-red-500 shadow-lg shadow-red-500/10'
                  : 'hover:bg-gradient-to-r hover:from-red-900/20 hover:to-red-800/20 text-gray-400 hover:text-red-400'
              }`}
              title={sidebarCollapsed ? `${item.label} - ${item.description}` : undefined}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className={`transition-all duration-300 ${sidebarCollapsed ? 'mx-auto' : ''} ${
                  isActive ? 'text-red-400 scale-110' : 'group-hover:scale-110'
                }`}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white group-hover:text-red-300 transition-colors">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-red-300/70 transition-colors">
                      {item.description}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Active indicator */}
              {isActive && !sidebarCollapsed && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-red-900/20 bg-gradient-to-r from-red-900/10 to-black">
        {!sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        )}
        {sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="w-full p-3 rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-all duration-200 group"
            title="Logout"
          >
            <svg className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;

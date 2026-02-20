import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Shield, 
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Crown,
  User as UserIcon,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  BarChart3,
  Trophy,
  Code,
  Plus,
  Calendar,
  Target,
  Award,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  MessageSquare,
  HelpCircle,
  Brain,
  Sparkles,
  RefreshCw,
  CalendarDays
} from 'lucide-react';
import { adminService, User, UserStats, SystemHealth, SystemActivity } from '../../services/adminService';
import { challengeService, Challenge, ChallengeStats } from '../../services/challengeService';
import { useAdminToast } from '../../utils/adminToast';
import CreateChallengeForm from '../../components/admin/CreateChallengeForm';
import { SubmissionsManagement } from '../../components/admin/SubmissionsManagement';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const adminToast = useAdminToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemActivity, setSystemActivity] = useState<SystemActivity | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'challenges' | 'submissions' | 'system'>('users');
  const [selectedChallengeForSubmissions, setSelectedChallengeForSubmissions] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'user' | 'challenge';
    userName?: string;
    challengeTitle?: string;
    userId?: string;
    onConfirm?: () => void;
    onClose?: () => void;
    isDeleting?: boolean;
  } | null>(null);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      id: 'settings', 
      label: 'Admin Settings', 
      icon: <Settings className="w-5 h-5" />,
      description: 'System configuration',
      path: '/admin/settings'
    },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch system data only when system tab is activated
  useEffect(() => {
    if (activeTab === 'system' && !systemHealth && !systemActivity) {
      fetchSystemData();
    }
  }, [activeTab]);

  // Add manual refresh function
  const handleRefresh = () => {
    fetchDashboardData();
    setLastRefresh(new Date());
    adminToast.dashboardRefreshed();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch essential data in parallel
      const [
        usersData,
        statsData,
        challengesData,
        dailyChallengesData,
        challengeStatsData
      ] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getUserStats(),
        challengeService.getAllChallenges({ limit: 100 }),
        challengeService.getDailyChallenges({ limit: 100 }),
        challengeService.getChallengeStats()
      ]);
      
      // Update essential states
      console.log('🔍 Debug - Raw API responses:', {
        challengesData,
        dailyChallengesData,
        challengeStatsData
      });
      
      // Calculate total challenges (main + daily)
      const totalChallenges = (challengesData?.data?.length || 0) + (dailyChallengesData?.data?.length || 0);
      
      setUsers(usersData || []);
      setStats(statsData || null);
      setChallenges(challengesData?.data || []);
      setChallengeStats(challengeStatsData?.data || null);
      setLastRefresh(new Date());
      
      console.log('🔍 Debug - Set states:', {
        totalChallenges,
        challenges: (challengesData?.data?.length || 0),
        dailyChallenges: (dailyChallengesData?.data?.length || 0),
        challengeStats: challengeStatsData?.data ? 'exists' : 'null'
      });
      
      // Only fetch system data if system tab is active
      if (activeTab === 'system') {
        const [healthData, activityData] = await Promise.all([
          adminService.getSystemHealth(),
          adminService.getSystemActivity()
        ]);
        setSystemHealth(healthData);
        setSystemActivity(activityData);
      }
      
    } catch (error: any) {
      adminToast.error('load', 'admin dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate function for system data
  const fetchSystemData = async () => {
    try {
      const [healthData, activityData] = await Promise.all([
        adminService.getSystemHealth(),
        adminService.getSystemActivity()
      ]);
      setSystemHealth(healthData);
      setSystemActivity(activityData);
    } catch (error: any) {
      adminToast.dataLoadError('system data');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      adminToast.userUpdated(newRole);
    } catch (error: any) {
      adminToast.error('update', 'user role', error);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'user',
      userName,
      userId,
      onConfirm: async () => {
        try {
          await adminService.deleteUser(userId);
          setUsers(users.filter(user => user._id !== userId));
          adminToast.userDeleted();
          // Only refresh user stats, not all dashboard data
          try {
            const newStats = await adminService.getUserStats();
            setStats(newStats);
          } catch (statsError) {
            adminToast.statsRefreshError('user');
          }
        } catch (error) {
          adminToast.error('delete', 'user', error);
        }
        setDeleteDialog(null);
      },
      onClose: () => setDeleteDialog(null)
    });
  };

  const handleDeleteChallenge = async (challengeId: string, challengeTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      type: 'challenge',
      challengeTitle,
      isDeleting: false,
      onConfirm: async () => {
        try {
          setDeleteDialog(prev => prev ? { ...prev, isDeleting: true } : null);
          await challengeService.deleteChallenge(challengeId);
          setChallenges(challenges.filter(challenge => challenge._id !== challengeId));
          adminToast.challengeDeleted();
          // Only refresh challenge stats, not all dashboard data
          try {
            const newStats = await challengeService.getChallengeStats();
            setChallengeStats(newStats);
          } catch (statsError) {
            adminToast.statsRefreshError('challenge');
          }
          setDeleteDialog(null);
        } catch (error) {
          adminToast.error('delete', 'challenge', error);
          setDeleteDialog(prev => prev ? { ...prev, isDeleting: false } : null);
        }
      },
      onClose: () => setDeleteDialog(null)
    });
  };

  const handleEditChallenge = async (challengeId: string) => {
    const challenge = challenges.find(c => c._id === challengeId);
    if (challenge) {
      setSelectedChallenge(challenge);
      setShowCreateChallenge(true);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    
    return matchesSearch && matchesRole && matchesPlan;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading Admin Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching essential data in parallel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Admin Sidebar */}
      <aside className={`bg-gradient-to-b from-gray-900 to-black border-r border-red-900/30 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-80'
      } min-h-screen sticky top-0`}>
        {/* Admin Header */}
        <div className="p-6 border-b border-red-900/20 bg-gradient-to-r from-red-900/10 to-black">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                  <p className="text-xs text-red-400 font-medium">System Control Center</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2.5 rounded-lg hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-105"
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

        {/* Admin Footer */}
        <div className="p-4 border-t border-red-900/20 bg-gradient-to-r from-red-900/10 to-black">
          {!sidebarCollapsed && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-red-900/20">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">System Administrator</p>
                  <p className="text-xs text-red-400">admin@codermeet.com</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      ● Active
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      Super Admin
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                  <p className="text-gray-400">System Status</p>
                  <p className="text-green-400 font-semibold">Operational</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                  <p className="text-gray-400">Last Login</p>
                  <p className="text-blue-400 font-semibold">Just Now</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600 text-sm font-medium"
              >
                <Home className="w-4 h-4" />
                Exit Admin Panel
              </button>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="space-y-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full p-3 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all duration-200 group"
                title="Exit Admin Panel"
              >
                <Home className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-gradient-to-r from-gray-900 via-gray-900 to-black border-b border-red-900/30 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm font-medium">System Management & Monitoring Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">System Status</p>
                <p className="text-sm font-medium text-green-400">● All Systems Operational</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-white">{lastRefresh.toLocaleTimeString()}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 font-medium"
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('challenges')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'challenges'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Challenges
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'submissions'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Submissions
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'system'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Server className="h-4 w-4 mr-2" />
              System Monitoring
            </button>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Premium Users</p>
                      <p className="text-2xl font-bold text-white">{stats.premiumUsers}</p>
                    </div>
                    <Crown className="h-8 w-8 text-yellow-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Professionals</p>
                      <p className="text-2xl font-bold text-white">{stats.professionalUsers}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">New This Month</p>
                      <p className="text-2xl font-bold text-white">{stats.newUsersThisMonth}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Admins</p>
                      <p className="text-2xl font-bold text-white">{stats.adminUsers}</p>
                    </div>
                    <Shield className="h-8 w-8 text-red-500" />
                  </div>
                </motion.div>
              </div>
            )}

        {/* Filters and Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="Trial">Trial</option>
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Challenges Management Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Challenges Management
            </h2>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/admin/daily-challenges')}
                variant="outline"
                className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
              >
                <Calendar className="w-4 h-4 mr-2" />
                AI Daily Challenges
              </Button>
              <Button
                onClick={() => navigate('/admin/weekly-challenges')}
                variant="outline"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Weekly Challenges
              </Button>
              <Button
                onClick={() => setShowCreateChallenge(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
              <Button
                onClick={() => navigate('/admin/ai-daily-challenges')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
            </div>
          </div>

          {/* Challenge Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-600 to-green-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Daily Challenges</p>
                  <p className="text-2xl font-bold text-white">{challenges.filter(c => c.category?.includes('Daily') || c.title?.includes('Daily')).length}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-300" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm">Weekly Challenges</p>
                  <p className="text-2xl font-bold text-white">{challenges.filter(c => c.category?.includes('Weekly') || c.title?.includes('Weekly')).length}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Submissions</p>
                  <p className="text-2xl font-bold text-white">{challengeStats?.overview?.totalSubmissions || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-300" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-600 to-orange-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Active Challenges</p>
                  <p className="text-2xl font-bold text-white">{challengeStats?.overview?.activeChallenges || challenges.filter(c => c.isActive).length}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-300" />
              </div>
            </div>
          </div>

          {/* Challenges List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Recent Challenges</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {challenges.slice(0, 6).map((challenge) => (
                <div key={challenge._id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{challenge.title}</h4>
                      <p className="text-gray-400 text-sm mb-2">{challenge.description.substring(0, 100)}...</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          challenge.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' :
                          challenge.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {challenge.difficulty}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                          {challenge.category}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                          {challenge.currentParticipants || 0} participants
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(challenge.startDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(challenge.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/challenges/${challenge._id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/challenges/${challenge._id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-red-600 hover:bg-red-600/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {challenges.length === 0 && (
              <div className="text-center py-8">
                <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">No Challenges Yet</h3>
                <p className="text-gray-500 mb-4">Create your first challenge to get started</p>
                <Button onClick={() => setShowCreateChallenge(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Challenge
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Professional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.fullName}</div>
                          <div className="text-sm text-gray-400">@{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? (
                          <><Shield className="h-3 w-3 mr-1" /> Admin</>
                        ) : (
                          <><UserIcon className="h-3 w-3 mr-1" /> User</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.plan === 'Premium' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.plan === 'Basic'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isProfessional 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isProfessional ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.fullName)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UserX className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <>
            {/* Challenge Stats Cards */}
            {challengeStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Challenges</p>
                      <p className="text-2xl font-bold text-white">{challenges?.length || 0}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Challenges</p>
                      <p className="text-2xl font-bold text-white">{challenges.filter(c => c.isActive).length}</p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Submissions</p>
                      <p className="text-2xl font-bold text-white">{challenges?.length || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Participants</p>
                      <p className="text-2xl font-bold text-white">{challengeStats.overview.totalParticipants}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Challenge Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Challenge Management</h3>
                <button
                  onClick={() => {
                    setSelectedChallenge(null);
                    setShowCreateChallenge(true);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </button>
              </div>
            </div>

            {/* Challenges List */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Challenge
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {challenges.map((challenge, index) => (
                      <motion.tr
                        key={challenge._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{challenge.title}</div>
                            <div className="text-sm text-gray-400">
                              {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {challenge.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            challenge.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                            challenge.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            challenge.difficulty === 'Advanced' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {challenge.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            challenge.status === 'active' ? 'bg-green-100 text-green-800' :
                            challenge.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            challenge.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {challenge.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {challenge.currentParticipants}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {challenge.submissions?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedChallenge(challenge)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditChallenge(challenge._id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChallenge(challenge._id, challenge.title)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                
                {challenges.length === 0 && (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No challenges found</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            {/* Challenge Selector */}
            <Card className="bg-slate-900/50 border-slate-700/50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-slate-300 mb-2 block">Select Challenge</Label>
                  <select
                    value={selectedChallengeForSubmissions || ''}
                    onChange={(e) => setSelectedChallengeForSubmissions(e.target.value || null)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">All Challenges</option>
                    {challenges.map((challenge) => (
                      <option key={challenge._id} value={challenge._id}>
                        {challenge.title} ({challenge.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => setSelectedChallengeForSubmissions(null)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Card>

            {/* Submissions Management */}
            <SubmissionsManagement challengeId={selectedChallengeForSubmissions || undefined} />
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <>
            {/* System Health Cards */}
            {systemHealth && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Server Status</h3>
                    <Server className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime</span>
                      <span className="text-white">{Math.floor(systemHealth.server.uptime / 3600)}h {Math.floor((systemHealth.server.uptime % 3600) / 60)}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Node Version</span>
                      <span className="text-white">{systemHealth.server.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform</span>
                      <span className="text-white">{systemHealth.server.platform}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Memory Usage</h3>
                    <HardDrive className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used</span>
                      <span className="text-white">{systemHealth.server.memory.used}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white">{systemHealth.server.memory.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">External</span>
                      <span className="text-white">{systemHealth.server.memory.external}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Database</h3>
                    <Database className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        systemHealth.database.status === 'connected' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {systemHealth.database.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Host</span>
                      <span className="text-white">{systemHealth.database.host}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Database</span>
                      <span className="text-white">{systemHealth.database.name}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Activity Statistics */}
            {systemActivity && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Registration Activity</h3>
                    <Activity className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Last 24 Hours</span>
                      <span className="text-2xl font-bold text-white">{systemActivity.registrations.last24Hours}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Last 7 Days</span>
                      <span className="text-2xl font-bold text-white">{systemActivity.registrations.last7Days}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Last 30 Days</span>
                      <span className="text-2xl font-bold text-white">{systemActivity.registrations.last30Days}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">User Distribution</h3>
                    <BarChart3 className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">By Plan</h4>
                      {systemActivity.distributions.plans.map((plan) => (
                        <div key={plan._id} className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">{plan._id}</span>
                          <span className="text-white font-medium">{plan.count}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">By Role</h4>
                      {systemActivity.distributions.roles.map((role) => (
                        <div key={role._id} className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">{role._id}</span>
                          <span className="text-white font-medium">{role.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Challenge Modal */}
        {showCreateChallenge && (
          <CreateChallengeForm
            challenge={selectedChallenge}
            onClose={() => {
              setShowCreateChallenge(false);
              setSelectedChallenge(null);
            }}
            onSuccess={() => {
              setShowCreateChallenge(false);
              setSelectedChallenge(null);
              fetchDashboardData();
            }}
          />
        )}

        {/* Professional Confirmation Dialog */}
        {deleteDialog && (
          <AdminConfirmDialog
            isOpen={deleteDialog.isOpen}
            onClose={deleteDialog.onClose}
            onConfirm={deleteDialog.onConfirm}
            isConfirming={deleteDialog.isDeleting}
            title={`Delete ${deleteDialog.type === 'user' ? 'User' : 'Challenge'}`}
            message={`Are you sure you want to delete this ${deleteDialog.type === 'user' ? deleteDialog.userName : deleteDialog.challengeTitle}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />
        )}
      </motion.div>
      </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

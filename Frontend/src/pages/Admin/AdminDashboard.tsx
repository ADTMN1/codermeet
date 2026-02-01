import React, { useState, useEffect } from 'react';
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
  Star
} from 'lucide-react';
import { adminService, User, UserStats, SystemHealth, SystemActivity } from '../../services/adminService';
import { challengeService, Challenge, ChallengeStats } from '../../services/challengeService';
import { toast } from 'sonner';
import CreateChallengeForm from '../../components/admin/CreateChallengeForm';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [systemActivity, setSystemActivity] = useState<SystemActivity | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'challenges' | 'system'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
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
    toast.info('Dashboard data refreshed');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch essential data in parallel
      const [
        usersData,
        statsData,
        challengesData,
        challengeStatsData
      ] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getUserStats(),
        challengeService.getAllChallenges({ limit: 100 }),
        challengeService.getChallengeStats()
      ]);
      
      // Update essential states
      setUsers(usersData || []);
      setStats(statsData || null);
      setChallenges((challengesData?.data) || []);
      setChallengeStats(challengeStatsData || null);
      setLastRefresh(new Date());
      
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
      toast.error(`Failed to load admin dashboard: ${error.response?.data?.message || error.message}`);
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
      toast.error('Failed to load system data');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
      toast.success('User deleted successfully');
      // Only refresh user stats, not all dashboard data
      try {
        const newStats = await adminService.getUserStats();
        setStats(newStats);
      } catch (statsError) {
        toast.error('Failed to refresh user stats');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteChallenge = async (challengeId: string, challengeTitle: string) => {
    if (!confirm(`Are you sure you want to delete challenge "${challengeTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await challengeService.deleteChallenge(challengeId);
      setChallenges(challenges.filter(challenge => challenge._id !== challengeId));
      toast.success('Challenge deleted successfully');
      // Only refresh challenge stats, not all dashboard data
      try {
        const newStats = await challengeService.getChallengeStats();
        setChallengeStats(newStats);
      } catch (statsError) {
        toast.error('Failed to refresh challenge stats');
      }
    } catch (error) {
      toast.error('Failed to delete challenge');
    }
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
    <div className="min-h-screen bg-black text-gray-300 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage users and monitor platform activity</p>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>

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
                      <p className="text-2xl font-bold text-white">{challengeStats.overview.totalChallenges}</p>
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
                      <p className="text-2xl font-bold text-white">{challengeStats.overview.activeChallenges}</p>
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
                      <p className="text-2xl font-bold text-white">{challengeStats.overview.totalSubmissions}</p>
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
      </motion.div>

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

    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Shield, 
  Activity,
  Trophy,
  Code,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { adminService, UserStats } from '../../services/adminService';
import { useChallengeStats } from '../../hooks/useChallenges';
import { useAdminToast } from '../../utils/adminToast';
import { Card } from '../../components/ui/card';

const DashboardOverview: React.FC = () => {
  const adminToast = useAdminToast();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Use React Query for challenge stats
  const { data: challengeStats } = useChallengeStats();

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const userStatsData = await adminService.getUserStats();
      setUserStats(userStatsData);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      adminToast.error('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-400">System-wide metrics and performance indicators</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-white">{userStats?.totalUsers || 0}</p>
              <p className="text-blue-300 text-xs mt-1">Registered accounts</p>
            </div>
            <Users className="h-10 w-10 text-blue-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-600 to-green-800 border border-green-700 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">Active Challenges</p>
              <p className="text-3xl font-bold text-white">{challengeStats?.overview?.activeChallenges || 0}</p>
              <p className="text-green-300 text-xs mt-1">Currently running</p>
            </div>
            <Trophy className="h-10 w-10 text-green-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-700 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Total Submissions</p>
              <p className="text-3xl font-bold text-white">{challengeStats?.overview?.totalSubmissions || 0}</p>
              <p className="text-purple-300 text-xs mt-1">Code submissions</p>
            </div>
            <Code className="h-10 w-10 text-purple-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-600 to-orange-800 border border-orange-700 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-200 text-sm font-medium">Premium Users</p>
              <p className="text-3xl font-bold text-white">{userStats?.premiumUsers || 0}</p>
              <p className="text-orange-300 text-xs mt-1">Paid subscribers</p>
            </div>
            <Shield className="h-10 w-10 text-orange-300" />
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">New Users (Today)</span>
              <span className="text-yellow-400 font-semibold">+{userStats?.newUsersToday || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">Challenge Completions</span>
              <span className="text-blue-400 font-semibold">{challengeStats?.overview?.completedChallenges || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">System Uptime</span>
              <span className="text-green-400 font-semibold">99.9%</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">Professional Users</span>
              <span className="text-purple-400 font-semibold">{userStats?.professionalUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">Admin Users</span>
              <span className="text-red-400 font-semibold">{userStats?.adminUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
              <span className="text-gray-300">Avg. Completion Rate</span>
              <span className="text-green-400 font-semibold">
                {(() => {
                  const total = challengeStats?.overview?.totalChallenges || 0;
                  const completed = challengeStats?.overview?.completedChallenges || 0;
                  const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
                  return `${rate}%`;
                })()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;

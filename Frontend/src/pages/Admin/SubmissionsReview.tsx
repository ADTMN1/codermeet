import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Code, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Filter,
  Search,
  Eye,
  Star,
  Trophy
} from 'lucide-react';
import { SubmissionsManagement } from '../../components/admin/SubmissionsManagement';
import { challengeService, Challenge } from '../../services/challengeService';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';

const SubmissionsReview: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeForSubmissions, setSelectedChallengeForSubmissions] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'daily'>('all');

  useEffect(() => {
    fetchAllChallenges();
  }, []);

  const fetchAllChallenges = async () => {
    try {
      setLoading(true);
      
      // Fetch all types of challenges
      const [allChallenges, weekly, daily] = await Promise.all([
        challengeService.getAllChallenges({ limit: 100 }),
        challengeService.getAllWeeklyChallenges({ limit: 100 }),
        challengeService.getDailyChallenges({ limit: 100 })
      ]);
      
      setChallenges(allChallenges?.data?.challenges || []);
      setWeeklyChallenges(weekly?.data || []);
      setDailyChallenges(daily?.data || []);
      
      console.log('📊 All challenges:', allChallenges?.data?.challenges?.length);
      console.log('📅 Weekly challenges:', weekly?.data?.length);
      console.log('📝 Daily challenges:', daily?.data?.length);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
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
        <h2 className="text-2xl font-bold text-white mb-2">Code Review</h2>
        <p className="text-gray-400">Review and manage challenge submissions</p>
      </div>

      {/* Challenge Type Tabs */}
      <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          All Challenges ({challenges.length})
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Weekly ({weeklyChallenges.length})
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'daily'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Daily ({dailyChallenges.length})
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Total Submissions</p>
              <p className="text-2xl font-bold text-white">
                {challenges.reduce((sum, c) => sum + (c.submissions?.length || 0), 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-600 to-green-800 border border-green-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-white">12</p>
            </div>
            <Clock className="w-8 h-8 text-green-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">Approved</p>
              <p className="text-2xl font-bold text-white">89</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-red-600 to-red-800 border border-red-700 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm font-medium">Rejected</p>
              <p className="text-2xl font-bold text-white">5</p>
            </div>
            <XCircle className="w-8 h-8 text-red-300" />
          </div>
        </motion.div>
      </div>

      {/* Challenge Selector */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
             <select
              value={selectedChallengeForSubmissions || ''}
              onChange={(e) => setSelectedChallengeForSubmissions(e.target.value || null)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="">All {activeTab === 'all' ? 'Challenges' : activeTab === 'weekly' ? 'Weekly Challenges' : 'Daily Challenges'}</option>
              {(activeTab === 'all' ? challenges : activeTab === 'weekly' ? weeklyChallenges : dailyChallenges).map((challenge) => (
                <option key={challenge._id} value={challenge._id}>
                  {challenge.title} ({challenge.status || 'active'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setSelectedChallengeForSubmissions(null)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Submissions Management */}
      <SubmissionsManagement challengeId={selectedChallengeForSubmissions || undefined} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Top Performers
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">John Developer</p>
                  <p className="text-gray-400 text-sm">15 submissions</p>
                </div>
              </div>
              <span className="text-yellow-400 font-semibold">95%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Jane Coder</p>
                  <p className="text-gray-400 text-sm">12 submissions</p>
                </div>
              </div>
              <span className="text-gray-400 font-semibold">88%</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-white font-medium">Daily Challenge #45</p>
                <p className="text-gray-400 text-sm">8 new submissions</p>
              </div>
              <span className="text-blue-400 text-sm">2h ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-white font-medium">Weekly Contest #12</p>
                <p className="text-gray-400 text-sm">3 new submissions</p>
              </div>
              <span className="text-blue-400 text-sm">5h ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubmissionsReview;

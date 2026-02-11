import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import {
  FaTrophy,
  FaMedal,
  FaAward,
  FaCrown,
  FaStar,
  FaFire,
  FaRocket,
  FaGem,
  FaCode,
  FaUser,
  FaChartLine,
  FaChevronUp,
  FaChevronDown,
  FaMinus,
  FaEllipsisH,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaClock,
  FaEye
} from 'react-icons/fa';

interface LeaderboardUser {
  _id: string;
  name: string;
  username?: string;
  points: number;
  rank: number;
  previousRank?: number;
  avatar?: string;
  profilePicture?: string;
  badges?: string[];
  streak?: number;
  joinDate?: string;
  lastActive?: string;
  challengesCompleted?: number;
  projectsSubmitted?: number;
  communityScore?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPoints: number;
  averagePoints: number;
  topScore: number;
  updated: string;
}

const ImpressiveLeaderboard: React.FC = () => {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPoints: 0,
    averagePoints: 0,
    topScore: 0,
    updated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all-time' | 'monthly' | 'weekly'>('all-time');
  const [categoryFilter, setCategoryFilter] = useState<'overall' | 'challenges' | 'community' | 'projects'>('overall');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTopOnly, setShowTopOnly] = useState(false);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Sample impressive leaderboard data
  const sampleLeaderboard: LeaderboardUser[] = [
    {
      _id: '1',
      name: 'Amanuel Tesfaye',
      username: '@amanuel_dev',
      points: 5420,
      rank: 1,
      previousRank: 2,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amanuel',
      badges: ['🏆 Champion', '🔥 30-Day Streak', '💎 Diamond'],
      streak: 30,
      joinDate: '2023-01-15',
      lastActive: '2 hours ago',
      challengesCompleted: 145,
      projectsSubmitted: 23,
      communityScore: 9.8
    },
    {
      _id: '2',
      name: 'Selamawit Bekele',
      username: '@selam_code',
      points: 4890,
      rank: 2,
      previousRank: 1,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=selam',
      badges: ['🥈 Runner-up', '⚡ Lightning Coder', '🌟 Rising Star'],
      streak: 25,
      joinDate: '2023-02-20',
      lastActive: '1 hour ago',
      challengesCompleted: 132,
      projectsSubmitted: 19,
      communityScore: 9.5
    },
    {
      _id: '3',
      name: 'Kaleb Haile',
      username: '@kaleb_tech',
      points: 4560,
      rank: 3,
      previousRank: 4,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kaleb',
      badges: ['🥉 Third Place', '🚀 Project Master', '💡 Innovator'],
      streak: 18,
      joinDate: '2023-03-10',
      lastActive: '30 minutes ago',
      challengesCompleted: 128,
      projectsSubmitted: 21,
      communityScore: 9.2
    },
    {
      _id: '4',
      name: 'Ruth Mekonnen',
      username: '@ruth_dev',
      points: 4230,
      rank: 4,
      previousRank: 6,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ruth',
      badges: ['🌟 Rising Star', '👥 Community Hero', '🎯 Challenge Master'],
      streak: 22,
      joinDate: '2023-04-05',
      lastActive: '5 hours ago',
      challengesCompleted: 119,
      projectsSubmitted: 17,
      communityScore: 9.7
    },
    {
      _id: '5',
      name: 'Daniel Berhane',
      username: '@daniel_code',
      points: 3980,
      rank: 5,
      previousRank: 3,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=daniel',
      badges: ['⚡ Speed Coder', '🔧 Problem Solver', '📚 Knowledge Sharer'],
      streak: 15,
      joinDate: '2023-05-12',
      lastActive: '3 hours ago',
      challengesCompleted: 115,
      projectsSubmitted: 20,
      communityScore: 8.9
    },
    {
      _id: '6',
      name: 'Hanna Tadesse',
      username: '@hanna_tech',
      points: 3750,
      rank: 6,
      previousRank: 8,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hanna',
      badges: ['🌱 Growing Talent', '💬 Discussion Leader', '🎨 Creative Coder'],
      streak: 12,
      joinDate: '2023-06-18',
      lastActive: '1 hour ago',
      challengesCompleted: 108,
      projectsSubmitted: 15,
      communityScore: 9.1
    },
    {
      _id: '7',
      name: 'Yosef Kassa',
      username: '@yosef_dev',
      points: 3520,
      rank: 7,
      previousRank: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yosef',
      badges: ['🔥 Streak Master', '🏅 Consistent Coder', '🤝 Team Player'],
      streak: 28,
      joinDate: '2023-07-22',
      lastActive: '4 hours ago',
      challengesCompleted: 102,
      projectsSubmitted: 18,
      communityScore: 8.7
    },
    {
      _id: '8',
      name: 'Meron Abebe',
      username: '@meron_code',
      points: 3290,
      rank: 8,
      previousRank: 10,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=meron',
      badges: ['📈 Fast Learner', '🎯 Goal Achiever', '💫 Bright Spark'],
      streak: 8,
      joinDate: '2023-08-30',
      lastActive: '2 hours ago',
      challengesCompleted: 98,
      projectsSubmitted: 14,
      communityScore: 9.0
    }
  ];

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeFilter, categoryFilter]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const response = await axios.get(`${API_URL}/api/leaderboard`, {
        params: { limit: 50 }, // Get more users for better filtering
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });

      const apiData = response.data;
      let realData = apiData.users.map((user: any) => {
        return {
          _id: user._id,
          name: user.fullName || user.username,
          username: user.username ? `@${user.username}` : '',
          points: user.points || 0,
          rank: user.rank,
          avatar: user.avatar || user.profileImage,
          profilePicture: user.avatar || user.profileImage,
          badges: [], // TODO: Implement badges system
          streak: user.streak || 0,
          joinDate: new Date(user.joinDate).toLocaleDateString(),
          lastActive: user.lastActive ? 
            new Date(user.lastActive).toLocaleString() : 'Unknown',
          challengesCompleted: user.challengesCompleted || 0,
          projectsSubmitted: user.projectsSubmitted || 0,
          communityScore: user.communityScore || '0.0',
          isCurrentUser: user ? (user._id === user._id) : false
        };
      });
      
      // Apply category filter logic - use real data instead of mock calculations
      if (categoryFilter === 'challenges') {
        realData = realData.sort((a: LeaderboardUser, b: LeaderboardUser) => b.challengesCompleted! - a.challengesCompleted!);
      } else if (categoryFilter === 'community') {
        realData = realData.sort((a: LeaderboardUser, b: LeaderboardUser) => 
          parseFloat(String(b.communityScore || '0')) - parseFloat(String(a.communityScore || '0'))
        );
      } else if (categoryFilter === 'projects') {
        realData = realData.sort((a: LeaderboardUser, b: LeaderboardUser) => b.projectsSubmitted! - a.projectsSubmitted!);
      } else {
        realData = realData.sort((a: LeaderboardUser, b: LeaderboardUser) => b.points - a.points);
      }

      // Re-rank after filtering
      realData = realData.map((user: LeaderboardUser, index: number) => ({
        ...user,
        rank: index + 1
      }));

      // Mark current user
      if (user) {
        realData = realData.map((u: LeaderboardUser) => ({
          ...u,
          isCurrentUser: u._id === user._id || u.name === user.name || u.username === `@${user.username}`
        }));
      }

      setLeaderboard(realData);
      
      // Calculate stats
      const newStats = {
        totalUsers: apiData.totalUsers,
        activeUsers: apiData.activeUsers,
        totalPoints: apiData.totalPoints,
        averagePoints: apiData.averagePoints,
        topScore: apiData.topScore,
        updated: apiData.updated
      };
      setStats(newStats);

    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <FaTrophy className="w-6 h-6 text-yellow-400" />;
      case 2: return <FaMedal className="w-6 h-6 text-gray-300" />;
      case 3: return <FaAward className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return <FaMinus className="w-3 h-3 text-gray-500" />;
    if (current < previous) return <FaChevronUp className="w-3 h-3 text-green-400" />;
    if (current > previous) return <FaChevronDown className="w-3 h-3 text-red-400" />;
    return <FaMinus className="w-3 h-3 text-gray-500" />;
  };

  const getStreakColor = (streak?: number) => {
    if (!streak) return 'text-gray-500';
    if (streak >= 30) return 'text-red-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const filteredLeaderboard = leaderboard.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayLeaderboard = showTopOnly ? filteredLeaderboard.slice(0, 3) : showFullLeaderboard ? filteredLeaderboard : filteredLeaderboard.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-900 rounded-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
            <FaTrophy className="text-yellow-400" />
             Leaderboard
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <FaUser className="w-4 h-4" />
              {stats.totalUsers.toLocaleString()} developers
            </span>
            <span className="flex items-center gap-1">
              <FaClock className="w-4 h-4" />
              Updated {new Date(stats.updated).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all-time">All Time</option>
            <option value="monthly">This Month</option>
            <option value="weekly">This Week</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="overall">Overall</option>
            <option value="challenges">Challenges</option>
            <option value="community">Community</option>
            <option value="projects">Projects</option>
          </select>

          <button
            onClick={() => setShowTopOnly(!showTopOnly)}
            className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
              showTopOnly 
                ? 'bg-purple-600 border-purple-600 text-white' 
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <FaEye className="w-4 h-4 mr-1" />
            {showTopOnly ? 'Show All' : 'Top 3'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search developers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Top Score</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.topScore.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Active Users</p>
          <p className="text-2xl font-bold text-green-400">{stats.activeUsers.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Avg Points</p>
          <p className="text-2xl font-bold text-blue-400">{stats.averagePoints.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Total Points</p>
          <p className="text-2xl font-bold text-purple-400">{(stats.totalPoints / 1000).toFixed(1)}K</p>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {displayLeaderboard.map((user) => (
          <div
            key={user._id}
            className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
              user.isCurrentUser 
                ? 'bg-purple-900/30 border border-purple-500/50' 
                : 'bg-gray-800 hover:bg-gray-750'
            }`}
          >
            {/* Rank */}
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadge(user.rank)}`}>
                {getRankIcon(user.rank)}
              </div>
              <div className="flex flex-col">
                {getRankChange(user.rank, user.previousRank)}
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                {user.avatar || user.profilePicture ? (
                  <img
                    src={user.avatar || user.profilePicture}
                    alt={user.name}
                    className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-gray-600 bg-gray-700 flex items-center justify-center">
                    <FaUser className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                {user.streak && user.streak > 0 && (
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center ${getStreakColor(user.streak)}`}>
                    <FaFire className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">
                    {user.name}
                    {user.isCurrentUser && (
                      <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">You</span>
                    )}
                  </h3>
                  {user.username && (
                    <span className="text-gray-400 text-sm">{user.username}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <FaCode className="w-3 h-3" />
                    {user.challengesCompleted} challenges
                  </span>
                  <span className="flex items-center gap-1">
                    <FaRocket className="w-3 h-3" />
                    {user.projectsSubmitted} projects
                  </span>
                  {user.streak && user.streak > 0 && (
                  <span className={`flex items-center gap-1 ${getStreakColor(user.streak)}`}>
                    <FaFire className="w-3 h-3" />
                    {user.streak} day streak
                  </span>
                )}
                </div>
                {/* Badges */}
                {user.badges && user.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.badges.slice(0, 3).map((badge, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-700 text-xs rounded-full text-gray-300">
                        {badge}
                      </span>
                    ))}
                    {user.badges.length > 3 && (
                      <span className="px-2 py-1 bg-gray-700 text-xs rounded-full text-gray-400">
                        +{user.badges.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Points */}
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-400">{user.points.toLocaleString()}</p>
              <p className="text-xs text-gray-400">points</p>
            </div>
          </div>
        ))}
      </div>

      {/* View More */}
      {!showTopOnly && !showFullLeaderboard && filteredLeaderboard.length > 10 && (
        <div className="mt-6 text-center">
          <button 
            onClick={() => setShowFullLeaderboard(true)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            View Full Leaderboard
          </button>
        </div>
      )}

      {/* Current User Position (if not in top 10) */}
      {user && !leaderboard.slice(0, 10).some(u => u.isCurrentUser) && (
        <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-purple-400 font-bold">#{leaderboard.find(u => u.isCurrentUser)?.rank || 'N/A'}</span>
              <span className="text-white">Your Position</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-purple-400">
                {leaderboard.find(u => u.isCurrentUser)?.points?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-400">points</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpressiveLeaderboard;

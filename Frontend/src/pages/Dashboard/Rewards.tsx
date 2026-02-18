import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import axios from 'axios';
import LoadingSpinner from '../../components/ui/loading-spinner';
import {
  FaTrophy,
  FaMedal,
  FaAward,
  FaStar,
  FaCoins,
  FaChartLine,
  FaHistory,
  FaFire,
  FaBolt,
  FaRocket,
  FaCheckCircle,
  FaClock,
  FaInfoCircle,
  FaCode,
  FaUsers,
  FaComments,
  FaLightbulb,
  FaGraduationCap,
  FaCalendarAlt,
  FaGem,
  FaCrown,
  FaArrowRight
} from 'react-icons/fa';

interface PointActivity {
  id: string;
  type: string;
  description: string;
  points: number;
  date: string;
  icon: string; // Icon name from backend
}

// Icon mapping function
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'FaCode': <FaCode className="w-5 h-5 text-blue-400" />,
    'FaRocket': <FaRocket className="w-5 h-5 text-purple-400" />,
    'FaUsers': <FaUsers className="w-5 h-5 text-green-400" />,
    'FaGraduationCap': <FaGraduationCap className="w-5 h-5 text-yellow-400" />,
    'FaFire': <FaFire className="w-5 h-5 text-orange-400" />,
    'FaLightbulb': <FaLightbulb className="w-5 h-5 text-pink-400" />,
    'FaStar': <FaStar className="w-5 h-5 text-yellow-300" />,
    'default': <FaStar className="w-5 h-5 text-gray-400" />
  };
  
  return iconMap[iconName] || iconMap['default'];
};

interface UserStats {
  totalPoints: number;
  pointsThisMonth: number;
  pointsThisWeek: number;
  currentRank: string;
  nextRank: string;
  pointsToNextRank: number;
  activities: PointActivity[];
}

const Rewards: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    pointsThisMonth: 0,
    pointsThisWeek: 0,
    currentRank: 'Bronze',
    nextRank: 'Silver',
    pointsToNextRank: 100,
    activities: []
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Sample activities showing how points are earned (fallback if API fails)
  const sampleActivities: PointActivity[] = [
    {
      id: '1',
      type: 'daily_challenge',
      description: 'Completed daily coding challenge',
      points: 50,
      date: '2024-01-20',
      icon: 'FaCode'
    },
    {
      id: '2',
      type: 'weekly_challenge',
      description: 'Submitted weekly challenge project',
      points: 200,
      date: '2024-01-19',
      icon: 'FaRocket'
    },
    {
      id: '3',
      type: 'community_help',
      description: 'Helped 5 developers in community forum',
      points: 75,
      date: '2024-01-18',
      icon: 'FaUsers'
    },
    {
      id: '4',
      type: 'mentorship',
      description: 'Attended mentorship session',
      points: 100,
      date: '2024-01-17',
      icon: 'FaGraduationCap'
    },
    {
      id: '5',
      type: 'streak_bonus',
      description: '7-day login streak bonus',
      points: 150,
      date: '2024-01-16',
      icon: 'FaFire'
    },
    {
      id: '6',
      type: 'business_idea',
      description: 'Submitted innovative business idea',
      points: 300,
      date: '2024-01-15',
      icon: 'FaLightbulb'
    }
  ];

  // Ways to earn points
  const earningWays = [
    {
      title: 'Daily Coding Challenges',
      description: 'Complete daily programming challenges to sharpen your skills',
      points: '50 points',
      icon: <FaCode className="w-6 h-6 text-blue-400" />,
      frequency: 'Daily',
      difficulty: 'Easy to Medium'
    },
    {
      title: 'Weekly Projects',
      description: 'Build and submit complete projects based on weekly themes',
      points: '200-500 points',
      icon: <FaRocket className="w-6 h-6 text-purple-400" />,
      frequency: 'Weekly',
      difficulty: 'Medium to Hard'
    },
    {
      title: 'Community Participation',
      description: 'Help others, answer questions, and contribute to discussions',
      points: '10-25 points',
      icon: <FaUsers className="w-6 h-6 text-green-400" />,
      frequency: 'Ongoing',
      difficulty: 'Easy'
    },
    {
      title: 'Mentorship Sessions',
      description: 'Attend or conduct mentorship sessions',
      points: '100-300 points',
      icon: <FaGraduationCap className="w-6 h-6 text-yellow-400" />,
      frequency: 'Weekly',
      difficulty: 'Medium'
    },
    {
      title: 'Business Idea Competition',
      description: 'Submit innovative startup ideas and business plans',
      points: '300-1000 points',
      icon: <FaLightbulb className="w-6 h-6 text-pink-400" />,
      frequency: 'Monthly',
      difficulty: 'Hard'
    },
    {
      title: 'Login Streaks',
      description: 'Maintain daily login streaks for bonus points',
      points: '10-200 points',
      icon: <FaFire className="w-6 h-6 text-orange-400" />,
      frequency: 'Daily',
      difficulty: 'Easy'
    }
  ];

  // Rank system
  const rankSystem = [
    { name: 'Bronze', minPoints: 0, color: 'text-amber-600', icon: <FaMedal className="w-8 h-8" /> },
    { name: 'Silver', minPoints: 500, color: 'text-gray-400', icon: <FaMedal className="w-8 h-8" /> },
    { name: 'Gold', minPoints: 1500, color: 'text-yellow-500', icon: <FaTrophy className="w-8 h-8" /> },
    { name: 'Platinum', minPoints: 3000, color: 'text-purple-400', icon: <FaGem className="w-8 h-8" /> },
    { name: 'Diamond', minPoints: 5000, color: 'text-blue-400', icon: <FaCrown className="w-8 h-8" /> }
  ];

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token || !user?._id) {
        setLoading(false);
        return;
      }

      // Fetch real data from API
      const [statsRes, activitiesRes] = await Promise.all([
        axios.get(`${API_URL}/users/points-stats/${user._id}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${API_URL}/users/point-activities/${user._id}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);

      // Set real data
      setUserStats({
        totalPoints: statsRes.data.data.totalPoints,
        pointsThisMonth: statsRes.data.data.pointsThisMonth,
        pointsThisWeek: statsRes.data.data.pointsThisWeek,
        currentRank: statsRes.data.data.currentRank,
        nextRank: statsRes.data.data.nextRank,
        pointsToNextRank: statsRes.data.data.pointsToNextRank,
        activities: activitiesRes.data.data.map((activity: any) => ({
          ...activity,
          date: new Date(activity.date).toLocaleDateString()
        }))
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch points data:', error);
      // Fallback to basic data using user points
      setUserStats({
        totalPoints: user?.points || 0,
        pointsThisMonth: 0,
        pointsThisWeek: 0,
        currentRank: 'Bronze',
        nextRank: 'Silver',
        pointsToNextRank: 500,
        activities: []
      });
      setLoading(false);
    }
  };

  const getCurrentRank = () => {
    return rankSystem.find(rank => rank.name === userStats.currentRank) || rankSystem[0];
  };

  const getNextRank = () => {
    const currentIndex = rankSystem.findIndex(rank => rank.name === userStats.currentRank);
    return rankSystem[currentIndex + 1] || rankSystem[currentIndex];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <LoadingSpinner size="lg" text="Loading rewards information..." />
      </div>
    );
  }

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FaTrophy className="text-yellow-400" />
              Points & Rewards System
            </h1>
            <p className="text-gray-400">Learn how to earn points and track your progress</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Points</p>
                <p className="text-2xl font-bold text-white">{userStats.totalPoints}</p>
              </div>
              <FaCoins className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-green-400">{userStats.pointsThisMonth}</p>
              </div>
              <FaChartLine className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Current Rank</p>
                <p className={`text-2xl font-bold ${currentRank.color}`}>{userStats.currentRank}</p>
              </div>
              <div className={currentRank.color}>
                {currentRank.icon}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-blue-400">{userStats.pointsThisWeek}</p>
              </div>
              <FaCalendarAlt className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Rank Progress */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Rank Progress</h3>
              <p className="text-gray-400 text-sm">{userStats.pointsToNextRank} points to {userStats.nextRank}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${currentRank.color}`}>
                {currentRank.icon}
                <span className="font-medium">{userStats.currentRank}</span>
              </div>
              <FaArrowRight className="text-gray-500" />
              <div className={`flex items-center gap-2 ${nextRank.color}`}>
                {nextRank.icon}
                <span className="font-medium">{userStats.nextRank}</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (userStats.totalPoints / (userStats.totalPoints + userStats.pointsToNextRank)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* How to Earn Points */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FaInfoCircle className="text-blue-400" />
          How to Earn Points
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {earningWays.map((way, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-700 rounded-lg">
                  {way.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{way.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{way.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-400 font-medium">{way.points}</span>
                    <div className="flex items-center gap-2 text-gray-500">
                      <FaClock className="w-3 h-3" />
                      <span>{way.frequency}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Difficulty: {way.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rank System */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FaAward className="text-yellow-400" />
          Rank System
        </h2>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {rankSystem.map((rank, index) => (
              <div 
                key={index} 
                className={`text-center p-4 rounded-lg border ${
                  rank.name === userStats.currentRank 
                    ? 'border-purple-500 bg-purple-900/20' 
                    : 'border-gray-600 bg-gray-700/30'
                }`}
              >
                <div className={`${rank.color} mb-2 flex justify-center`}>
                  {rank.icon}
                </div>
                <h3 className={`font-semibold ${rank.name === userStats.currentRank ? 'text-white' : 'text-gray-300'}`}>
                  {rank.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{rank.minPoints}+ points</p>
                {rank.name === userStats.currentRank && (
                  <span className="inline-block mt-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FaHistory className="text-green-400" />
          Recent Point Activities
        </h2>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          {userStats.activities.length === 0 ? (
            <div className="text-center py-8">
              <FaHistory className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No point activities yet</p>
              <p className="text-gray-500 text-sm mt-2">Start participating in challenges to earn points!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userStats.activities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-800 rounded">
                      {getIconComponent(activity.icon)}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{activity.description}</h4>
                      <p className="text-gray-400 text-sm">{activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">+{activity.points}</p>
                    <p className="text-gray-500 text-sm">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
          <FaLightbulb className="w-5 h-5" />
          Pro Tips for Earning More Points
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-400 mt-1" />
            <div>
              <p className="text-white font-medium">Stay Consistent</p>
              <p className="text-gray-300 text-sm">Complete daily challenges to build streaks and earn bonus points</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-400 mt-1" />
            <div>
              <p className="text-white font-medium">Help Others</p>
              <p className="text-gray-300 text-sm">Answer questions in the community to earn recognition points</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-400 mt-1" />
            <div>
              <p className="text-white font-medium">Think Big</p>
              <p className="text-gray-300 text-sm">Submit innovative business ideas for maximum points</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-400 mt-1" />
            <div>
              <p className="text-white font-medium">Learn Continuously</p>
              <p className="text-gray-300 text-sm">Attend mentorship sessions to gain knowledge and points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;

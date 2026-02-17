import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrophy, FaFire, FaStar, FaCode, FaRocket, FaGem } from 'react-icons/fa';

interface Achievement {
  _id: string;
  title: string;
  description: string;
  points: number;
  type: string;
  icon: string;
  color: string;
  awardedAt: string;
  rank?: number;
  score?: number;
}

interface RecentAchievementsProps {
  limit?: number;
}

const RecentAchievements: React.FC<RecentAchievementsProps> = ({ limit = 5 }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.get(`${API_URL}/achievements`, {
        params: { limit },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAchievements(response.data.data.achievements);
      } else {
        setError('Failed to fetch achievements');
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to fetch achievements');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getIconForType = (type: string, icon: string) => {
    switch (type) {
      case 'challenge':
        return <FaCode className="text-blue-400" />;
      case 'daily':
        return <FaStar className="text-green-400" />;
      case 'milestone':
        return <FaRocket className="text-purple-400" />;
      default:
        return <FaTrophy className="text-yellow-400" />;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500/20';
      case 'green':
        return 'bg-green-500/20';
      case 'purple':
        return 'bg-purple-500/20';
      case 'orange':
        return 'bg-orange-500/20';
      default:
        return 'bg-yellow-500/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Achievements</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg animate-pulse">
              <div className="w-10 h-10 bg-gray-600/20 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 bg-gray-500 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Achievements</h2>
        <div className="text-center py-8">
          <p className="text-red-400">Error loading achievements</p>
          <button 
            onClick={fetchAchievements}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Achievements</h2>
        <div className="text-center py-8">
          <FaTrophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Achievements Yet</h3>
          <p className="text-gray-500 text-sm">
            Start completing challenges and daily tasks to earn your first achievements!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Recent Achievements</h2>
      <div className="space-y-3">
        {achievements.map((achievement) => (
          <div key={achievement._id} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
            <div className={`w-10 h-10 ${getColorClass(achievement.color)} rounded-full flex items-center justify-center`}>
              <span className="text-lg">
                {achievement.icon || getIconForType(achievement.type, achievement.icon)}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{achievement.title}</p>
              <p className="text-gray-400 text-sm">{formatTimeAgo(achievement.awardedAt)}</p>
              {achievement.points > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <FaGem className="text-yellow-400 text-xs" />
                  <span className="text-yellow-400 text-xs font-medium">+{achievement.points} points</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAchievements;

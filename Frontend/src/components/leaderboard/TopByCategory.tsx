import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCode, FaUsers, FaRocket, FaFire } from 'react-icons/fa';

interface CategoryLeader {
  category: string;
  icon: React.ReactNode;
  title: string;
  topUser: {
    username: string;
    fullName?: string;
    avatar?: string;
    score: number;
  };
}

const TopByCategory: React.FC = () => {
  const [categories, setCategories] = useState<CategoryLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopCategories();
  }, []);

  const fetchTopCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth_token');
      
      // Fetch top users by different categories
      const [challengesRes, communityRes, projectsRes, streaksRes] = await Promise.all([
        axios.get(`${API_URL}/leaderboard/top/challenges`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => ({ data: { users: [] } })),
        axios.get(`${API_URL}/leaderboard/top/community`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => ({ data: { users: [] } })),
        axios.get(`${API_URL}/leaderboard/top/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => ({ data: { users: [] } })),
        axios.get(`${API_URL}/leaderboard/top/streaks`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => ({ data: { users: [] } }))
      ]);

      const newCategories: CategoryLeader[] = [
        {
          category: 'challenges',
          icon: <FaCode className="text-blue-400" />,
          title: 'Challenge Master',
          topUser: challengesRes.data.users[0] || {
            username: 'No data',
            score: 0
          }
        },
        {
          category: 'community',
          icon: <FaUsers className="text-green-400" />,
          title: 'Community Hero',
          topUser: communityRes.data.users[0] || {
            username: 'No data',
            score: 0
          }
        },
        {
          category: 'projects',
          icon: <FaRocket className="text-purple-400" />,
          title: 'Project Builder',
          topUser: projectsRes.data.users[0] || {
            username: 'No data',
            score: 0
          }
        },
        {
          category: 'streaks',
          icon: <FaFire className="text-orange-400" />,
          title: 'Streak Champion',
          topUser: streaksRes.data.users[0] || {
            username: 'No data',
            score: 0
          }
        }
      ];

      setCategories(newCategories);
    } catch (err) {
      console.error('Error fetching top categories:', err);
      setError('Failed to fetch category leaders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Top by Category</h2>
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-600 rounded w-16"></div>
              </div>
              <div className="w-5 h-5 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Top by Category</h2>
        <div className="text-center py-8">
          <p className="text-red-400">Error loading category leaders</p>
          <button 
            onClick={fetchTopCategories}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Top by Category</h2>
        <div className="text-center py-8">
          <FaCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Category Data</h3>
          <p className="text-gray-500 text-sm">
            Start participating to see category leaders!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Top by Category</h2>
      <div className="space-y-3">
        {categories.map((category, index) => (
          <div key={category.category} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
            <div className="flex items-center gap-2">
              {category.icon}
              <span className="text-white">{category.title}</span>
            </div>
            <span className="text-gray-300">@{category.topUser.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopByCategory;

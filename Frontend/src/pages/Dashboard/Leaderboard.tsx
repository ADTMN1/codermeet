import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImpressiveLeaderboard from '../../components/leaderboard/ImpressiveLeaderboard';

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Developer Leaderboard</h1>
            <p className="text-gray-400">Top performers and rising stars in the CoderMeet community</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Leaderboard Component */}
      <ImpressiveLeaderboard />

      {/* Additional Features Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievement Showcase */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Achievements</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-400">🏆</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Amanuel reached Diamond rank!</p>
                <p className="text-gray-400 text-sm">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                <span className="text-orange-400">🔥</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Selamawit: 30-day streak!</p>
                <p className="text-gray-400 text-sm">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400">💎</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Kaleb completed 150 challenges</p>
                <p className="text-gray-400 text-sm">1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Overview */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Top by Category</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">💻</span>
                <span className="text-white">Challenge Master</span>
              </div>
              <span className="text-gray-300">@amanuel_dev</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-400">🤝</span>
                <span className="text-white">Community Hero</span>
              </div>
              <span className="text-gray-300">@ruth_dev</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-purple-400">🚀</span>
                <span className="text-white">Project Builder</span>
              </div>
              <span className="text-gray-300">@kaleb_tech</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">🔥</span>
                <span className="text-white">Streak Champion</span>
              </div>
              <span className="text-gray-300">@yosef_dev</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

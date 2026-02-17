import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImpressiveLeaderboard from '../../components/leaderboard/ImpressiveLeaderboard';
import RecentAchievements from '../../components/achievements/RecentAchievements';
import TopByCategory from '../../components/leaderboard/TopByCategory';

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
        <RecentAchievements limit={5} />

        {/* Categories Overview */}
        <TopByCategory />
      </div>
    </div>
  );
};

export default Leaderboard;

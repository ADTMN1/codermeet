import React, { useEffect, useState } from 'react';
import { FaCrown, FaCode, FaStar, FaTrophy, FaChartLine, FaUsers, FaSync } from 'react-icons/fa';
import { leaderboardService, LeaderboardUser } from '../../services/leaderboardService';

export default function LeaderboardPreview() {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [animatedPoints, setAnimatedPoints] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Fetch leaderboard data
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching leaderboard data...');
      const users = await leaderboardService.getTopUsers(3);
      console.log('Received users:', users);
      setTopUsers(users);
      setAnimatedPoints(users.map(() => 0));
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
      setTopUsers([]);
      setAnimatedPoints([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Set up real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const cleanup = leaderboardService.startRealTimeUpdates(
      (users) => {
        setTopUsers(users);
        setAnimatedPoints(users.map(() => 0));
        setLastUpdated(new Date());
      },
      30000, // 30 seconds
      { limit: 3, sortBy: 'points', sortOrder: 'desc' }
    );

    return cleanup;
  }, [realTimeEnabled]);

  // Animate points
  useEffect(() => {
    if (topUsers.length === 0) return;

    const interval = setInterval(() => {
      setAnimatedPoints((prev) =>
        prev.map((p, i) => {
          const target = topUsers[i]?.points || 0;
          return p < target ? Math.min(p + 2, target) : p;
        })
      );
    }, 20);

    return () => clearInterval(interval);
  }, [topUsers]);

  // Get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-yellow-400" />;
      case 2:
        return <FaStar className="text-gray-400" />;
      case 3:
        return <FaStar className="text-orange-400" />;
      default:
        return <FaTrophy className="text-purple-400" />;
    }
  };

  // Get progress bar color based on rank
  const getProgressColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 via-yellow-500 to-amber-600';
      case 2:
        return 'from-gray-300 via-gray-400 to-gray-500';
      case 3:
        return 'from-orange-400 via-orange-500 to-orange-600';
      default:
        return 'from-purple-400 via-pink-500 to-blue-400';
    }
  };

  // Get max points for progress calculation
  const maxPoints = Math.max(...topUsers.map(u => u.points), 100);

  return (
    <section className="relative max-w-6xl mx-auto py-24 px-6 text-center">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 flex items-center gap-3">
          <FaCode /> Leaderboard
        </h2>
        
        <div className="flex items-center gap-4">
          {/* Real-time indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-400">
              {realTimeEnabled ? 'Live' : 'Static'}
            </span>
          </div>
          
          {/* Controls */}
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            title={realTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
          >
            <FaChartLine className="w-4 h-4" />
          </button>
          
          <button
            onClick={fetchLeaderboardData}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Refresh leaderboard"
          >
            <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <div className="flex items-center gap-2 text-gray-400">
          <FaUsers className="w-4 h-4" />
          <span className="text-sm">{topUsers.length} Top Developers</span>
        </div>
        <div className="text-gray-400 text-sm">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Terminal-Like Leaderboard */}
      <div className="bg-black/90 rounded-xl p-8 shadow-lg shadow-purple-500/30 font-mono text-left text-green-400 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <span className="ml-3 text-green-400">Loading leaderboard...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Error: {error}</p>
            <button
              onClick={fetchLeaderboardData}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {topUsers.map((user, index) => (
              <div
                key={user._id}
                className="mb-6 relative group transition-all hover:scale-105"
              >
                {/* Username + rank */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 font-bold text-lg">
                      #{user.rank}
                    </span>
                    <span className="text-cyan-400 font-bold text-lg">
                      @{user.username}
                    </span>
                    {getRankIcon(user.rank)}
                  </div>
                  
                  {/* Plan badge */}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.plan === 'Premium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    user.plan === 'Basic' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {user.plan}
                  </span>
                </div>

                {/* Animated progress bar */}
                <div className="bg-white/10 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-3 bg-gradient-to-r ${getProgressColor(user.rank)} transition-all duration-500`}
                    style={{
                      width: `${(animatedPoints[index] / maxPoints) * 100}%`,
                    }}
                  />
                </div>

                {/* Points line like code */}
                <p className="text-green-300 mt-1">
                  {`// Score: ${animatedPoints[index]} pts`}
                </p>
                
                {/* Additional info */}
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{user.fullName}</span>
                  <span>Rank #{user.rank}</span>
                </div>
              </div>
            ))}

            {/* Neon footer accent */}
            <div className="mt-8 h-1 w-32 mx-auto rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 animate-pulse"></div>
          </>
        )}
      </div>

      {/* View Full Leaderboard Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
        >
          <FaTrophy className="w-5 h-5" />
          View Full Leaderboard
        </button>
      </div>
    </section>
  );
}

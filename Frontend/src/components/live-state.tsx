import React, { useState, useEffect } from 'react';
import { Users, UsersRound, FileCheck, Trophy, Wifi, WifiOff } from 'lucide-react';
import { Card } from './ui/card';
import { motion } from 'motion/react';
import { leaderboardService } from '../services/leaderboardService';
import { socketService } from '../services/socketService';

export function LiveStats({ challengeId }: { challengeId?: string }) {
  const [stats, setStats] = useState({
    participants: 0,
    teams: 0,
    submissions: 0,
    onlineUsers: 0,
  });
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Remove hardcoded demo data - start with zeros
  useEffect(() => {
    // Initialize with zeros, will be updated by WebSocket
    setStats({
      participants: 0,
      teams: 0,
      submissions: 0,
      onlineUsers: 0,
    });
  }, []);

  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; score: number; avatar?: string }[]>([]);

  useEffect(() => {
    let mounted = true;

    const fallback = [
      { rank: 1, name: 'CodeNinjas', score: 98, avatar: '🥇' },
      { rank: 2, name: 'DevMasters', score: 95, avatar: '🥈' },
      { rank: 3, name: 'ByteBuilders', score: 92, avatar: '🥉' },
    ];

    const fetchTop = async () => {
      try {
        const users = await leaderboardService.getTopUsers(3);
        if (!mounted) return;

        if (users && users.length > 0) {
          const mapped = users.slice(0, 3).map(u => ({
            rank: u.rank || 0,
            name: u.fullName || u.username || u._id || 'User',
            score: u.points || 0,
            avatar: u.avatar || u.profileImage || (u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : '🥉'),
          }));
          setLeaderboard(mapped);
        } else {
          setLeaderboard(fallback);
        }
      } catch (err) {
        setLeaderboard(fallback);
      }
    };

    fetchTop();

    return () => {
      mounted = false;
    };
  }, []);

  // WebSocket real-time updates
  useEffect(() => {
    if (!challengeId) return;

    // Fetch initial data from API as fallback
    const fetchInitialStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/challenges/${challengeId}/stats`, {
          headers: {
            'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(prev => ({
            participants: data.participants || prev.participants,
            teams: data.teams || prev.teams,
            submissions: data.submissions || prev.submissions,
            onlineUsers: prev.onlineUsers, // Keep WebSocket value for online users
          }));
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.log('Could not fetch initial stats, will wait for WebSocket');
      }
    };

    // Listen for live stats updates
    const handleLiveStatsUpdate = (newStats: any) => {
      setStats(prev => ({
        participants: newStats.participants || prev.participants,
        teams: newStats.teams || prev.teams,
        submissions: newStats.submissions || prev.submissions,
        onlineUsers: newStats.onlineUsers || prev.onlineUsers,
      }));
      setLastUpdate(new Date(newStats.timestamp));
      setIsLive(true);
    };

    // Listen for online users updates
    const handleOnlineUsers = (data: { count: number }) => {
      setStats(prev => ({ ...prev, onlineUsers: data.count }));
      setLastUpdate(new Date());
      setIsLive(true);
    };

    // Set up event listeners
    socketService.on('live-stats-update', handleLiveStatsUpdate);
    socketService.onOnlineUsers(handleOnlineUsers);

    // Request initial stats if connected, otherwise fetch from API
    if (socketService.isConnected()) {
      socketService.requestLiveStats(challengeId);
    } else {
      fetchInitialStats();
    }

    // Cleanup
    return () => {
      socketService.off('live-stats-update', handleLiveStatsUpdate);
      socketService.off('online-users', handleOnlineUsers);
    };
  }, [challengeId]);

  return (
    <div className="space-y-6">
      {/* Live Statistics */}
      <Card className="bg-slate-900/50 border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-cyan-300">Live Statistics</h3>
            <div className="flex items-center gap-2">
              {isLive ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">Offline</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <motion.div
              className="p-4 rounded-lg bg-gradient-to-r from-purple-900/30 to-purple-800/30 border border-purple-500/30"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">
                      Total Participants
                    </div>
                    <div className="text-2xl text-purple-300">
                      {stats.participants.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-500/30"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <UsersRound className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">
                      Teams Registered
                    </div>
                    <div className="text-2xl text-blue-300">{stats.teams}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-green-800/30 border border-green-500/30"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <FileCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">
                      Projects Submitted
                    </div>
                    <div className="text-2xl text-green-300">
                      {stats.submissions}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 rounded-lg bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border border-cyan-500/30"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Wifi className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">
                      Online Now
                    </div>
                    <div className="text-2xl text-cyan-300">
                      {stats.onlineUsers}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Leaderboard Preview */}
      <Card className="bg-slate-900/50 border-yellow-500/20 shadow-lg shadow-yellow-500/10 backdrop-blur-sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-yellow-300">Leaderboard Preview</h3>
          </div>

          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${
                  entry.rank === 1
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : entry.rank === 2
                      ? 'bg-slate-400/10 border-slate-400/30'
                      : 'bg-orange-700/10 border-orange-700/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{entry.avatar}</div>
                    <div>
                      <div className="text-slate-200">{entry.name}</div>
                      <div className="text-xs text-slate-500">
                        Rank #{entry.rank}
                      </div>
                    </div>
                  </div>
                  <div className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    {entry.score}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

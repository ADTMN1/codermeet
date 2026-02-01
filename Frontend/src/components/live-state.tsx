import React from 'react';

import { useState, useEffect } from 'react';
import { Users, UsersRound, FileCheck, Trophy } from 'lucide-react';
import { Card } from './ui/card';
import { motion } from 'motion/react';
import { leaderboardService } from '../services/leaderboardService';

export function LiveStats() {
  const [stats, setStats] = useState({
    participants: 0,
    teams: 0,
    submissions: 0,
  });

  const finalStats = {
    participants: 1247,
    teams: 89,
    submissions: 423,
  };

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setStats({
        participants: Math.floor(finalStats.participants * progress),
        teams: Math.floor(finalStats.teams * progress),
        submissions: Math.floor(finalStats.submissions * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setStats(finalStats);
      }
    }, interval);

    return () => clearInterval(timer);
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

  return (
    <div className="space-y-6">
      {/* Live Statistics */}
      <Card className="bg-slate-900/50 border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm">
        <div className="p-6 space-y-4">
          <h3 className="text-cyan-300">Live Statistics</h3>

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

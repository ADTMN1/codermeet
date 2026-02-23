import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Users,
  Clock,
  CheckCircle,
  Eye,
  ArrowRight,
  ChevronRight,
  User,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface LeaderboardEntry {
  _id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar?: string;
  totalScore: number;
  rank: number;
  submittedAt: string;
  reviewedAt: string;
  criteriaScores?: Array<{
    name: string;
    score: number;
    maxScore: number;
    weight: number;
  }>;
  feedback?: string;
  status: string;
  isCurrentUser: boolean;
}

interface ChallengeLeaderboardData {
  challengeId: string;
  challengeTitle: string;
  challengeStatus: string;
  evaluationCriteria: Array<{
    name: string;
    description: string;
    maxScore: number;
    weight: number;
  }>;
  totalParticipants: number;
  totalSubmissions: number;
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
  topThree: LeaderboardEntry[];
  isCompleted: boolean;
  winnersAnnounced: boolean;
}

interface ChallengeLeaderboardProps {
  challengeId: string;
  onViewNextChallenge?: () => void;
}

export function ChallengeLeaderboard({ challengeId, onViewNextChallenge }: ChallengeLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<ChallengeLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchChallengeLeaderboard();
  }, [challengeId]);

  const fetchChallengeLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/weekly-challenges/${challengeId}/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      if (data.success) {
        setLeaderboardData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error('Error fetching challenge leaderboard:', error);
      toast.error('Failed to load challenge rankings');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-300" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-400';
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-300';
      case 3: return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading challenge rankings...</p>
        </div>
      </div>
    );
  }

  if (!leaderboardData) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No ranking data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900/50 border-purple-500/20 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                <Trophy className="text-yellow-400" />
                Challenge Rankings
              </h2>
              <p className="text-gray-400">{leaderboardData.challengeTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                leaderboardData.isCompleted 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {leaderboardData.isCompleted ? 'Completed' : 'In Progress'}
              </span>
              {leaderboardData.winnersAnnounced && (
                <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  Winners Announced
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Participants</p>
              <p className="text-xl font-bold text-purple-400">{leaderboardData.totalParticipants}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Submissions</p>
              <p className="text-xl font-bold text-blue-400">{leaderboardData.totalSubmissions}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Your Rank</p>
              <p className="text-xl font-bold text-yellow-400">
                {leaderboardData.currentUserRank || `#${leaderboardData.currentUserRank}` || 'Not Ranked'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <p className="text-xl font-bold text-green-400">
                {leaderboardData.isCompleted ? 'Finished' : 'Active'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Top 3 Winners */}
      {leaderboardData.topThree.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-yellow-500/30 shadow-lg shadow-yellow-500/10 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Top Winners
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaderboardData.topThree.map((winner, index) => (
                <motion.div
                  key={winner._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${getRankBadge(winner.rank)} text-center`}
                >
                  <div className="text-4xl mb-2">{getRankIcon(winner.rank)}</div>
                  <div className="mb-3">
                    {winner.userAvatar ? (
                      <img
                        src={winner.userAvatar}
                        alt={winner.userName}
                        className="w-16 h-16 rounded-full mx-auto border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto bg-gray-700 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-white mb-1">{winner.userName}</h4>
                  <p className="text-sm text-gray-300 mb-2">@{winner.userUsername}</p>
                  <p className="text-2xl font-bold">{winner.totalScore}</p>
                  <p className="text-xs text-gray-400">points</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card className="bg-slate-900/50 border-blue-500/20 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-300 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              All Rankings
            </h3>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showDetails ? 'Simple View' : 'Detailed View'}
            </Button>
          </div>

          <div className="space-y-3">
            {leaderboardData.leaderboard.map((entry, index) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border transition-all ${
                  entry.isCurrentUser 
                    ? 'bg-purple-900/30 border-purple-500/50' 
                    : 'bg-gray-800 hover:bg-gray-750 border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadge(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1">
                    {entry.userAvatar ? (
                      <img
                        src={entry.userAvatar}
                        alt={entry.userName}
                        className="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-gray-600 bg-gray-700 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">
                          {entry.userName}
                          {entry.isCurrentUser && (
                            <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">You</span>
                          )}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">@{entry.userUsername}</p>
                      {showDetails && (
                        <div className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(entry.submittedAt).toLocaleDateString()}
                          {entry.reviewedAt && ` • Reviewed: ${new Date(entry.reviewedAt).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-400">{entry.totalScore}</p>
                    <p className="text-xs text-gray-400">points</p>
                  </div>
                </div>

                {/* Detailed Criteria Scores */}
                {showDetails && entry.criteriaScores && entry.criteriaScores.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {entry.criteriaScores.map((criteria, idx) => (
                        <div key={idx} className="text-center p-2 bg-gray-800 rounded">
                          <p className="text-xs text-gray-400">{criteria.name}</p>
                          <p className="text-sm font-bold text-blue-400">{criteria.score}/{criteria.maxScore}</p>
                          <p className="text-xs text-gray-500">({criteria.weight}%)</p>
                        </div>
                      ))}
                    </div>
                    {entry.feedback && (
                      <div className="mt-2 p-2 bg-gray-800 rounded">
                        <p className="text-xs text-gray-400 mb-1">Feedback:</p>
                        <p className="text-sm text-gray-300">{entry.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      {leaderboardData.isCompleted && onViewNextChallenge && (
        <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold text-green-300 mb-2">Challenge Completed!</h3>
            <p className="text-gray-400 mb-4">
              Check out next week's challenge and see how you rank among other developers.
            </p>
            <Button
              onClick={() => {
                console.log('🔍 Next Challenge button clicked');
                onViewNextChallenge?.();
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
            >
              Next Challenge
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ChallengeLeaderboard;

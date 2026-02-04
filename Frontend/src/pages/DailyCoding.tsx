import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCode, 
  FaClock, 
  FaTrophy, 
  FaPlay, 
  FaRedo,
  FaLightbulb,
  FaTerminal,
  FaBookOpen,
  FaCrown,
  FaMedal,
  FaAward,
  FaBullseye,
  FaStar,
  FaUsers,
  FaCalendar
} from 'react-icons/fa';
import { useUser } from '../context/UserContext';

interface DailyChallenge {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  timeLimit: number;
  maxPoints: number;
  scoringCriteria: {
    speed: { weight: number; description: string };
    efficiency: { weight: number; description: string };
    correctness: { weight: number; description: string };
  };
  hint: string;
  solution: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  prizes: {
    first: { amount: number; type: string; currency: string };
    second: { amount: number; type: string; currency: string };
    third: { amount: number; type: string; currency: string };
  };
  completed: boolean;
  completedAt?: Date;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    fullName: string;
    username: string;
    avatar?: string;
  };
  score: number;
  completionTime: number;
  breakdown: {
    timeBonus: number;
    efficiencyBonus: number;
    correctnessScore: number;
  };
  isWinner: boolean;
  prize?: {
    amount: number;
    type: string;
    currency: string;
  };
}

export default function DailyCoding() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [userScore, setUserScore] = useState<number>(0);
  const [showHint, setShowHint] = useState(false);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  // Fetch today's challenge
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/daily-challenge/today`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });

        const data = await response.json();
        
        if (data.success) {
          setChallenge(data.data.challenge);
          setUserStats(data.data.userStats);
        } else {
          setError(data.message || 'Failed to load daily challenge');
        }
      } catch (error) {
        console.error('Error fetching daily challenge:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/daily-challenge/leaderboard`);
        const data = await response.json();
        
        if (data.success) {
          setLeaderboard(data.data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    if (!loading) {
      fetchLeaderboard();
    }
  }, [loading]);

  const handleRunCode = async () => {
    if (!challenge) return;
    
    setIsRunning(true);
    setOutput('Running code...');
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/daily-challenge/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          challengeId: challenge._id,
          code: code,
          language: 'javascript'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const score = data.data.score;
        setUserScore(score);
        setOutput(`Tests completed: ${data.data.testResults.passed}/${data.data.testResults.total} passed\nScore: ${score}\nTime: ${data.data.completionTime}ms`);
        
        // Refresh leaderboard
        const leaderboardResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/daily-challenge/leaderboard`);
        const leaderboardData = await leaderboardResponse.json();
        if (leaderboardData.success) {
          setLeaderboard(leaderboardData.data);
        }
      } else {
        setOutput(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      setOutput('Failed to submit code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setOutput('');
    setShowHint(false);
    setUserScore(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30';
      case 'Medium': return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30';
      case 'Hard': return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30';
      default: return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        <span className="ml-3 text-purple-400">Loading daily challenge...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <FaCode className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl text-slate-400 mb-2">Unable to Load Challenge</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br flex items-center justify-center">
        <div className="text-center">
          <FaCode className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl text-slate-400 mb-2">No Daily Challenge Available</h2>
          <p className="text-slate-500">Check back tomorrow for a new challenge!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br">
      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Challenge Header - Match WeeklyChallenge Style */}
        <div className="text-center space-y-4 pt-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FaCode className="w-10 h-10 text-purple-400" />
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
              Daily Coding Challenge
            </h1>
          </div>

          <p className="text-slate-400 text-lg">
            Improve your skills one challenge at a time.
          </p>

          {/* Challenge Title and Badges */}
          <div className="mt-6 space-y-4">
            <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
              {challenge.title}
            </h2>

            <div className="flex items-center gap-6">
              <div className={`px-4 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty}
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-blue-300 border border-blue-500/30 px-4 py-1 rounded-full text-sm font-medium">
                <FaTrophy className="inline w-4 h-4 mr-1" />
                {challenge.maxPoints} Points + Mobile Card Prize
              </div>
              {userScore > 0 && (
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30 px-4 py-1 rounded-full text-sm font-medium">
                  Score: {userScore}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problem Card */}
            <div className="bg-slate-900/50 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-cyan-300 text-lg font-semibold">Problem Description</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FaClock className="w-4 h-4" />
                  <span>{challenge.timeLimit} min</span>
                </div>
              </div>
              
              <p className="text-slate-300 mb-6">{challenge.description}</p>
              
              {/* Examples */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <FaBookOpen className="w-5 h-5 text-blue-400" />
                  Examples
                </h4>
                {challenge.examples.map((example, index) => (
                  <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400">Input: </span>
                        <span className="text-green-400 font-mono">{example.input}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Output: </span>
                        <span className="text-blue-400 font-mono">{example.output}</span>
                      </div>
                      <div className="text-sm text-slate-500">{example.explanation}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="mt-6">
                <h4 className="text-white font-medium mb-3">Constraints</h4>
                <ul className="space-y-2">
                  {challenge.constraints.map((constraint, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Code Editor Card */}
            <div className="bg-slate-900/50 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-cyan-300 text-lg font-semibold flex items-center gap-2">
                  <FaTerminal className="w-5 h-5 text-green-400" />
                  Code Editor
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="text-slate-400 border border-slate-600 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm transition"
                  >
                    <FaRedo className="inline w-4 h-4 mr-1" />
                    Reset
                  </button>
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || !code.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <FaPlay className="inline w-4 h-4 mr-1" />
                        Submit Solution
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg border border-slate-700">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Write your solution here..."
                  className="w-full h-64 p-4 bg-transparent text-slate-200 font-mono text-sm resize-none focus:outline-none"
                  spellCheck={false}
                />
              </div>

              {output && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-2">Output</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm border border-slate-700">
                    <pre className="text-green-400">{output}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Hint Card */}
            <div className="bg-slate-900/50 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm rounded-xl p-6">
              <button
                onClick={() => setShowHint(!showHint)}
                className="w-full justify-start text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/10 px-4 py-2.5 rounded-lg text-sm font-medium transition"
              >
                <FaLightbulb className="inline w-4 h-4 mr-2" />
                {showHint ? 'Hide Hint' : 'Show Hint'} (-25 pts)
              </button>
              {showHint && (
                <div className="mt-4 p-4 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <p className="text-yellow-200">{challenge.hint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Prizes Banner */}
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-6">
              <div className="text-center">
                <FaTrophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-yellow-300 mb-2">Daily Prizes</h3>
                <p className="text-yellow-200 mb-4">Top 3 solvers win mobile cards!</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-yellow-400">
                    <FaCrown className="w-5 h-5" />
                    <span className="font-bold">1st: {challenge.prizes.first.amount} {challenge.prizes.first.currency}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-300">
                    <FaMedal className="w-5 h-5" />
                    <span className="font-bold">2nd: {challenge.prizes.second.amount} {challenge.prizes.second.currency}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-orange-400">
                    <FaAward className="w-5 h-5" />
                    <span className="font-bold">3rd: {challenge.prizes.third.amount} {challenge.prizes.third.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Leaderboard */}
            <div className="bg-slate-900/50 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaTrophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-cyan-300 text-lg font-semibold">Live Leaderboard</h3>
              </div>
              
              <div className="space-y-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.user._id}
                      className={`p-3 rounded-lg border ${
                        entry.rank <= 3
                          ? entry.rank === 1
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : entry.rank === 2
                              ? 'bg-slate-400/10 border-slate-400/30'
                              : 'bg-orange-700/10 border-orange-700/30'
                          : 'bg-slate-700/30 border-slate-600/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{entry.user.fullName}</div>
                          <div className="text-xs text-slate-400">
                            Score: {entry.score} • Time: {entry.completionTime}ms
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                            #{entry.rank}
                          </div>
                          {entry.prize && (
                            <div className="text-xs text-yellow-300 font-medium">
                              {entry.prize.amount} {entry.prize.currency}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <FaTrophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No submissions yet</p>
                    <p className="text-sm">Be the first to solve!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Scoring Criteria */}
            <div className="bg-slate-900/50 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaBullseye className="w-5 h-5 text-blue-400" />
                <h3 className="text-cyan-300 text-lg font-semibold">Scoring Criteria</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Correctness</div>
                    <div className="text-xs text-slate-400">
                      {challenge.scoringCriteria?.correctness?.description || 'Code correctness and accuracy'}
                    </div>
                  </div>
                  <div className="text-blue-400 font-bold">
                    {Math.round((challenge.scoringCriteria?.correctness?.weight || 0.6) * 100)}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Speed</div>
                    <div className="text-xs text-slate-400">
                      {challenge.scoringCriteria?.speed?.description || 'Execution speed and efficiency'}
                    </div>
                  </div>
                  <div className="text-green-400 font-bold">
                    {Math.round((challenge.scoringCriteria?.speed?.weight || 0.2) * 100)}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Efficiency</div>
                    <div className="text-xs text-slate-400">
                      {challenge.scoringCriteria?.efficiency?.description || 'Memory usage and optimization'}
                    </div>
                  </div>
                  <div className="text-purple-400 font-bold">
                    {Math.round((challenge.scoringCriteria?.efficiency?.weight || 0.2) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* User Score Card - Professional */}
            <div className="bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-green-900/40 border border-green-500/30 rounded-xl p-6 shadow-lg shadow-green-500/10 backdrop-blur-sm relative overflow-hidden">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 animate-pulse"></div>
              
              <div className="relative z-10">
                <div className="text-center">
                  {/* Icon with animation */}
                  <div className="relative inline-block mb-3">
                    <FaStar className="w-10 h-10 text-green-400 animate-pulse" />
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-ping"></div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-300 mb-3">
                    Your Score
                  </h3>
                  
                  {/* Main score display */}
                  <div className="relative mb-3">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-300">
                      {userScore}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-sm"></div>
                  </div>
                  
                  {/* Status message */}
                  <p className="text-green-200 text-sm font-medium mb-4">
                    {userScore > 0 ? (
                      <span className="flex items-center justify-center gap-1">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Excellent performance!
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <FaCode className="w-4 h-4" />
                        Submit your solution to earn points
                      </span>
                    )}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-green-900/50 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((userScore / (challenge?.maxPoints || 100)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  
                  {/* Detailed stats */}
                  {userScore > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-green-500/30">
                      <div className="text-center">
                        <div className="text-green-300 text-xs font-medium">Max Points</div>
                        <div className="text-white font-bold">{challenge?.maxPoints || 100}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-300 text-xs font-medium">Performance</div>
                        <div className="text-white font-bold">{Math.round((userScore / (challenge?.maxPoints || 100)) * 100)}%</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Achievement badges */}
                  {userScore >= 80 && (
                    <div className="flex justify-center gap-2 mt-3">
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
                        🏆 Top Performer
                      </span>
                    </div>
                  )}
                  {userScore >= 60 && userScore < 80 && (
                    <div className="flex justify-center gap-2 mt-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                        ⭐ Good Job
                      </span>
                    </div>
                  )}
                  {userScore > 0 && userScore < 60 && (
                    <div className="flex justify-center gap-2 mt-3">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                        👍 Keep Going
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Stats */}
            {user && userStats && (
              <div className="bg-slate-900/50 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaStar className="w-5 h-5 text-purple-400" />
                  <h3 className="text-cyan-300 text-lg font-semibold">Your Stats</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Score</span>
                    <span className="text-green-400 font-bold text-lg">{userScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Problems Solved</span>
                    <span className="text-white font-medium">{userStats.totalSolved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Best Score</span>
                    <span className="text-green-400 font-medium">{userStats.bestScore || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prizes Won</span>
                    <span className="text-yellow-400 font-medium">{userStats.prizesWon || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Streak</span>
                    <span className="text-orange-400 font-medium">{userStats.currentStreak || 0} days</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

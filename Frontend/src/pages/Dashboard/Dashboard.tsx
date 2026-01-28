import React, { useEffect, useState } from 'react';
import {
  FaTrophy,
  FaUsers,
  FaCode,
  FaLaptopCode,
  FaBell,
  FaMoneyBillWave,
  FaUser,
  FaStar,
  FaChartLine,
  FaMedal,
  FaAward
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import axios from 'axios';

interface LeaderboardUser {
  name: string;
  points: number;
  rank: number;
  total_point: number;
  isCurrentUser?: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChallenges: 0,
    completedChallenges: 0,
    rank: 0,
    totalUsers: 0,
  });
  
  // Calculate current user's rank
  const currentUserRank = React.useMemo(() => {
    if (!user?._id) return 'N/A';
    const userInLeaderboard = leaderboard.find(
      item => item.name === (user?.username || user?.name) || item.isCurrentUser
    );
    return userInLeaderboard?.rank || 'N/A';
  }, [leaderboard, user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?._id) {
        setIsLoading(false);
        return;
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        // Fetch leaderboard data
        const [leaderboardRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/leaderboard`),
          axios.get(`${API_BASE_URL}/api/users/${user._id}/stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })
        ]);
        
        setLeaderboard(leaderboardRes.data);
        setStats(statsRes.data);
        
      } catch (error) {
        // Fallback to sample data if API fails
        setLeaderboard([
          { name: user?.username || user?.name || 'You', points: user?.points || 0, rank: 1, total_point: user?.points || 0, isCurrentUser: true },
          { name: '@Amanuel', points: 120, rank: 2, total_point: 300 },
          { name: '@Selam', points: 100, rank: 3, total_point: 200 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?._id, user?.points, user?.username, user?.name]);

  const activeTeams = [
    { name: 'Team Alpha', project: 'Chat App', progress: 70 },
    { name: 'Team Beta', project: 'Portfolio Builder', progress: 45 },
  ];

  const unreadCount = 3;
  const onprogress = 45;

  const handleJoin = () => {
    navigate('/weeklyChallenge');
  };

  const getPlanBadge = (plan?: string) => {
    if (!plan) {
      return <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">TRIAL</span>;
    }
    
    const planLower = plan.toLowerCase();
    switch (planLower) {
      case 'premium':
        return <span className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">PREMIUM</span>;
      case 'basic':
        return <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">BASIC</span>;
      case 'trial':
        return <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">TRIAL</span>;
      default:
        // Handle any custom plan names
        return <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">
          {plan.toUpperCase()}
        </span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Welcome Panel */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <h1 className="text-2xl md:text-4xl font-bold text-purple-400">
                  Welcome, {user?.name || 'Coder'}!
                </h1>
                {getPlanBadge(user?.plan)}
              </div>
              <p className="text-gray-400 mt-2">
                {user?.plan ? `Your plan: ${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} | ` : 'No active plan | '}
                Points: {user?.points || 0} | 
                Rank: #{currentUserRank}
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="relative">
                {user?.avatar || user?.profilePicture ? (
                  <img 
                    src={user?.avatar || user?.profilePicture} 
                    alt={user?.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="relative p-2 rounded-full hover:bg-gray-700 transition">
                  <FaBell className="w-6 h-6 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="p-2 rounded-full hover:bg-gray-700 transition"
                  title="View Profile"
                >
                  <FaUser className="w-6 h-6 text-purple-400" />
                </button>
              </div>
              <button 
                className="border-2 border-gray-600 hover:border-purple-500 px-6 py-3 rounded-lg font-semibold transition"
                onClick={() => navigate('/projects')}
              >
                View Projects
              </button>
            </div>
          </div>

        </div> {/* Close the welcome panel div */}
        
        {/* Panels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Weekly Challenge */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-blue-500/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FaLaptopCode className="text-blue-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Weekly Challenge</h2>
            </div>
            <p className="text-gray-400 mb-2">Build a Real-Time Chat App</p>
            <p className="text-gray-500 mb-4">Deadline: Nov 20, 2025</p>
            <p className="text-green-500 font-semibold mb-4">
              Prize: 2000 Birr + T-shirt + Feature
            </p>
            <button
              type="button"
              onClick={handleJoin}
              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition "
            >
              Join
            </button>

            {/* Progress Bar */}
            <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${onprogress}%` }}
              ></div>
            </div>
          </div>

          {/* Daily Coding Challenge */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-blue-300/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FaLaptopCode className="text-blue-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Daily Coding</h2>
            </div>
            <p className="text-gray-400 mb-4 ">
              Solve today's challenge: Build a REST API
            </p>
            <button
              type="button"
              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition "
            >
              Solve Now
            </button>
          </div>

          {/* Leaderboard */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-purple-500/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FaTrophy className="text-purple-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Top Developers</h2>
            </div>
            <ul className="space-y-2">
              {/* All users in the leaderboard */}
              {leaderboard.map((user, i) => (
                <li
                  key={i}
                  className="flex justify-between bg-gray-800 p-1 rounded-lg text-gray-300 border-l-4 border-purple-400 font-medium"
                >
                  <span>{user.rank}</span>
                  <span>{user.name}</span>
                  <span>{user.points} pts</span>
                </li>
              ))}

              {/* Your own rank and points at the bottom */}
              <li className="flex flex-col space-y-1 justify-between  p-1 rounded-lg text-white font-semibold  mt-4">
                <span>Your Rank: 25</span>
                <span>Total Points: 40</span>
              </li>
            </ul>
          </div>

          {/* project submitted*/}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-purple-500/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FaCode className="text-yellow-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">
                Projects Submitted
              </h2>
            </div>
            <p className="text-gray-400 mb-4 ">Total Projects Submitted: 15</p>

            <button
              type="button"
              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition "
            >
              View Projects
            </button>
          </div>

          {/* Active Teams */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-green-500/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FaUsers className="text-green-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Active Teams</h2>
            </div>
            {activeTeams.map((team, i) => (
              <div key={i} className="mb-3">
                <p className="text-gray-300 font-semibold">{team.name}</p>
                <p className="text-gray-400 text-sm mb-1">{team.project}</p>
                <div className="w-full h-2 bg-white/20 rounded-full">
                  <div
                    className="h-2 rounded-full bg-green-400"
                    style={{ width: `${team.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Mentorship */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-yellow-500/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FaCode className="text-yellow-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Mentorship</h2>
            </div>
            <p className="text-gray-400 mb-2">
              Upcoming session: JavaScript Debugging
            </p>
            <p className="text-gray-500 mb-4">Mentor: @ExpertDev</p>

            <button
              type="button"
              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition "
            >
              Join Session
            </button>
          </div>

          {/* {Community Engagement} */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-blue-400/30 transition">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <FaUsers className="text-blue-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">
                Community Engagement
              </h2>
            </div>

            {/* Stats */}
            <ul className="text-gray-400 mb-4 space-y-1">
              <li> Messages: 45</li>
              <li>Bug Fixes: 12</li>
            </ul>

            <p className="text-gray-500 mb-4">5 new discussions</p>

            {/* Button */}

            <button
              type="button"
              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition "
            >
              View Discussions
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-red-400/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FaBell className="text-red-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Notifications</h2>
            </div>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>New vote on your project!</li>
              <li>@Selam joined your team</li>
              <li>Challenge deadline approaching</li>
              <li>Mentor session starts in 1h</li>
            </ul>
          </div>

          {/* Earnings / Rewards */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-green-500/30 transition">
            <div className="flex items-center gap-3 mb-4">
              <FaMoneyBillWave className="text-green-400 w-6 h-6" />
              <h2 className="text-xl font-bold text-white">Rewards</h2>
            </div>
            <p className="text-gray-400 mb-2">Points earned this month: 230</p>
            <p className="text-green-400 font-semibold mb-4">
              Cash Prize: 2000 Birr
            </p>
            <button
              type="button"
              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition "
            >
              Withdraw
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

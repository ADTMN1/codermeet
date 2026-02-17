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

  FaAward,

  FaCheckCircle,

  FaLightbulb,

  FaCrown

} from 'react-icons/fa';



import { useNavigate, useSearchParams } from 'react-router-dom';

import { useUser } from '../../context/UserContext';

import { authService } from '../../services/auth';

import axios from 'axios';

import LoadingSpinner from '../../components/ui/loading-spinner';



interface DashboardLeaderboardUser {

  _id: string;

  name: string;

  username: string;

  points: number;

  rank: number;

  total_point: number;

  isCurrentUser?: boolean;

}



const Dashboard: React.FC = () => {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const { user } = useUser();

  const [leaderboard, setLeaderboard] = useState<DashboardLeaderboardUser[]>([]);
  const [exactRank, setExactRank] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const [paymentTxRef, setPaymentTxRef] = useState<string>('');

  const [stats, setStats] = useState({

    totalChallenges: 0,

    completedChallenges: 0,

    rank: 0,

    totalUsers: 0,

  });

  const [mentorshipSession, setMentorshipSession] = useState<any>(null);

  const [unreadCount, setUnreadCount] = useState(0);



  // Check for payment success in URL and recent payment completion

  useEffect(() => {

    const paymentSuccess = searchParams.get('payment');

    const txRef = searchParams.get('tx_ref');

    const token = searchParams.get('token');

    const userParam = searchParams.get('user');

    

    // Check if user just came from Chapa payment (look for recent payment in session)

    const sessionPayment = sessionStorage.getItem('recent_chapa_payment');

    

    // Handle token from URL (after payment)

    if (token && !user) {

      // Use the auth service to properly set the token

      authService.setToken(token);

      

      // Handle user data if provided

      if (userParam) {

        try {

          const userData = JSON.parse(decodeURIComponent(userParam));

          authService.login(token, userData);

        } catch (error) {

          // Error parsing user data - handle silently

        }

      }

      

      // Reload the page to trigger authentication check

      window.location.reload();

      return;

    }

    

    if (paymentSuccess === 'success' && txRef) {

      setShowPaymentSuccess(true);

      setPaymentTxRef(txRef);

      

      // Clear the URL parameters after showing the message

      const newUrl = window.location.pathname;

      window.history.replaceState({}, '', newUrl);

      

      // Clear the payment flag

      sessionStorage.removeItem('recent_chapa_payment');

    } else if (sessionPayment) {

      // Show success notification if user was just redirected from Chapa

      setShowPaymentSuccess(true);

      setPaymentTxRef(sessionPayment);

      sessionStorage.removeItem('recent_chapa_payment');

    }

  }, [searchParams, user]);

  

  // Calculate current user's rank

  const currentUserRank = React.useMemo(() => {

    if (!user?._id) return 'N/A';

    // Use exact rank from backend if available

    if (exactRank) {

      return exactRank;

    }

    // Fallback to searching in leaderboard

    const userInLeaderboard = leaderboard.find(item => item.name === (user?.username || user?.name) || item.isCurrentUser);

    return userInLeaderboard?.rank || 'N/A';

  }, [leaderboard, user, exactRank]);



  useEffect(() => {

    const fetchDashboardData = async () => {

      if (!user?._id) {

        setIsLoading(false);

        return;

      }



      try {

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        

        // Fetch leaderboard data, stats, mentorship session, and exact rank
        const [leaderboardRes, statsRes, mentorshipRes, rankRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/leaderboard`),
          axios.get(`${API_BASE_URL}/users/${user._id}/stats`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          }),
          axios.get(`${API_BASE_URL}/mentorship/upcoming`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          }),
          axios.get(`${API_BASE_URL}/users/rank`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })
        ]);
        
        setLeaderboard(leaderboardRes.data.users || []);
        setStats(statsRes.data);
        if (mentorshipRes.data.success) {
          setMentorshipSession(mentorshipRes.data.data);
        }
        
        // Set exact rank from backend
        if (rankRes.data.success && rankRes.data.rank) {
          setExactRank(rankRes.data.rank);
        }



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



  const onprogress = 45;



  // Fetch unread notification count

  const fetchUnreadCount = async () => {

    try {

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const token = localStorage.getItem('auth_token');

      

      if (!token) return;



      const response = await axios.get(`${API_BASE_URL}/users/notifications/count`, {

        headers: { Authorization: `Bearer ${token}` }

      });

      

      if (response.data?.success) {

        setUnreadCount(response.data.count || 0);

      }

    } catch (error) {
      // Error fetching unread count
    }

  };



  // Listen for new notifications

  useEffect(() => {

    if (user?._id) {

      fetchUnreadCount();

      

      const handleNewNotification = () => {

        setUnreadCount(prev => prev + 1);

        fetchUnreadCount(); // Refresh count from server

      };



      const handleNotificationUpdate = () => {

        fetchUnreadCount(); // Refresh count from server

      };



      window.addEventListener('new-notification', handleNewNotification);

      window.addEventListener('notification-updated', handleNotificationUpdate);

      

      return () => {

        window.removeEventListener('new-notification', handleNewNotification);

        window.removeEventListener('notification-updated', handleNotificationUpdate);

      };

    }

  }, [user?._id]);



  const handleJoin = () => {

    if (user?.plan?.toLowerCase() === 'trial') {

      alert('Upgrade to Basic or Premium plan to participate in challenges!');

      return;

    }

    navigate('/weeklyChallenge');

  };



  const handleSolveChallenge = () => {

    if (user?.plan?.toLowerCase() === 'trial') {

      alert('Upgrade to Basic or Premium plan to access coding challenges!');

      return;

    }

    navigate('/daily-challenge');

  };



  const handleMentorshipAction = () => {

    if (mentorshipSession) {

      // Join existing session

      alert(`Joining session: ${mentorshipSession.topic} with ${mentorshipSession.mentor.username}`);

      // In a real app, this would navigate to a video call or session page

      // navigate(`/mentorship/session/${mentorshipSession.id}`);

    } else {

      // Navigate to mentorship dashboard

      navigate('/mentorship-dashboard');

    }

  };



  const handleNotificationClick = () => {

    navigate('/notifications');

    setUnreadCount(0); // Reset count when clicked

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

        <LoadingSpinner size="lg" text="Loading dashboard..." />

      </div>

    );

  }



  return (

    <div className="flex min-h-screen bg-gray-900 text-gray-200">

      {/* Payment Success Notification */}

      {showPaymentSuccess && (

        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-blue-600 border-b border-green-500">

          <div className="max-w-7xl mx-auto px-4 py-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center space-x-3">

                <FaCheckCircle className="text-white text-2xl" />

                <div>

                  <h3 className="text-white font-semibold">Payment Successful!</h3>

                  <p className="text-green-100 text-sm">

                    Transaction {paymentTxRef} completed. Your subscription is now active.

                  </p>

                </div>

              </div>

              <button

                onClick={() => setShowPaymentSuccess(false)}

                className="text-white hover:text-green-200 transition-colors"

              >

                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                </svg>

              </button>

            </div>

          </div>

        </div>

      )}



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

                <button 

                  onClick={handleNotificationClick}

                  className="relative p-2 rounded-full hover:bg-gray-700 transition"

                  title="Notifications"

                >

                  <FaBell className="w-6 h-6 text-white" />

                  {unreadCount > 0 && (

                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2">

                      {unreadCount > 99 ? '99+' : unreadCount}

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



          {/* Trial User Upgrade Prompt */}

          {user?.plan?.toLowerCase() === 'trial' && (

            <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg border border-purple-500/30">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-semibold text-purple-300 mb-1">Upgrade Your Plan!</h3>

                  <p className="text-gray-300 text-sm">

                    Get full access to challenges, submit solutions, and compete for prizes. 

                    Upgrade to Basic or Premium to unlock all features.

                  </p>

                </div>

                <button 

                  onClick={() => navigate('/pricing')}

                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition cursor-pointer"

                >

                  Upgrade Now

                </button>

              </div>

            </div>

          )}

        </div>



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

              className={`text-heading font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer transition shadow-md ${

                user?.plan?.toLowerCase() === 'trial'

                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed hover:bg-gray-600'

                  : 'bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft hover:shadow-[0_0_15px_#C27AFF] shadow-md transition'

              }`}

              disabled={user?.plan?.toLowerCase() === 'trial'}

            >

              {user?.plan?.toLowerCase() === 'trial' ? 'Upgrade Required' : 'Join'}

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

              onClick={handleSolveChallenge}

              className={`text-heading font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer transition shadow-md ${

                user?.plan?.toLowerCase() === 'trial'

                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed hover:bg-gray-600'

                  : 'bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft hover:shadow-[0_0_15px_#C27AFF] shadow-md transition'

              }`}

              disabled={user?.plan?.toLowerCase() === 'trial'}

            >

              {user?.plan?.toLowerCase() === 'trial' ? 'Upgrade Required' : 'Solve Now'}

            </button>

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

              onClick={() => navigate('/projects')}

              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition"

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

            {mentorshipSession ? (

              <div>

                <p className="text-gray-400 mb-2">

                  Upcoming session: {mentorshipSession.topic}

                </p>

                <p className="text-gray-500 mb-4">

                  Mentor: {mentorshipSession.mentor.username}

                </p>

              </div>

            ) : (

              <div>

                <p className="text-gray-400 mb-2">

                  No upcoming sessions

                </p>

                <p className="text-gray-500 mb-4">

                  Book a session with a mentor

                </p>

              </div>

            )}



            <button

              type="button"

              onClick={handleMentorshipAction}

              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition"

            >

              {mentorshipSession ? 'Join Session' : 'Book Session'}

            </button>

          </div>



          {/* Community Engagement */}

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-blue-400/30 transition">

            <div className="flex items-center gap-3 mb-4">

              <FaUsers className="text-blue-400 w-6 h-6" />

              <h2 className="text-xl font-bold text-white">

                Community Engagement

              </h2>

            </div>



            <ul className="text-gray-400 mb-4 space-y-1">

              <li> Messages: 45</li>

              <li>Bug Fixes: 12</li>

            </ul>



            <p className="text-gray-500 mb-4">5 new discussions</p>



            <button

              type="button"

              onClick={() => navigate('/community')}

              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition"

            >

              View Community 

            </button>



           

          </div>



          {/* Leaderboard */}

          <div 

            className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-purple-500/30 transition cursor-pointer"

            onClick={() => navigate('/leaderboard')}

          >

            <div className="flex items-center gap-3 mb-4">

              <FaTrophy className="text-purple-400 w-6 h-6" />

              <h2 className="text-xl font-bold text-white">Leaderboard</h2>

            </div>

            <p className="text-gray-400 mb-2">View top developers and rankings</p>

            <p className="text-purple-400 font-semibold mb-4">

              Your Rank: #{currentUserRank}

            </p>

            <button

              type="button"

              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition"

            >

              View Rankings

            </button>

          </div>



          {/* Business Idea Competition */}

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-orange-500/30 transition">

            <div className="flex items-center gap-3 mb-4">

              <FaLightbulb className="text-orange-400 w-6 h-6" />

              <h2 className="text-xl font-bold text-white">Business Idea Competition</h2>

            </div>

            <p className="text-gray-400 mb-2">Submit your innovative startup idea</p>

            <p className="text-gray-500 mb-4">Deadline: Dec 15, 2025</p>

            <p className="text-orange-400 font-semibold mb-4">

              Grand Prize: 5000 Birr + Mentorship

            </p>

            <button

              type="button"

              onClick={() => navigate('/business-competition')}

              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#FF8C00] shadow-md transition"

            >

              Submit Idea

            </button>

          </div>



          {/* Earnings / Rewards */}

          <div 

            className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-green-500/30 transition cursor-pointer"

            onClick={() => navigate('/rewards')}

          >

            <div className="flex items-center gap-3 mb-4">

              <FaMoneyBillWave className="text-green-400 w-6 h-6" />

              <h2 className="text-xl font-bold text-white">Rewards</h2>

            </div>

            <p className="text-gray-400 mb-2">Track your points and achievements</p>

            <p className="text-green-400 font-semibold mb-4">

              Total Points: {user?.points || 0}

            </p>

            <button

              type="button"

              className="text-heading bg-neutral-primary box-border border border-transparent hover:bg-neutral-secondary-medium focus:ring-4 focus:ring-neutral-tertiary-soft font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none cursor-pointer hover:shadow-[0_0_15px_#C27AFF] shadow-md transition"

            >

              View Details

            </button>

          </div>

        </div>

      </main>

    </div>

  );

};



export default Dashboard;


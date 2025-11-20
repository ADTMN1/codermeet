import React from 'react';
import {
  FaTrophy,
  FaUsers,
  FaCode,
  FaLaptopCode,
  FaBell,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Sample data
  const leaderboard = [
    { name: '@Amanuel', points: 120, rank: 1, total_point: 300 },
    { name: '@Marta', points: 110, rank: 2, total_point: 250 },
    { name: '@Selam', points: 100, rank: 3, total_point: 200 },
  ];

  const activeTeams = [
    { name: 'Team Alpha', project: 'Chat App', progress: 70 },
    { name: 'Team Beta', project: 'Portfolio Builder', progress: 45 },
  ];

  const unreadCount = 3;
  const onprogress = 45;

  const handleJoin = () => {
    navigate('/weeklyChallenge');
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-200">
      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8">
        {/* Welcome Panel */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
              Welcome, Nati!
            </h1>
            <p className="text-gray-400">
              Your subscription: Premium Plan | Points: 230 | Rank: #2
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <button className="relative p-2 rounded-full hover:bg-gray-700 transition">
              <FaBell className="w-6 h-6 text-white" />

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2">
                  {unreadCount}
                </span>
              )}
            </button>
            <button className="border-2 border-gray-600 hover:border-purple-500 px-6 py-3 rounded-lg font-semibold transition">
              View Projects
            </button>
          </div>
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

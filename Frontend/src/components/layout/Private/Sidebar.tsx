import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaCode,
  FaProjectDiagram,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaUser,
} from 'react-icons/fa';
import { TbArrowLeftToArc } from 'react-icons/tb';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';

import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { to: '/community', label: 'Community', icon: <FaUsers /> },
    { to: '/developers', label: 'Find Developers', icon: <FaCode /> },
    { to: '/projects', label: 'Projects', icon: <FaProjectDiagram /> },
    { to: '/messages', label: 'Messages', icon: <FaComments /> },
    { to: '/settings', label: 'Settings', icon: <FaCog /> },
  ];

  const handlelogout = () => {
    navigate('/');
  };

  return (
    <aside
      className={`bg-gray-800 border-r border-gray-700 p-4 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Avatar → Profile Page */}
      <div className="flex justify-center mb-6 transition-all duration-300">
        <Link to="/profile">
          <Avatar
            className={`cursor-pointer hover:opacity-80 transition-all duration-300
        ${collapsed ? 'w-10 h-10' : 'w-20 h-20'}`}
          >
            <AvatarImage src="/bdu.jpg" />
            <AvatarFallback>
              <FaUser className="w-5 h-5 text-white" />
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Collapse toggle */}
      <div className="flex justify-between items-center mb-8 p-2 rounded">
        {!collapsed && (
          <h1 className="text-xl font-bold text-purple-400">CoderMeet</h1>
        )}

        {/* Arrow Toggle Button ONLY */}
        <div
          className="text-gray-400 text-2xl cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '☰' : <TbArrowLeftToArc />}
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'hover:bg-gray-700 text-gray-300'
              }`
            }
          >
            <span className="text-xl">{link.icon}</span>
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        className="mt-6 flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 text-red-400 transition"
        onClick={handlelogout}
      >
        <FaSignOutAlt /> {!collapsed && 'Logout'}
      </button>
    </aside>
  );
}

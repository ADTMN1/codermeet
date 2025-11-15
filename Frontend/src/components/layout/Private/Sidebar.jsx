import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaCode,
  FaProjectDiagram,
  FaComments,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import { TbArrowLeftToArc } from 'react-icons/tb';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { to: '/community', label: 'Community', icon: <FaUsers /> },
    { to: '/developers', label: 'Find Developers', icon: <FaCode /> },
    { to: '/projects', label: 'Projects', icon: <FaProjectDiagram /> },
    { to: '/messages', label: 'Messages', icon: <FaComments /> },
    { to: '/settings', label: 'Settings', icon: <FaCog /> },
  ];

  return (
    <aside
      className={`bg-gray-800 border-r border-gray-700 p-4 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Toggle */}
      <div
        className="flex justify-between items-center mb-8 cursor-pointer hover:bg-gray-700 p-2 rounded"
        onClick={() => setCollapsed(!collapsed)}
      >
        {!collapsed && (
          <h1 className="text-2xl font-bold text-purple-400">CoderMeet </h1>
        )}
        <div className="text-gray-400 text-2xl">
          {collapsed ? '☰' : <TbArrowLeftToArc />}
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-tl-xl transition ${
                isActive
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'hover:bg-gray-700'
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
        onClick={() => console.log('logout()')}
      >
        <FaSignOutAlt /> {!collapsed && 'Logout'}
      </button>
    </aside>
  );
}

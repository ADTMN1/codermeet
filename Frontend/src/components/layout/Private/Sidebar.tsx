import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaCode,
  FaProjectDiagram,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaBars,
} from 'react-icons/fa';
import { TbArrowLeft } from 'react-icons/tb';
import { Avatar, AvatarImage, AvatarFallback } from '../../ui/avatar';
import { useUser } from '../../../context/UserContext';

export default function Sidebar() {
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { to: '/community', label: 'Community', icon: <FaUsers /> },
    { to: '/developers', label: 'Find Developers', icon: <FaCode /> },
    { to: '/projects', label: 'Projects', icon: <FaProjectDiagram /> },
    { to: '/messages', label: 'Messages', icon: <FaComments /> },
    { to: '/settings', label: 'Settings', icon: <FaCog /> },
  ];

  const handleLogout = () => {
    // Clear user data from localStorage if needed
    localStorage.removeItem('user');
    navigate('/');
  };

  // Get user initials for fallback
  const getUserInitials = () => {
    if (!user?.name) return <FaUser className="w-4 h-4 text-white" />;

    return user.name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <aside
      className={`bg-gray-900 border-r border-gray-700 p-4 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      } min-h-screen sticky top-0`}
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between mb-8 p-2">
        {!collapsed && (
          <h1 className="text-xl font-bold text-purple-400 whitespace-nowrap">
            CoderMeet
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <FaBars className="w-5 h-5" />
          ) : (
            <TbArrowLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* User Profile Section */}
      <div className="flex flex-col items-center mb-8 transition-all duration-300">
        <Link
          to="/profile"
          className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity group"
        >
          <Avatar
            className={`border-2 border-purple-500 transition-all duration-300 ${
              collapsed ? 'w-12 h-12' : 'w-20 h-20'
            } group-hover:border-purple-400`}
          >
            <AvatarImage
              src={user?.profileImage || user?.avatar}
              alt={user?.name || 'User'}
              className="object-cover"
            />
            <AvatarFallback className="bg-purple-600 text-white font-semibold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>

          {!collapsed && user && (
            <div className="text-center">
              <p className="font-semibold text-white text-sm truncate max-w-[160px]">
                {user.name || 'Anonymous User'}
              </p>
              <p className="text-xs text-gray-400 truncate max-w-[160px]">
                {user.email || 'No email'}
              </p>
              {user.points !== undefined && (
                <p className="text-xs text-purple-400 mt-1">
                  {user.points} points
                </p>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.to;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-400 border-l-2 border-purple-400'
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }`
              }
              title={collapsed ? link.label : undefined}
            >
              <span
                className={`text-lg transition-colors ${collapsed ? 'mx-auto' : ''}`}
              >
                {link.icon}
              </span>
              {!collapsed && (
                <span className="font-medium whitespace-nowrap">
                  {link.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                  {link.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-6 flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 group"
        title={collapsed ? 'Logout' : undefined}
      >
        <FaSignOutAlt className={`text-lg ${collapsed ? 'mx-auto' : ''}`} />
        {!collapsed && <span className="font-medium">Logout</span>}

        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
            Logout
          </div>
        )}
      </button>
    </aside>
  );
}

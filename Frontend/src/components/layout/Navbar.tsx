import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-black/90 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-3xl font-extrabold font-mono tracking-wide custom-gradient-text animate-pulse">
              CoderMeet
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <a
              href="/"
              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"
            >
              Home
            </a>
            <a
              href="/discover"
              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"
            >
              Discover
            </a>
            <a
              href="/projects"
              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"
            >
              Projects
            </a>
            <a
              href="/community"
              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"
            >
              Community
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <button className="border-2  text-white px-4 py-2 rounded-md text-sm font-mono font-semibold shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5 hover:scale-105 transition duration-200">
              Login In
            </button>
            <button className="bg-purple-500 hover:bg-purple-500  text-white px-4 py-2 rounded-md text-sm font-mono font-semibold shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5 hover:scale-105 transition duration-200">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

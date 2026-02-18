import React from 'react';

import { Link, useNavigate } from 'react-router-dom';



const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (

    <nav className="bg-black/90 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center h-16">

          {/* Logo */}

          <div className="flex items-center">

            <span className="text-3xl font-extrabold font-mono tracking-wide custom-gradient-text animate-pulse">

              <Link to="/">CoderMeet</Link>

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

              href="/features"

              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"

            >

              Features

            </a>

            <a

              href="/pricing-info"

              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"

            >

              Pricing

            </a>

            <a

              href="/about"

              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"

            >

              About

            </a>

          </div>



          {/* Auth Buttons */}



          <div className="flex items-center space-x-4">

            <button 
              onClick={() => navigate('/login')}
              className="border-2 border-gray-600 hover:border-blue-400 text-white px-6 py-3 rounded-md text-sm font-mono font-semibold shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5 hover:scale-105 transition duration-200 cursor-pointer min-w-[80px] min-h-[44px] flex items-center justify-center"
            >
              Login In
            </button>

            <button 
              onClick={() => navigate('/signup')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-md text-sm font-mono font-semibold shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5 hover:scale-105 transition duration-200 cursor-pointer min-w-[80px] min-h-[44px] flex items-center justify-center"
            >
              Sign Up
            </button>

          </div>

        </div>

      </div>

      {/* </div> */}

    </nav>

  );

};



export default Navbar;


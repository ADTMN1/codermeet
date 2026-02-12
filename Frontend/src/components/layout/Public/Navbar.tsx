import React from 'react';

import { Link } from 'react-router-dom';



const Navbar: React.FC = () => {

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

              href="/mentorship"

              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"

            >

              Mentorship

            </a>

            <a

              href="/projects"

              className="text-gray-300 hover:text-blue-400 px-3 py-2 rounded-md text-md font-mono font-semibold transition duration-200 hover:underline underline-offset-4"

            >

              Projects

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

            <button className="border-2  text-white px-4 py-2 rounded-md text-sm font-mono font-semibold shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5 hover:scale-105 transition duration-200 cursor-pointer">

              <Link to="/login">Login In</Link>

            </button>

            <button className="bg-purple-500 hover:bg-purple-500  text-white px-4 py-2 rounded-md text-sm font-mono font-semibold shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5 hover:scale-105 transition duration-200 cursor-pointer">

              <Link to="/signup"> Sign Up</Link>

            </button>

          </div>

        </div>

      </div>

      {/* </div> */}

    </nav>

  );

};



export default Navbar;


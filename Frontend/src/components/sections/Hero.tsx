import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="py-24 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
          Welcome to CoderMeet
        </h1>
        <p className="text-xl text-gray-400 mb-8 leading-relaxed">
          Connect with developers, share projects, and learn together. A simple,
          fast, and friendly place to build your developer community.
        </p>

        {/* Exciting Prize Banner */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 p-1 shadow-2xl shadow-blue-400/50 animate-pulse">
          <div className="bg-black rounded-xl p-6">
            <div className="text-center">
              <div className="flex justify-center items-center gap-2 mb-3">
                <span className="text-4xl animate-bounce">🏆</span>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  COMPETE & WIN EVERY DAY!
                </h2>
                <span className="text-4xl animate-bounce animation-delay-200">🏆</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-lg p-4 border border-blue-400/30">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💰</span>
                    <div>
                      <p className="text-blue-400 font-bold text-lg">Daily Battles</p>
                      <p className="text-gray-300">Crack Codes & Win Cash!</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg p-4 border border-purple-400/30">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🎯</span>
                    <div>
                      <p className="text-purple-400 font-bold text-lg">Weekly Tournaments</p>
                      <p className="text-gray-300">Climb Ranks & Score Big!</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-blue-300 font-semibold animate-pulse">
                  🔥 Join 50,000+ Competitors! 🔥
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-purple-500 hover:bg-purple-400  text-white px-8 py-4 rounded-lg font-semibold text-lg transition duration-200 shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-0.5 hover:scale-105 cursor-pointer">
            <Link to="/login">Join Community</Link>
          </button>
          <button className="border-2 border-gray-600 hover:border-blue-400 text-gray-300 hover:text-blue-400 px-8 py-4 rounded-lg font-semibold text-lg transition duration-200 cursor-pointer">
            <Link to="/about">Discover More</Link>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;

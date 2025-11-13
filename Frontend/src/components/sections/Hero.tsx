import React from 'react';

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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-purple-500 hover:bg-purple-400  text-white px-8 py-4 rounded-lg font-semibold text-lg transition duration-200 shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-0.5 hover:scale-105">
            Join Community
          </button>
          <button className="border-2 border-gray-600 hover:border-blue-500 text-gray-300 hover:text-blue-400 px-8 py-4 rounded-lg font-semibold text-lg transition duration-200">
            View Projects
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;

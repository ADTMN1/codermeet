import React from 'react';
import { FaCode, FaUsers, FaLightbulb, FaRocket } from 'react-icons/fa';

const homeFeatures = [
  {
    icon: FaCode,
    title: 'Daily Challenges',
    description: 'Solve coding problems and improve your skills',
    color: 'text-blue-400',
  },
  {
    icon: FaUsers,
    title: 'Community',
    description: 'Connect with developers worldwide',
    color: 'text-green-400',
  },
  {
    icon: FaLightbulb,
    title: 'Innovation',
    description: 'Share ideas and collaborate on projects',
    color: 'text-purple-400',
  },
  {
    icon: FaRocket,
    title: 'Career Growth',
    description: 'Build your portfolio and advance your career',
    color: 'text-yellow-400',
  },
];

const HomeFeatures: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto py-16 space-y-12">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
        What You Can Do
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 md:px-0">
        {homeFeatures.map((feature) => (
          <div
            key={feature.title}
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg text-center"
          >
            <div className={`text-4xl mb-4 ${feature.color}`}>
              <feature.icon />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              {feature.title}
            </h3>
            <p className="text-gray-300 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 md:px-0">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">50K+</div>
          <p className="text-gray-400 text-sm">Developers</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400 mb-1">10K+</div>
          <p className="text-gray-400 text-sm">Projects</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400 mb-1">100+</div>
          <p className="text-gray-400 text-sm">Daily Challenges</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-1">24/7</div>
          <p className="text-gray-400 text-sm">Community</p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-xl border border-blue-400/30">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-3">
            🔥 BATTLE & WIN DAILY! 🔥
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 bg-blue-400/20 px-4 py-3 rounded-lg border border-blue-400/30">
              <span className="text-3xl animate-bounce">⚔️</span>
              <div>
                <p className="text-blue-400 font-bold text-lg">Code Warriors</p>
                <p className="text-white font-semibold">Crack Codes & Win!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-purple-400/20 px-4 py-3 rounded-lg border border-purple-400/30">
              <span className="text-3xl animate-bounce animation-delay-200">👑</span>
              <div>
                <p className="text-purple-400 font-bold text-lg">Rank Masters</p>
                <p className="text-white font-semibold">Climb & Score Big!</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-gray-300 mb-4 text-lg">
          Ready to join the battle?
        </p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 hover:from-blue-300 hover:via-purple-300 hover:to-pink-300 text-white px-8 py-3 rounded-lg font-semibold transition duration-200 shadow-lg hover:shadow-blue-400/40 transform hover:-translate-y-0.5 hover:scale-105 cursor-pointer"
        >
          Join Battle Now! ⚔️
        </button>
      </div>
    </section>
  );
};

export default HomeFeatures;

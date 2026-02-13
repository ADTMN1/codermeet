import React from 'react';
import { FaReact, FaJsSquare, FaPython, FaGitAlt } from 'react-icons/fa';
import { Card } from '../ui/card';

const features = [
  {
    title: 'Share Projects',
    description:
      'Publish your repositories and get feedback from the community.',
    color: 'text-blue-400',
  },
  {
    title: 'Find Collaborators',
    description: 'Search profiles and join teams working on exciting projects.',
    color: 'text-green-400',
  },
  {
    title: 'Join Events',
    description:
      'Participate in meetups, hackathons, and live coding sessions.',
    color: 'text-purple-400',
  },
];

const Features: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto py-16 space-y-12">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
        What You Can Do
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-6 md:px-0">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg"
          >
            <h3 className={`text-xl font-semibold mb-2 ${feature.color}`}>
              {feature.title}
            </h3>
            <p className="text-gray-300">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Hero Icon / Logo */}
      <div className="flex-1 flex justify-center mt-10 md:mt-0 space-x-6 animate-float">
        <FaReact className="text-blue-400 w-20 h-20" />
        <FaJsSquare className="text-yellow-400 w-20 h-20" />
        <FaPython className="text-green-400 w-20 h-20" />
        <FaGitAlt className="text-red-500 w-20 h-20" />
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Why Join CoderMeet?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Community Growth */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-blue-400 text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-white">Community Growth</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Connect with thousands of developers worldwide. Share knowledge, get feedback, and grow together in a supportive environment designed for coders at every level.
            </p>
          </div>

          {/* Skill Development */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-green-400 text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-white">Skill Development</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Access daily challenges, weekly contests, and mentorship programs. Sharpen your coding skills with real-world projects and expert guidance.
            </p>
          </div>

          {/* Career Opportunities */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-purple-400 text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-bold text-white">Career Opportunities</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Showcase your projects to potential employers. Get discovered by companies looking for talented developers and advance your career.
            </p>
          </div>

          {/* Learning Resources */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-yellow-400 text-2xl">📖</span>
              </div>
              <h3 className="text-xl font-bold text-white">Learning Resources</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Access comprehensive learning materials, tutorials, and documentation. Stay updated with the latest technologies and best practices.
            </p>
          </div>

          {/* Collaboration Tools */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-red-400 text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-white">Collaboration Tools</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Work on projects together, share code, and collaborate seamlessly. Built-in tools make team development efficient and enjoyable.
            </p>
          </div>

          {/* Recognition & Rewards */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300 transform hover:-translate-y-2 hover:scale-105 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-cyan-400 text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-white">Recognition & Rewards</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Earn badges, climb the leaderboard, and get recognized for your contributions. Celebrate your achievements and inspire others.
            </p>
          </div>
        </div>

       
      </div>
      {/* {final section} */}
    </section>
  );
};

export default Features;

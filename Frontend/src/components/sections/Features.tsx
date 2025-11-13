import React from 'react';
import { FaReact, FaJsSquare, FaPython, FaGitAlt } from 'react-icons/fa';
import Card from '../ui/Card';

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

        <Card />
      </div>
    </section>
  );
};

export default Features;

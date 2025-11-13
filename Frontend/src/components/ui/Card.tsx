import React from 'react';
import { FaReact, FaUsers, FaLaptopCode, FaRocket } from 'react-icons/fa';

const Card: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Card 1 */}
      <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center hover:shadow-lg hover:shadow-blue-500/30 transition duration-300">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-2xl text-white">
            {' '}
            <FaUsers />
          </span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">Connect</h3>
        <p className="text-gray-400">
          Meet developers from around the world and build meaningful
          connections.
        </p>
      </div>

      {/* Card 2 */}
      <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center hover:shadow-lg hover:shadow-green-500/30 transition duration-300">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-2xl text-white">
            <FaLaptopCode />
          </span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">Collaborate</h3>
        <p className="text-gray-400">
          Work on projects together and learn from each other's experiences.
        </p>
      </div>

      {/* Card 3 */}
      <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center hover:shadow-lg hover:shadow-purple-500/30 transition duration-300">
        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <span className="text-2xl text-white">
            <FaRocket />
          </span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">Grow</h3>
        <p className="text-gray-400">
          Level up your skills through community feedback and shared knowledge.
        </p>
      </div>
    </div>
  );
};
export default Card;

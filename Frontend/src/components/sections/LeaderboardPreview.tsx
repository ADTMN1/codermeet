import React, { useEffect, useState } from 'react';
import { FaCrown, FaCode, FaStar } from 'react-icons/fa';

const topUsers = [
  { name: '@Amanuel', points: 120 },
  { name: '@Marta', points: 110 },
  { name: '@Selam', points: 100 },
];

export default function LeaderboardPreview() {
  const [animatedPoints, setAnimatedPoints] = useState(topUsers.map(() => 0));

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPoints((prev) =>
        prev.map((p, i) => (p < topUsers[i].points ? p + 1 : p))
      );
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative max-w-6xl mx-auto py-24 px-6 text-center">
      {/* Gradient Title */}
      <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 mb-12 animate-pulse flex justify-center items-center gap-3">
        <FaCode /> Leaderboard
      </h2>

      {/* Terminal-Like Leaderboard */}
      <div className="bg-black/90 rounded-xl p-8 shadow-lg shadow-purple-500/30 font-mono text-left text-green-400 overflow-hidden">
        {topUsers.map((user, index) => (
          <div
            key={index}
            className="mb-6 relative group transition-all hover:scale-105"
          >
            {/* Username + rank */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-cyan-400 font-bold text-lg">
                {user.name}
              </span>
              {index === 0 && <FaCrown className="text-yellow-400" />}
              {index === 1 && <FaStar className="text-gray-400" />}
              {index === 2 && <FaStar className="text-orange-400" />}
            </div>

            {/* Animated progress bar */}
            <div className="bg-white/10 h-3 rounded-full overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 transition-all duration-500"
                style={{
                  width: `${(animatedPoints[index] / 120) * 100}%`,
                }}
              />
            </div>

            {/* Points line like code */}
            <p className="text-green-300 mt-1">
              {`// Score: ${animatedPoints[index]} pts`}
            </p>
          </div>
        ))}

        {/* Neon footer accent */}
        <div className="mt-8 h-1 w-32 mx-auto rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 animate-pulse"></div>
      </div>
    </section>
  );
}

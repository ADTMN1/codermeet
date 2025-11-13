import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaFire } from 'react-icons/fa';

const challengeCode = [
  '// Challenge: Build a Real-Time Chat App',
  '// Deadline: Nov 20, 2025',
  '// Prize: 2000 Birr + T-shirt + Internet Package',
  '// Teams: Solo or Random Team Assignment',
  '// Hint: Use WebSockets for real-time messaging',
  '// Remember: Leaderboard points for bug fixes, reviews & contributions',
];

export default function WeeklyChallenge() {
  const [displayedCode, setDisplayedCode] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex < challengeCode.length) {
      const timer = setTimeout(() => {
        setDisplayedCode((prev) => [...prev, challengeCode[lineIndex]]);
        setLineIndex(lineIndex + 1);
      }, 500); // time delay per line
      return () => clearTimeout(timer);
    }
  }, [lineIndex]);

  return (
    <section className="relative max-w-6xl mx-auto py-24 px-6 text-center">
      {/* Gradient Section Title */}
      <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 mb-12 flex justify-center items-center gap-3 animate-pulse">
        <FaFire /> Weekly Challenge
      </h2>

      {/* Terminal-like Code Output */}
      <div className="bg-black/90 p-8 rounded-xl text-left font-mono text-red-700 text-lg shadow-lg shadow-green-500/20 animate-fade-in">
        {displayedCode.map((line, index) => (
          <p key={index}>
            <span className="text-green-500">{'$> '}</span>
            {line}
          </p>
        ))}
        <span className="blinking-cursor">|</span>
      </div>

      {/* Join Button */}
      <Link
        to="/challenges"
        className="mt-8 inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-black font-mono font-bold px-10 py-4 rounded-full shadow-lg shadow-green-500/40 transition transform hover:-translate-y-1 hover:scale-105"
      >
        <FaRocket /> Join Now
      </Link>

      {/* Neon Accent */}
      <div className="mt-12 h-1 w-32 mx-auto bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 rounded-full animate-pulse"></div>

      {/* Custom styles */}
      <style>
        {`
          .blinking-cursor {
            display: inline-block;
            width: 1ch;
            animation: blink 1s step-start infinite;
            color: #00ff00;
          }
          @keyframes blink {
            50% { opacity: 0; }
          }
        `}
      </style>
    </section>
  );
}

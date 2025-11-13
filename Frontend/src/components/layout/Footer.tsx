import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 bg-black/80 backdrop-blur-md text-gray-400">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-90 transition"
        >
          CoderMeet
        </Link>

        {/* Social Links */}
        <div className="flex gap-6">
          <a
            href="https://github.com"
            target="_blank"
            className="hover:text-white transition text-lg"
            aria-label="GitHub"
          >
            <FaGithub />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            className="hover:text-blue-400 transition text-lg"
            aria-label="Twitter"
          >
            <FaTwitter />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            className="hover:text-blue-500 transition text-lg"
            aria-label="LinkedIn"
          >
            <FaLinkedin />
          </a>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="mt-6 text-center text-sm text-gray-500">
        © 2025 CoderMeet. Built with by the dev community.
      </div>
    </footer>
  );
};

export default Footer;

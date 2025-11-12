import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="text-center text-gray-500 mt-16 text-sm py-6 border-t border-gray-800">
      Built with ♥ —{' '}
      <a
        href="/about"
        className="text-blue-400 hover:text-blue-300 transition duration-200"
      >
        Learn more about CoderMeet
      </a>
    </footer>
  );
};

export default Footer;

import React from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Hero from './components/sections/Hero.js';
import Features from './components/sections/Features.js';

function App() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />
      {/* Footer */}
    </div>
  );
}

export default App;

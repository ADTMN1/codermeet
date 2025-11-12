import React from 'react';
import Navbar from './components/layout/Navbar.jsx';

function App() {
  return (
    <div className="min-h-screen bg-black text-gray-300 font-mono">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            Welcome to CoderMeet
          </h1>
          <p className="text-xl text-gray-400 mb-8 leading-relaxed">
            Connect with developers, share projects, and learn together. A
            simple, fast, and friendly place to build your developer community.
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

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Why Join CoderMeet?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center hover:shadow-lg hover:shadow-blue-500/30 transition duration-300">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl text-white">👥</span>
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
                <span className="text-2xl text-white">💻</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Collaborate
              </h3>
              <p className="text-gray-400">
                Work on projects together and learn from each other's
                experiences.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center hover:shadow-lg hover:shadow-purple-500/30 transition duration-300">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl text-white">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Grow</h3>
              <p className="text-gray-400">
                Level up your skills through community feedback and shared
                knowledge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 mt-16 text-sm py-6 border-t border-gray-800">
        Built with ♥ —{' '}
        <a
          href="/about"
          className="text-blue-400 hover:text-blue-300 transition duration-200"
        >
          Learn more about CoderMeet
        </a>
      </footer>
    </div>
  );
}

export default App;

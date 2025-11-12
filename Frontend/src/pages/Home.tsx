import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F2027] via-[#1A1A1D] to-black text-white font-sans px-6 md:px-10 py-12">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-10 mb-16 max-w-6xl mx-auto">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            to <span className="text-blue-400">CoderMeet</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Connect with developers, share projects, and learn together. A
            simple, fast, and friendly place to build your developer community.
          </p>

          <Link
            to="/explore"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 shadow-lg hover:shadow-blue-600/40"
          >
            Explore Projects
          </Link>
        </div>

        <div className="w-56 h-56 bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 rounded-xl flex items-center justify-center text-4xl font-bold text-blue-400 shadow-lg shadow-blue-900/40">
          CM
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">
          What You Can Do
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <article className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300">
            <h3 className="text-xl font-semibold mb-2 text-blue-400">
              Share Projects
            </h3>
            <p className="text-gray-300">
              Publish your repositories and get feedback from the community.
            </p>
          </article>

          {/* Card 2 */}
          <article className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300">
            <h3 className="text-xl font-semibold mb-2 text-green-400">
              Find Collaborators
            </h3>
            <p className="text-gray-300">
              Search profiles and join teams working on exciting projects.
            </p>
          </article>

          {/* Card 3 */}
          <article className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/20 transition duration-300">
            <h3 className="text-xl font-semibold mb-2 text-purple-400">
              Join Events
            </h3>
            <p className="text-gray-300">
              Participate in meetups, hackathons, and live coding sessions.
            </p>
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-400 mt-16 text-sm">
        Built with ♥ —{' '}
        <Link to="/about" className="text-blue-400 hover:text-blue-300">
          Learn more about CoderMeet
        </Link>
      </footer>
    </main>
  );
}
